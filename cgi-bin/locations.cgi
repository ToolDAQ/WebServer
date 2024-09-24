#!/bin/bash

echo 'Content-type: text/csv'

psql -h localhost \
     -U root \
     -d daq \
     --csv \
     -c 'select id, x x1, y y1, z z1 from pmt' \
     2>&1 |
sed '
  1{
     /^ERROR/{
       iStatus: 400
     }
     i
  }
'
