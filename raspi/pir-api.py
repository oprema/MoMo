from flask import Flask, jsonify, g
from flask_cors import CORS
import RPi.GPIO as GPIO
import sys, ctypes, os, logging
from time import gmtime, localtime, strftime, sleep
from datetime import datetime, timedelta
import sqlite3
from multiprocessing import Process, Queue
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText

# flush all out and load .env file 
sys.stdout.flush()
load_dotenv()

DATABASE = '/home/pi/pir-api.db'

GPIO_LED = 24 # Pin 18
GPIO_PIR = 27 # Pin 13

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(GPIO_LED, GPIO.OUT, initial=GPIO.LOW)
GPIO.setup(GPIO_PIR, GPIO.IN)

PIR_TIMEOUT = 5*60 # 5 mins

app = Flask(__name__)
CORS(app)
q = Queue()

if __name__ != '__main__':
  gunicorn_logger = logging.getLogger('gunicorn.error')
  app.logger.handlers = gunicorn_logger.handlers
  app.logger.setLevel(gunicorn_logger.level)

def get_db():
  db = getattr(g, '_database', None)
  if db is None:
    db = g._database = sqlite3.connect(DATABASE)
    return db

@app.teardown_appcontext
def close_connection(exception):
  db = getattr(g, '_database', None)
  if db is not None:
    db.close()

def init_db():
  with app.app_context():
    db = get_db()
    with app.open_resource('./schema.sql', mode='r') as f:
      db.cursor().executescript(f.read())
      db.commit()

def query_db(query, args=(), one=False):
  cur = get_db().execute(query, args)
  rv = cur.fetchall()
  cur.close()
  return (rv[0] if rv else None) if one else rv

def replace_db(table, fields=(), values=()):
  db = get_db()
  cur = db.cursor()
  query = 'REPLACE INTO %s (%s) VALUES (%s)' % (
    table,
    ', '.join(fields),
    ', '.join(['?'] * len(values))
  )

  cur.execute(query, values)
  db.commit()
  id = cur.lastrowid
  cur.close()
  return id

def update_last():
  now = datetime.now()

  lastT = now.strftime('%H:%M')
  lastD = now.strftime('%Y-%m-%d')

  with app.app_context():
    replace_db('_last', ['id', 'lastD', 'lastT'], [1, lastD, lastT])

def get_last():
  last = query_db("SELECT lastT, lastD FROM _last WHERE id = 1", one=True)
  lastT, lastD = last

  return {
    'date': lastD,
    'time': lastT,
    'timeout': '6',
    'active': 'true'
  }

def h_index(h):
  if (h >= 6 and h < 9):
    return 0
  elif (h >= 9 and h < 12):
    return 1
  elif (h >= 12 and h < 15):
    return 2
  elif (h >= 15 and h < 18):
    return 3 
  elif (h >= 18 and h < 21):
    return 4
  return -1

def update_motions(lastIndex):
  now = datetime.now()
  h = int(now.strftime('%H'))

  with app.app_context():
    motions = get_motions()

  index = h_index(h)
  if index >= 0:
    if lastIndex != index:
      lastIndex = index
      motions[index] = 0

    motions[index] += 1

  with app.app_context():
    replace_db('_motions', ['id', 'motions'], [1, ','.join([str(i) for i in motions])])
  return lastIndex

def get_motions():
  motions = query_db("SELECT motions FROM _motions WHERE id = 1", one=True)

  if motions == None:
    motions = [0, 0, 0, 0, 0, 0]
  else:
    motions = list(map(int, motions[0].split(',')))

  app.logger.debug('Motions list: %s' % motions[:])
  return motions

