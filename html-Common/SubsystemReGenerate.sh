#!/bin/bash

subsystem=$(basename `pwd`)

# Do nothing if the subsystem page has no tablist
tablist_file="tablist"
[[ -f "$tablist_file" ]] || exit 0


# Make $subsystem/index.html always redirect to the first tab in the tablist
index_file="index.html"
first_tab=$(head -n 1 "$tablist_file")
if [[ -f "$index_file" ]]; then
  if grep -q '<meta http-equiv="refresh"' "$index_file"; then
    sed -i "s|<meta http-equiv=\"refresh\"[^>]*>|<meta http-equiv=\"refresh\" content=\"0; url=./$first_tab\" />|" "$index_file"
  else
    sed -i "/<head>/a <meta http-equiv=\"refresh\" content=\"0; url=./$first_tab\" />" "$index_file"
  fi
fi


# Build sub-header
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
