#include <iostream>
#include <zmq.hpp>
#include <ServiceDiscovery.h>
#include <boost/uuid/uuid.hpp>            // uuid class
#include <boost/uuid/uuid_generators.hpp> // generators
#include <boost/uuid/uuid_io.hpp>         // streaming operators etc.
#include <boost/date_time/posix_time/posix_time.hpp>


int main(){

  zmq::context_t context(1);

  ServiceDiscovery SD(false,true,77777 , "239.192.1.1", 5000, &context, boost::uuids::random_generator()(), "Win_Mac_translation", 5, 60);


    boost::uuids::uuid m_UUID=boost::uuids::random_generator()();
    long msg_id=0;

    zmq::socket_t Ireceive (context, ZMQ_DEALER);
    Ireceive.connect("inproc://ServiceDiscovery");


    zmq::socket_t publish_sock (context, ZMQ_PUB);
    publish_sock.connect("tcp://127.0.0.1:666");


  while(true){


    sleep(1);

    zmq::message_t send(4);
    snprintf ((char *) send.data(), 4 , "%s" ,"All") ;

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

      publish_sock.send(servicem);

      //      std::istringstream ss(static_cast<char*>(servicem.data()));
      //std::cout<<ss.str()<<std::endl;


      /*      service->JsonParser(ss.str());

      std::string type;
      std::string uuid;
      std::string ip;
      std::string remote_port;
      service->Get("msg_value",type);
      service->Get("uuid",uuid);
      service->Get("ip",ip);
      if(port=="") service->Get("remote_port",remote_port);
      else remote_port=port;      
      std::string tmp=ip + ":" + remote_port;

      //if(type == ServiceName && connections.count(uuid)==0){
      if(type == ServiceName && connections.count(tmp)==0){
	connections[tmp]=service;
	//std::string ip;
	//std::string port;
	//service->Get("ip",ip);
	//service->Get("remote_port",port);
	tmp="tcp://"+ tmp;
	sock->connect(tmp.c_str());
      }
      else{
	delete service;
	service=0;
      }


    }

    return connections.size();
      */  
}

      
    }
  


  return 0;

  }
