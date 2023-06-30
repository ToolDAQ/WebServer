#include <iostream>
#include <vector>  
#include <string>  
#include <stdio.h>  
#include <stdlib.h> 
#include <fstream>
#include <sstream>

#include "zmq.hpp"



int main (){

      
  zmq::context_t context(1);

  zmq::socket_t query_sock (context, ZMQ_DEALER);
  int a=4800;
  query_sock.setsockopt(ZMQ_RCVTIMEO, a);
  query_sock.setsockopt(ZMQ_SNDTIMEO, a);

  // query_sock.connect("ipc:///tmp/feed0");
  query_sock.connect("tcp://127.0.0.1:3333");

  zmq::message_t msg(1);

  query_sock.send(msg);
  
  
  std::cout <<"Content-type:text/html\r\n\r\n";  
  std::cout<<"<html><body>"<<std::endl;

  

  zmq::message_t service_msg;
  query_sock.recv(&service_msg);

  while(service_msg.more()){

    std::istringstream iss(static_cast<char*>(service_msg.data()));
    std::cout<<iss.str()<<std::endl;

    query_sock.recv(&service_msg);

  }

  std::istringstream iss(static_cast<char*>(service_msg.data()));
  std::cout<<iss.str()<<std::endl;

  std::cout<<"<body/><html/>";
  
  
  return 0;
  
}
