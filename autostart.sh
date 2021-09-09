#!/bin/bash

cd /home/pi/avatar

while true; do
	echo "$(date +%H:%M:%S/%d%m%y) ... STARTING LOOP..."
	node index.js $(cat /boot/avatar)
	echo "$(date +%H:%M:%S/%d%m%y) ... REPEAT.........."
	sleep 3
done
