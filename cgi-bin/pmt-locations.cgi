#!/bin/bash


psql -h localhost \
     -U root \
     -d daq \
     --csv \
     -c 'select id, x, y, z, location from pmt order by id' \
     2>&1 |
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
