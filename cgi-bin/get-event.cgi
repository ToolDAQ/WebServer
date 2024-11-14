#!/bin/bash

query() {
  psql -h localhost -U root -d daq --csv -c "$@" 2>&1 |
  {
    IFS= read line
    if [[ $line =~ ^ERROR: ]] || [[ $line =~ ^psql ]]; then
      echo 'Content-type: text/plain'
      echo 'Status: 400'
    else
      echo 'Content-type: text/csv'
    fi
    echo
    if [[ -n $line ]]; then
      echo "$line"
    fi
    exec cat
  }
}

if ! [[ $REQUEST_URI =~ [\&?]event=([^\&]+) ]]; then
  echo 'Content-type: text/plain'
  query 'select evnt, time from event_display order by time'
  exit 0
fi

event=${BASH_REMATCH[1]}
if ! [[ $event =~ ^[0-9]+$ ]]; then
  echo 'Status: 400'
  echo
  echo "Invalid event number: $event"
  exit 0
fi

query "select * from event_display where evnt = $event"
