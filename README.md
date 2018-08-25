# Using a Raspberry Pi for unobtrusive surveillance or how to know someone is moving around in a flat or a house?

Unobtrusive surveillance? Are you kidding? There is no such thing. Let me explain: In many places around the world demographic change is happening. Although older, people still prefer to stay independant and live at home. Not a problem, you say, as long as a elderly is fit.  True, and the most obvious approach is for a family member to check-in daily to be sure everything is ok. A phone call is good too, but the more often you have to call or check in the more stressful it gets for all parties.
Today, in times of cheap computing and the internet there are other possibilites.
One of these that I had fun implementing uses a Raspi with a PIR-Sensor (pasive infrared sensor) and a React-App to see when the last infrared-emitting, moving object passed the PIR sensor.  This could be your relative or it could also be a [cat on a roomba](https://youtu.be/tLt5rBfNucc).

The App logs every movement within a specific (configurable) duration. If no one passes the sensor within that duration the app sends an alert email to a configurable number of email addresses.

### Below is all you need to build a MoMo device yourself

1. A Raspberry Pi (any type will do it).
2. A PIR-Sensor (cheap at ebay for example).
3. Some wiring (solder or with pre-fabricated cables).
4. An internet connection in your relative's home.
5. An internet router that can redirect http(s) traffic to the Raspi.
6. A static IP or a DynDNS-Service pointing to the IP of the current internet connection.

To get you thinking about how this could work in your situation, let me show you an App screenshot.
What you see is a clock and a circle that changes color the longer it has been since the last movement was detected, some infos (status and last movement) and on the bottom, a simple chart that counts movements during certain durations.

<img src="/screenshot/momo.png" width="800">

### Placing the PIR-Sensor

The best location for the sensor is somewhere your relative will reliably pass by as often as possible. For example: In front of the refrige or somewhere on the way to the bathroom.

### Wiring Plan: PIR-Sensor <-> Raspi
```
Sensor    Raspi   
5.0V      5.0V    - Pin 17   
PIR-OUT   GPIO.27 - Pin 13   
GND       GND     - Pin 20   
```

## Installation of the Client (React part)

First install Node as described in: https://github.com/audstanley/NodeJs-Raspberry-Pi
```
sudo apt install git
wget -O - https://raw.githubusercontent.com/audstanley/NodeJs-Raspberry-Pi/master/Install-Node.sh | sudo bash
node --version
```
Clone this repository directly into /home/pi and execute
```
npm install
npm run build
sudo npm install -g serve
serve -n -s build -l 3000
```
For a more flexible setting you can separate client and server. This allows you to have the PIR-Sensor closer to a more often frequented spot (with an additonal Raspi as PIR-server for example).

## Installation of the Server (we use gunicorn for production)
```
cd raspi
sudo apt install python3-dev python3-pip
pip3 install flask flask_cors RPi.GPIO python-dotenv
sudo pip3 install gunicorn
```
Next rename .env-example into .env and fill out the missing entries
in this file.

Finally add the lines below to start client and server in your crontab with crontab -e
```
@reboot cd raspi && gunicorn -c ./pir-api.config.py pir-api:app
@reboot serve -s build -p 3000
```
## Todo

- More configuration params
- Using nginx as proxy for gunicorn with ssl support
- Text message (SMS) alerts through twilio or another such service

## Thanks to
Dan Conrad for his DayLight App which was a really good starter for MoMo. You can see it here: [https://github.com/danmconrad/daylight.git](https://github.com/danmconrad/daylight.git).


