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


  zmq::message_t send(9);
  snprintf ((char *) send.data(), 9 , "%s" ,"All NULL") ;
  
  zmq::message_t receive;
  
  Store service;
 
  
  while(true){
    
    // std::ofstream myfile ("/web/cgi-bin/table_file");
    std::ofstream myfile ("/tmp/table_file");
    if (myfile.is_open())
      {
	
	myfile<<"Content-type:text/html"<<std::endl<<std::endl<<"<html><body>"<<std::endl;
	
	Ireceive.send(send);
	
	
	Ireceive.recv(&receive);
	std::istringstream iss(static_cast<char*>(receive.data()));
	
	int size;
	iss>>size;
	
	
	for(int i=0;i<size;i++){
	  
	  
	  Ireceive.recv(&receive);
	  
	  std::istringstream ss(static_cast<char*>(receive.data()));
	  service.JsonParser(ss.str());
	  
	  myfile<<i<<","<<(*(service["ip"]))<<","<<(*(service["remote_port"]))<<","<<(*(service["msg_value"]))<<","<<(*(service["status"]))<<std::endl;
	  
	  
	}
	
	myfile<<std::endl<<"<body/><html/>"<<std::endl;
	myfile.close();
	
	sleep(2);
      }
    
  }
  
  
  return 0;
  
}
