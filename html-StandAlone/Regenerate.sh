#!/bin/bash

cat includes/headerA.html >includes/header.html

for folder in `more tablist`
do
    echo "<a class=\"mdl-navigation__link\" href=\"/$folder\">$folder</a>" >> includes/header.html
done

cat includes/headerB.html >>includes/header.html
cat includes/headerE.html >includes/drawer.html

for folder in `more tablist`
do
    echo "<a class=\"mdl-navigation__link\" href=\"/$folder\">$folder</a>" >> includes/drawer.html
done


cat includes/headerF.html >>includes/drawer.html
