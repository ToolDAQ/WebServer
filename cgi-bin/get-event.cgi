#!/bin/bash

fail() {
  echo 'Status: 400'
  echo
  echo "$1"
  exit
}

if ! [[ $REQUEST_URI =~ [\&?]event=([^\&])+ ]]; then
  fail 'Event number required'
fi

event=${BASH_REMATCH[1]}
if ! [[ $event =~ ^[0-9]+$ ]]; then
  fail "Invalid event number: $event"
fi

echo 'Content-type: text/csv'

psql -h localhost -U root -d daq --csv -c "
  select r->'x' x, r->'y' y, r->'z' z, r->'c' c, r->'t' t
    from event_display, jsonb_array_elements(data) r
    where evnt = $event
" 2>&1 |
sed '
  1{
    /^ERROR/{
      iStatus: 400
    }
    i
  }
'
