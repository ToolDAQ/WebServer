#!/bin/bash

subsystem=$(basename `pwd`)

cat ../includes/headerC.html >subheader.html

for folder in `more tablist`
do
    echo "<a class=\"mdl-layout__tab\" href=\"/$subsystem/$folder\">$folder
            <span class=\"mdl-layout__tab-ripple-container mdl-js-ripple-effect\" data-upgraded=\",MaterialRipple\">
              <span class=\"mdl-ripple\"></span>
            </span>
          </a>" >>subheader.html
done

for folder in `more protected_tablist`
do
    echo "<a class=\"mdl-layout__tab\" href=\"/$subsystem/protected/$folder\">$folder
            <span class=\"mdl-layout__tab-ripple-container mdl-js-ripple-effect\" data-upgraded=\",MaterialRipple\">
              <span class=\"mdl-ripple\"></span>
            </span>
          </a>" >>subheader.html
done

cat ../includes/headerD.html >>subheader.html
