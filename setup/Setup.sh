#! /bin/bash

cd /web/cgi-bin
make

export LD_LIBRARY_PATH=/setup/ToolDAQFramework/lib:/setup/boost_1_66_0/install/lib:/setup/cgicc/lib:/setup/zeromq-4.0.7/lib:$LD_LIBRARY_PATH
