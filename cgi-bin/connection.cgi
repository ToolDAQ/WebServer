#!/bin/bash

trap "exit" SIGPIPE

echo "Content-Type: text/event-stream"
echo "Cache-Control: no-cache"
echo ""

counter=0

while true; do
    {

	echo "id: $counter"
	echo "event: message"
	echo "data: #$counter `date`"
	echo ""
    } || exit 0  # Exit if writing fails (client disconnected)
    
    ((counter++))
    sleep 5
done
