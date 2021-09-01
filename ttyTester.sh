#!/bin/bash

TTY="./tty/ttyUSB0"

S1=0
S2=300

while true; do

	if [[ $S1 -gt 300 ]]; then S1=0; fi
	if [[ $S2 -lt 0 ]]; then S2=300; fi
	S1=$((S1+1))
	S2=$((S2-1))

	echo "$S1:$S2" >$TTY
	sleep 0.01

done
