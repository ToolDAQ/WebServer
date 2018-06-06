# WebServer

to create docker container with webserver in use:

   docker run --name=WebServer -v local_git_clone_path:/web -p 80:80 -dt anniesoft/webserver bash -c "source /setup/Setup.sh; cp /web/httpd.conf /etc/httpd/conf/; httpd -X"

To subsequently start and stop web server use:

   docker start WebServer
   docker stop WebServer


Note: Be aware that rapid stop and start may not allow the container to run as the system may have not released the port binding. To check if the web server really is running use:

      docker ps 

If Webserver is not listed wait a few mins and try to start again.