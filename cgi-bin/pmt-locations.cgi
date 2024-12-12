#!/bin/bash

if [[ -z $PGUSER ]]; then
  export PGUSER=root
fi
if [[ -z $PGDATABASE ]]; then
  export PGDATABASE=daq
fi
if [[ -z $PGHOST ]]; then
  export PGHOST=127.0.0.1
fi

psql --csv -c 'select id, x, y, z, location from pmt order by id' 2>&1 |
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
