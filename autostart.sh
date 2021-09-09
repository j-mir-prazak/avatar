#!/bin/bash

cd /home/pi/avatar

xset s off
xset -dpms
unclutter -s 1
sudo unclutter -s 1

while true; do
	echo "$(date +%H:%M:%S/%d%m%y) ... STARTING LOOP..."
	node index.js $(cat /boot/avatar)
	echo "$(date +%H:%M:%S/%d%m%y) ... REPEAT.........."
	sleep 3
done
