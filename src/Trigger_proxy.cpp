#include <iostream>
#include <zmq.hpp>
#include <stdio.h>
#include <sstream>
#include <DAQUtilities.h>
#include <ServiceDiscovery.h>
#include <Store.h>

int main(){

  zmq::context_t context(1);

  std::string address("239.192.1.1");

  int port=5000;

  ServiceDiscovery SD(address,port,&context,13);

  DAQUtilities utils(&context);

  zmq::socket_t sub_sock (context, ZMQ_SUB);
  sub_sock.setsockopt (ZMQ_SUBSCRIBE, "", 0);
  
  zmq::socket_t pub_sock (context, ZMQ_PUB);
   
  utils.ZMQProxy("proxy", &sub_sock, &pub_sock);

  std::map<std::string, Store*> sub_connections;
  std::map<std::string, Store*> pub_connections;

  while(true){
    
    utils.UpdateConnections("", &sub_sock, sub_connections, "78787");
    utils.UpdateConnections("", &pub_sock, pub_connections, "78788");
   
    sleep(5);
    
  }


  return 0;

  }
