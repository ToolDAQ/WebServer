#!/bin/bash
echo "

<head>
<meta http-equiv=\"refresh\" content=\"60\"><meta http-equiv=\"Content-Type\" content=\"text/html; charset=iso-8859-1\" /> <title>Monitoring</title>

</head>
"

echo `cat /web/html/header.html`

echo "

<p><a href=\"/cgi-bin/monitoringnr.cgi\">Disable refresh</a></p>

"
for file in `ls ../monitoringplots/`
do
 echo " <img src=\"/images/monitoringplots/$file\"  width=\"40%\" height=\"40%\"> "
done

echo "<p>"

echo `cat /web/html/footer.html`

                                                                                                                         
