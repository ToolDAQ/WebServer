﻿#include <iostream>
#include <vector>  
#include <string>  
#include <stdio.h>  
#include <stdlib.h> 
#include <fstream>
//#include <algorithm>
//#include <sstream>

/*
#include <cgicc/CgiDefs.h> 
#include <cgicc/Cgicc.h> 
#include <cgicc/HTTPHTMLHeader.h> 
#include <cgicc/HTMLClasses.h>  
*/


#include "ServiceDiscovery.h"


#include "zmq.hpp"



#include <boost/uuid/uuid.hpp>            // uuid class
#include <boost/uuid/uuid_generators.hpp> // generators
#include <boost/uuid/uuid_io.hpp>         // streaming operators etc.
#include <boost/date_time/posix_time/posix_time.hpp>

using namespace std;
//using namespace cgicc;
using namespace ToolFramework;

int main (){

  //  system("source /home/annie/ANNIEDAQ/Setup.sh");
    
  boost::uuids::uuid m_UUID=boost::uuids::random_generator()();
  long msg_id=0;
    
  zmq::context_t *context=new zmq::context_t(3);
   

std::vector<Store*> RemoteServices;
  
  std::string address("239.192.1.1");
  //std::stringstream tmp ("5000");

  int port=5000;
  //  tmp>>port;

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
  cout<<"<html><body>";
  
  for(int i=0;i<RemoteServices.size();i++){
    
    std::string ip;
    std::string uuid;
    std::string service;
    std::string status;
    std::string colour;
    
    //*(it->second)>> output;
    ip=*((*(RemoteServices.at(i)))["ip"]);
    service=*((*(RemoteServices.at(i)))["msg_value"]);
    status=*((*(RemoteServices.at(i)))["status"]);
    uuid=*((*(RemoteServices.at(i)))["uuid"]);

    colour="#00FFFF";
    if (status=="Online")colour="#FF00FF";
    else if (status=="Waiting to Initialise ToolChain")colour="#FFFF00";
    else{
      std::stringstream tmpstatus(status);
      tmpstatus>>status;
      if(status=="ToolChain"){
	tmpstatus>>status;
	if(status=="running")colour="#00FF00";
      }
      status=tmpstatus.str();
    }
    
    cout<<"<td bgcolor=\""<<colour<<"\">["<<i<<"]</td>";
    cout<<"<td style=\"display:none\">"<<uuid<<"</td> ";
    cout<<"<td bgcolor=\""<<colour<<"\">"<<ip<<"</td>";
    cout<<"<td bgcolor=\""<<colour<<"\">"<<service<<"</td> ";
    cout<<"<td bgcolor=\""<<colour<<"\">"<<status<<"</td> ";

    if(i!=RemoteServices.size()-1) cout<<std::endl;
    
  }
  cout<<"<body/><html/>";
  //}

  /*
  
  if(RemoteServices.size()>0){

 
    cout<<"<form action=\"/cgi-bin/controlin.cgi\" method=\"post\" >";

    cout<<"  <table border=\"0\" align=\"center\">";


    cout<<"<tr><td><div align='center'>Select Service</td>";
    cout<<"<td>Type Command</td>";
    cout<<"<td></td> </tr> ";

    cout<<"<tr><td>";

    cout<<"<div align='center'>";
    cout<<"<select name=\"UUID\">";

    ;
    for(int i=0;i<RemoteServices.size();i++){

      std::string ip;
      std::string uuid;
      std::string service;
      std::string status;

      //*(it->second)>> output;                                                    
      ip=*((*(RemoteServices.at(i)))["ip"]);
      service=*((*(RemoteServices.at(i)))["msg_value"]);
      status=*((*(RemoteServices.at(i)))["status"]);
      uuid=*((*(RemoteServices.at(i)))["uuid"]);



      if (i==0) cout<<" <option value=\""<<uuid<<"\" selected>["<<i<<"]</option>";

      else cout<<"<option value=\""<<uuid<<"\">["<<i<<"]</option>";
    }


    cout<<"</select></td><td>";
    cout<<"<input type=\"text\" name=\"command\"> ";
    cout<<"</td><td>";
    cout<<"<input type=\"submit\" value=\"Send Command\" /></form>";
    cout<<"</td></tr></table></form><p>";

  }
  /////////////////////////////////////////////////////////////////////////            
  cout<<"  <table  border=\"1\" align=\"center\">";
  cout<<"  <td> Command output  </td>  </table>";

  ////////////////////////////////////////////////                                 
  
  /*                                                                               
										   cout<<"<div align='center'><form action=\"/cgi-bin/testin.cgi\" method=\"post\" >";  
										   cout<<"<select name=\"UUID\">";                                                     
										   cout<<"<option value=\"uuid\">[i]</option></select>";                                
										   cout<<"</form>";                                                                    
                                                                                     
										   cout<<"<div align='center' style=\"#ccc;font:16px/26px Georgia, Garamond, Serif;o\
verflow:scroll;border:2px solid;padding:1%\">As you can see, once there's enough tex\
t in this box, the box will grow scroll bars... that's why we call it a scroll box! \
You could also place an image into the scroll box.</div>";                           
  */
  /*                                                                               
   form_iterator fi = formData.getElement("UUID");                                   
   if( !fi->isEmpty() && fi != (*formData).end()) {                                  
   cout << "UUID: " << **fi << endl;                                              
   }else{                                 
   cout << "No text entered for first name" << endl;                              
   }                                                                                 
   cout << "<br/>\n";                                                                
   fi = formData.getElement("command");                                              
   if( !fi->isEmpty() && fi != (*formData).end()) {                                  
   cout << "command: " << **fi << endl;                                           
   }else{                                                                            
   cout << "No text entered for last name" << endl;                               
   }                                                                                 
                                                                                     
   cout << "<br/>\n";                                                                
  */
  /*
  cout<< "<p>Use command \"?\" to display available commands for a service </p> <p>"; 

  ifstream myfile2 ("/web/html/footer.html");

  if (myfile2.is_open())
  {
    while ( getline (myfile2,line) )
    {


      cout << line;//<<std::endl;

    }
    myfile2.close();
  }
  */


  return 0;
  
}
