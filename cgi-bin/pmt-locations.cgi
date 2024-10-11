#!/bin/bash

echo 'Content-type: text/csv'

psql -h localhost \
     -U root \
     -d daq \
     --csv \
     -c 'select id, x, y, z, location from pmt order by id' \
     2>&1 |
{
  read line
  [[ $line =~ ^ERROR: ]] && echo 'Status: 400'
  echo
  [[ -n $line ]] && echo "$line"
  exec cat
}