def send_email(to, subject, body):
  SMTP_SERVER = os.getenv('SMTP_SERVER')
  SMTP_LOGIN = os.getenv('SMTP_LOGIN')
  SMTP_PASSWD = os.getenv('SMTP_PASSWD')

  server = smtplib.SMTP(SMTP_SERVER, 587)

  server.ehlo()
  server.starttls()
  server.ehlo()

  # Next, log in to the server
  server.login(SMTP_LOGIN, SMTP_PASSWD)

  msg = MIMEText(body)
  msg['From'] = 'noreply@' + SMTP_SERVER
  msg['To'] = to
  msg['Subject'] = subject

  # Send the mail
  server.send_message(msg)
  server.quit()

def pir_callback(channel):
  q.put(datetime.now())

def get_uptime():
  uptimes = os.getenv('UPTIME').split('-')
  _from = uptimes[0].split(':')
  _to = uptimes[1].split(':')
  return list(map(int, _from)) + list( map(int, _to))

def get_active(now):
  fromH, fromM, toH, toM = get_uptime()
  _from = now.replace(hour=fromH, minute=fromM, second=0)
  _to = now.replace(hour=toH, minute=toM, second=0)
  return True if now > _from and now < _to else False

def pir_loop(q):
  lastTrigger, lastIndex, cnt = datetime(1970, 1, 1), -1, 0
  warn_sent, alert_sent = True, True

  GPIO.add_event_detect(GPIO_PIR, GPIO.RISING)
  GPIO.add_event_callback(GPIO_PIR, pir_callback)

  alert_delay = int(os.getenv('ALERT_AFTER_MINS')) * 60
  warn_delay = int(os.getenv('WARN_AFTER_MINS')) * 60

  app.logger.info("New thread waiting for PIR motions")
  while True:
    if not q.empty():
      # a motion was detected
      trigger = q.get()

      # obey motion timeout
      if lastTrigger + timedelta(0, PIR_TIMEOUT) < trigger:
        app.logger.debug("New motion detected and registered")
        update_last()
        lastIndex = update_motions(lastIndex)
        lastTrigger = trigger
        warn_sent, alert_sent = False, False
      else:
        # motion detected but not registered
        app.logger.debug("New motion detected but not registered")
    else:
      now = datetime.now()
      active = get_active(now)
      if active:
        if not warn_sent and (lastTrigger + timedelta(0, warn_delay) < now):
          warn_emails = os.getenv('WARN_EMAILS_TO').split(',')
          app.logger.info("Send Warn E-Mails to %s" % warn_emails)
          for email in warn_emails:
            send_email(email, "MoMo-Warning",
              os.getenv('WARN_EMAIL_BODY'))
          warn_sent = True
        if not alert_sent and (lastTrigger + timedelta(0, alert_delay) < now):
          alert_emails = os.getenv('ALERT_EMAILS_TO').split(',')
          app.logger.info("Send Alert E-Mails to %s" % alert_emails)
          for email in alert_emails:
            send_email(email, "MoMo-Alert",
              os.getenv('ALERT_EMAIL_BODY'))
          alert_sent = True
      if not (cnt % 12):
        app.logger.debug("PIR loop still is executing (%06dm - %sactive)" %
          (cnt/12, "not " if not active else ""))
    sys.stdout.flush()
    cnt += 1
    sleep(5)

@app.route('/pir/api/v1/last')
def last():
  GPIO.output(GPIO_LED, GPIO.HIGH)
  return jsonify(get_last())

@app.route('/pir/api/v1/hourly')
def hourly():
  GPIO.output(GPIO_LED, GPIO.LOW)

  try:
    # Initialize a list of hourly motions
    motionList = []
    motions = get_motions()

    # create a instances for filling up employee list
    for i in range(0, 6):
      motionDict = {
        'hour': str(i * 3 + 6),
        'count': str(motions[i] if i<5 else '0')
      }
      motionList.append(motionDict)

  except Exception as e:
    print(e.message, e.args)

  return jsonify(motionList)

def main():
  init_db()

  # start with current date and time
  update_last()

  app.logger.info("Start PIR server.")
  p = Process(target=pir_loop, args=(q, ))
  p.start()
  # execute only if we do not use gunicorn
  if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
    p.join()

main()
