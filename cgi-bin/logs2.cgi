#!/bin/bash


#echo "
#Content-type:text/html
echo "
<html><body>
"

for file in `ls ../logs`
do
    echo "<a href=\"../logs/$file\"> $file </a>                                                                                                              

 
<div id=$file align='left' style=\"#ccc;font:12px/13px Georgia, Garamond, Serif;overflow:scroll;border:2px solid;padding:1%;height:200px\">"

    tail ../logs/$file > /tmp/$file -n 15

    while IFS='' read -r line || [[ -n "$line" ]]; do
        echo "$line <br />"
    done <  /tmp/$file

  echo "</div><p>

<script type=\"text/javascript\">

var divid = document.getElementById(\"$file\");

divid.scrollTop = divid.scrollHeight;"
  #divid.scrollLeft = divid.scrollWidth
  
  echo "</script>"
  

done

echo"
<body/><html/>
"
