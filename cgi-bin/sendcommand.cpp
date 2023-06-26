#include <iostream>
#include <vector>  
#include <string>  
#include <stdio.h>  
#include <stdlib.h> 
#include <sstream>

#include <cgicc/CgiDefs.h> 
#include <cgicc/Cgicc.h> 
#include <cgicc/HTTPHTMLHeader.h> 
#include <cgicc/HTMLClasses.h>  


#include "ServiceDiscovery.h"

#include "zmq.hpp"



#include <boost/uuid/uuid.hpp>            // uuid class
#include <boost/uuid/uuid_generators.hpp> // generators
#include <boost/uuid/uuid_io.hpp>         // streaming operators etc.
#include <boost/date_time/posix_time/posix_time.hpp>

using namespace std;
using namespace cgicc;

int main (){

  boost::uuids::uuid m_UUID=boost::uuids::random_generator()();
  long msg_id=0;
    
   
  zmq::context_t *context=new zmq::context_t(1);

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


  ///////////////response /////////////////
  Cgicc formData;

  std::string UUID;
  std::string command;
  std::string var1;
  std::stringstream response;

  form_iterator fi = formData.getElement("UUID");
  if( !fi->isEmpty() && fi != (*formData).end()) {
    UUID= **fi;
    form_iterator ti = formData.getElement("command");
    if( !ti->isEmpty() && ti != (*formData).end()) {
      command= **ti;

      std::stringstream tmp(command);
      tmp >> command>> std::ws;
      getline(tmp, var1);

      int ServiceNum=-1;

      for(int i=0;i<RemoteServices.size();i++){

	std::string uuid;
        uuid=*((*(RemoteServices.at(i)))["uuid"]);
        if(uuid==UUID)ServiceNum=i;
      }

      if(ServiceNum!=-1){

	zmq::socket_t ServiceSend (*context, ZMQ_REQ);
        int a=120000;
        ServiceSend.setsockopt(ZMQ_RCVTIMEO, a);
        ServiceSend.setsockopt(ZMQ_SNDTIMEO, a);

	std::stringstream connection;
        connection<<"tcp://"<<*((*(RemoteServices.at(ServiceNum)))["ip"])<<":"<<*((*(RemoteServices.at(ServiceNum)))["remote_port"]);
        ServiceSend.connect(connection.str().c_str());


	zmq::message_t send(256);


	boost::posix_time::ptime t = boost::posix_time::microsec_clock::universal_time();
	std::stringstream isot;
        isot<<boost::posix_time::to_iso_extended_string(t) << "Z";
	msg_id++;
        Store bb;

	bb.Set("uuid",m_UUID);
	bb.Set("msg_id",msg_id);
	*bb["msg_time"]=isot.str();
        *bb["msg_type"]="Command";
        bb.Set("msg_value",command);
        bb.Set("var1",var1);

	std::string tmp="";
        bb>>tmp;
        snprintf ((char *) send.data(), 256 , "%s" ,tmp.c_str()) ;

	response<<"Sending Command {"<<command<<"} to service ["<<ServiceNum<<"] <br>";
        ServiceSend.send(send);


	zmq::message_t receive;
	ServiceSend.recv(&receive);
	std::istringstream iss(static_cast<char*>(receive.data()));

	std::string answer;
        answer=iss.str();
        Store rr;
	rr.JsonParser(answer);
        if(*rr["msg_type"]=="Command Reply") response<<"Service ["<<ServiceNum<<"] Reply: "<<*rr["msg_value"];

      }

      else response<< "Service does not exist"<<std::endl<<std::endl;




    }
    else{
      response << "No Command Entered " << endl;
    }
  }
  else{  response << "Cannot Send Command No Services Found" << endl;
  }

  
  
  std::cout<<response.str()<<endl;
  cout<<"<body/><html/>"; 
  
   
  return 0;
}
