# Stand alone DAQInterface library

This code provides an interface library to the SQL databases, monitoring and slow control systems. 


# Instalation

To get dependencies (boost and ZMQ):

      ./GetDepenencies.sh

Or if you already have them you can change the Makefile paths to point to your local copt of ZMQ & Boost 

To compile run:

      make

This will produce:

    1) The DAQ Interface shared object library (lib/LibDAQInterface.so) that can be used in your stand alone code:
    2) An Example program demonstraiting the interfaces usage (see Example.cpp)
    3) A command line remote control package for sending slow control commands (RemoteControl)
    4) A Windows and MacOS interface translation program (Win_Mac_translation)


# Usage/Execution

To use the DAQ library in your own standalone program include the header in your code 
  
    #include <DAQInterface.h>

and compile with g++ yourprogram.cpp -o yourprogram -I <path to repo>/include -L <path to repo>/lib -lDAQInterface

For detials of the interface see inlcude/DAQInterface.h and for an example please read Example.cpp

To execute add <path to repo>/lib to your LD_LIBRARY_PATH or

    source Setup.sh


# Example

To run the example:

    source Setup.sh
    ./Example

Note: If your using Windows or MacOS and web server is running in a container on the same computer as your stand alone application, which is running on the host OS. Then due to the limitations of the networking on docker desktop on those platforms, you will need to first run the Win_Mac_translation application in the background for the features to work

    ./Win_Mac_translation &
