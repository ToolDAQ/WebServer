#include <iostream>
#include <vector>  
#include <string>  
#include <stdio.h>  
#include <stdlib.h> 
#include <fstream>
#include <sstream>

#include "ServiceDiscovery.h"


#include "zmq.hpp"



#include <boost/uuid/uuid.hpp>            // uuid class
#include <boost/uuid/uuid_generators.hpp> // generators
#include <boost/uuid/uuid_io.hpp>         // streaming operators etc.
#include <boost/date_time/posix_time/posix_time.hpp>

int main (){

  
  boost::uuids::uuid m_UUID=boost::uuids::random_generator()();
  long msg_id=0;
  
  zmq::context_t context(1);
   
  std::string address("239.192.1.1");
  
  int port=5000;
  
  ServiceDiscovery SD(address,port,&context,13);
  
  bool running=true;
  
  zmq::socket_t Ireceive (context, ZMQ_DEALER);
  Ireceive.connect("inproc://ServiceDiscovery");
 

  zmq::socket_t query_sock(context, ZMQ_ROUTER);
  //  query_sock.bind("ipc:///tmp/feed0");
  int a=20000;
  query_sock.setsockopt(ZMQ_RCVTIMEO, a);
  query_sock.setsockopt(ZMQ_SNDTIMEO, a);

  query_sock.bind("tcp://*:3333");

  while(true){

    zmq::message_t Identity;
    query_sock.recv(&Identity);
    query_sock.send(Identity, ZMQ_SNDMORE);

    zmq::message_t query_msg;
    
    query_sock.recv(&query_msg);
      
    zmq::message_t send(9);
    snprintf ((char *) send.data(), 9 , "%s" ,"All NULL") ;
    
    Ireceive.send(send);


    zmq::message_t receive;
    Ireceive.recv(&receive);
    std::istringstream iss(static_cast<char*>(receive.data()));
    
    int size;
    iss>>size;
    
   
    for(int i=0;i<size;i++){
      
      Store *service = new Store;
      
      zmq::message_t servicem;
      Ireceive.recv(&servicem);
      
      std::istringstream ss(static_cast<char*>(servicem.data()));
      service->JsonParser(ss.str());
  
      std::stringstream reply_stream;
      reply_stream<<i<<","<<(*((*service)["ip"]))<<","<<(*((*service)["remote_port"]))<<","<<(*((*service)["msg_value"]))<<","<<(*((*service)["status"]));

      zmq::message_t reply(reply_stream.str().length()+1);
      snprintf ((char *) reply.data(), reply_stream.str().length()+1 , "%s" ,reply_stream.str().c_str()) ;
     
      query_sock.send(reply, ZMQ_SNDMORE);
      
    }


    query_sock.send(query_msg, ZMQ_NOBLOCK);


  }
  
  
  return 0;
  
}
