#!/bin/bash

query() {
  psql -h localhost -U root -d daq --csv "$@" 2>&1 |
  {
    read line
    [[ $line =~ ^ERROR: ]] && echo 'Status: 400'
    echo
    [[ -n $line ]] && echo "$line"
    exec cat
  }
}

if ! [[ $REQUEST_URI =~ [\&?]event=([^\&])+ ]]; then
  echo 'Content-type: text/plain'
  query -tc 'select evnt from event_display'
  exit 0
fi

event=${BASH_REMATCH[1]}
if ! [[ $event =~ ^[0-9]+$ ]]; then
  echo 'Status: 400'
  echo
  echo "Invalid event number: $event"
  exit 0
fi

echo 'Content-type: text/csv'

query -c "select * from event_display where evnt = $event"
