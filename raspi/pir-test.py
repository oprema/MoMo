import RPi.GPIO as GPIO
from time import gmtime, localtime, strftime, sleep

GPIO_27 = 27 # Pin 13
GPIO.setmode(GPIO.BCM)

def my_callback(channel):
  print("callback triggered: ", strftime("%a, %d %b %Y %H:%M:%S", localtime()))

GPIO.setup(GPIO_27, GPIO.IN)
GPIO.add_event_detect(GPIO_27, GPIO.RISING)
GPIO.add_event_callback(GPIO_27, my_callback)

i = 0
print("Program started at: ", strftime("%a, %d %b %Y %H:%M:%S", localtime()))
while True:
  print("%03d: Pin 13 (GPIO 27) level: %d" % (i, GPIO.input(GPIO_27)))
  sleep(1)
  i += 1
