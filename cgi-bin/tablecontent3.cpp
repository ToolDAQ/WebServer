#include <iostream>
#include <vector>  
#include <string>  
#include <stdio.h>  
#include <stdlib.h> 
#include <fstream>


#include "ServiceDiscovery.h"


#include "zmq.hpp"



#include <boost/uuid/uuid.hpp>            // uuid class
#include <boost/uuid/uuid_generators.hpp> // generators
#include <boost/uuid/uuid_io.hpp>         // streaming operators etc.
#include <boost/date_time/posix_time/posix_time.hpp>

using namespace std;

int main (){

  
  boost::uuids::uuid m_UUID=boost::uuids::random_generator()();
  long msg_id=0;
  
  zmq::context_t *context=new zmq::context_t(3);
  
  
  std::vector<Store*> RemoteServices;
  
  std::string address("239.192.1.1");
  
  int port=5000;
  
  ServiceDiscovery *SD=new ServiceDiscovery(address,port,context,320);
  
  bool running=true;
  
  zmq::socket_t Ireceive (*context, ZMQ_DEALER);
  Ireceive.connect("inproc://ServiceDiscovery");
  
  sleep(7);
  
  zmq::message_t send(256);
  snprintf ((char *) send.data(), 256 , "%s" ,"All NULL") ;
  
  Ireceive.send(send);
  
  zmq::message_t receive;
  Ireceive.recv(&receive);
  std::istringstream iss(static_cast<char*>(receive.data()));
  
  int size;
  iss>>size;

  RemoteServices.clear();
  
  for(int i=0;i<size;i++){
    
    
    Store *service = new Store;
    
    zmq::message_t servicem;
    Ireceive.recv(&servicem);
    
    std::istringstream ss(static_cast<char*>(servicem.data()));
    service->JsonParser(ss.str());
    RemoteServices.push_back(service);
  }
  
  cout <<"Content-type:text/html\r\n\r\n";  
  cout<<"<html><body>"<<std::endl;
  
  for(int i=0;i<RemoteServices.size();i++){
    
    std::string ip;
    std::string port;
    std::string service;
    std::string status;
    std::string colour;
    
    ip=*((*(RemoteServices.at(i)))["ip"]);
    service=*((*(RemoteServices.at(i)))["msg_value"]);
    status=*((*(RemoteServices.at(i)))["status"]);
    port=*((*(RemoteServices.at(i)))["remote_port"]);
    
    
    cout<<i<<","<<ip<<","<<port<<","<<service<<","<<status<<std::endl;
    
   
  }
  
  cout<<"<body/><html/>";
  
  
  return 0;
  
}
