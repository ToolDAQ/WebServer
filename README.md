# WebServer

To create Docker container with `WebServer` in use:

**Linux**:

      docker run --name=WebServer -v local_git_clone_path:/web --mount type=tmpfs,dst=/tmp,tmpfs-size=500M --net=host -dt tooldaq/server

**Windows** / **MacOS**:

(if client is on a different computer)

      docker run --name=WebServer -v local_git_clone_path:/web --mount type=tmpfs,dst=/tmp,tmpfs-size=500M -p 80:80 -p 5000:5000:udp -dt tooldaq/server

(if client is on the same computer)

      docker run --name=WebServer -v local_git_clone_path:/web --mount type=tmpfs,dst=/tmp,tmpfs-size=500M -p 80:80 -p 666:666 -p 667:667 -dt tooldaq/server   

*Note: If you're using Windows or macOs and want to communicate to the web server on the same computer as any applications running on the host OS, you will also need to run the `Win_Mac_translation` program in the background on the host OS, this can be found in the standalone branch

      ./Win_Mac_translation &

To subsequently start and stop web server use:

      docker start WebServer
      docker stop WebServer


Note: rapid stop and start may not allow the container to run as the system may have not released the port binding. To check if the web server really is running, use:

      docker ps 

If `WebServer` is not listed, wait a few minutes and try to start again.
