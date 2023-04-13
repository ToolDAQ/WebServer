#!/bin/bash

read -d '' POST_DATA

echo -e "Content-type:text/html\r\n\r\n"
echo -e "<html><body>"

#echo $QUERY_STRING "<br>"
#echo -e "<br>"
#query=`echo $QUERY_STRING | sed "s/=/='/g; s/&/';/g; s/$/'/"`
#eval $query
#echo $query "<br>"

#echo $POST_DATA "<br>"
#POST_DATA="user=root&db=daq&command=insert into logs (time, name, log) values (now(), \"a\", \"b\")"
#echo $POST_DATA "<br>"
POST=`echo $POST_DATA |  sed "s/=/='/g; s/&/';/g; s/$/'/; s/'\"/\"/g" `
#echo $POST "<br>"
eval $POST
#user=root
#db=daq

#psql -D $db -H -c"$command" 
#echo "<br> 1)  $command <br>"
#echo `psql  -Uroot -ddaq -H -c"select * from monitoring " | sed '0,/table/s/table/table id=table/' `
# for query string ## command=`echo "$command" | sed s:*:*:g |sed s:'%20':' ':g | sed s:%27:\':g `
 command=`echo "$command" | sed s:*:*:g |sed s:'%20':' ':g | sed s:%27:\':g | sed s:\":\':g`

#echo $command
#command=`echo "select%20*%20from%20monitoring;" | sed s:*:*:g |sed s:'%20':' ':g`
#echo "<br> 2)  $command <br>"
#command="select * from monitoring"
# | sed s:'%20':' ':g`  
#echo "<br> 3) $command <br>"
#echo psql  -U$user -d$db -H -c"$command" 
#echo `psql  -U$user -d$db -H -c"$command" 2>&1 | sed '0,/table/s/table/table id=table/' `
echo `psql  -U$user -d$db -H -Tid=table -c"$command" 2>&1 `

#2>&1
echo -e "</html></body>"
