#!/bin/bash

read -d '' POST_DATA

#echo  -e "Content-type:text/plain \n"
echo -n -e "Content-type:text/plain\r\n\r\n"
#echo  "<html><body>"

#echo $POST_DATA
eval $POST_DATA
#echo  "<div id=\"unameout\">$uname</div>"
echo -n "user=$uname"
#echo $password
#echo  "<body/><html/>"

#echo  -n "<html><body><div id=\"unameout\">$uname</div><body/><html/>"

#POST=`echo $POST_DATA |  sed "s/=/='/g; s/&/';/g; s/$/'/; s/'\"/\"/g" `
#eval $POST
