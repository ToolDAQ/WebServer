# WebServer

to create docker container with webserver in use:

linux:

      docker run --name=WebServer -v local_git_clone_path:/web --mount type=tmpfs,dst=/tmp,tmpfs-size=500M --net=host -dt tooldaq/newweb

Windows / MacOS:

(if client is on a differnt computer)

      docker run --name=WebServer -v local_git_clone_path:/web --mount type=tmpfs,dst=/tmp,tmpfs-size=500M -p 80:80 -p 5000:5000:udp -dt tooldaq/newweb

(if client is on the same computer)

      docker run --name=WebServer -v local_git_clone_path:/web --mount type=tmpfs,dst=/tmp,tmpfs-size=500M -p 80:80 -p 666:666 -dt tooldaq/newweb   

*note: If your using Windows or MacOs and want to comunicate to the web server on the same computer as any aplications running on the hostOS you will also need to run the Win_Mac_translation program in the background on the hostOS, this can be found in the standalone branch

      ./Win_Mac_translation &

To subsequently start and stop web server use:

      docker start WebServer
      docker stop WebServer


Note: Be aware that rapid stop and start may not allow the container to run as the system may have not released the port binding. To check if the web server really is running use:

      docker ps 

If Webserver is not listed wait a few mins and try to start again.
