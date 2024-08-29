#include <iostream>
#include <zmq.hpp>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <stdio.h>
#include <sstream>

int main(){

  zmq::context_t context(1);


    zmq::socket_t sub_sock_SD (context, ZMQ_SUB);
    sub_sock_SD.bind("tcp://*:666");
    sub_sock_SD.setsockopt (ZMQ_SUBSCRIBE, "", 0);

    zmq::socket_t sub_sock_MM (context, ZMQ_SUB);
    sub_sock_MM.bind("tcp://*:667");
    sub_sock_MM.setsockopt (ZMQ_SUBSCRIBE, "", 0);


    zmq::pollitem_t items [] = {
      { sub_sock_SD, 0, ZMQ_POLLIN, 0 },
      { sub_sock_MM, 0, ZMQ_POLLIN, 0 },
    };
  

 
    std::string m_multicastaddress="239.192.1.1";
    int m_multicastport_SD=5000;
    int m_multicastport_MM=5000;
    
    
    struct sockaddr_in addr;
    int addrlen, sock, cnt;
    struct ip_mreq mreq;

    ///////////////////SD///////////////////////////////////
    
    // set up socket //
    sock = socket(AF_INET, SOCK_DGRAM, 0);
    struct linger l;
    l.l_onoff  = 0;
    l.l_linger = 0;
    setsockopt(sock, SOL_SOCKET, SO_LINGER,(char *) &l, sizeof(l));
    
    //fcntl(sock, F_SETFL, O_NONBLOCK); 
    if (sock < 0) {
      perror("socket");
      printf("Failed to connect to multicast publish socket");
      exit(1);
    }
    bzero((char *)&addr, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    addr.sin_port = htons(m_multicastport_SD);
    addrlen = sizeof(addr);
    
    // send //
    addr.sin_addr.s_addr = inet_addr(m_multicastaddress.c_str());

    //////////////////////////////////////////////////////////////

    ///////////////////////MM///////////////////////////////////
    struct sockaddr_in addr_MM;
    int addrlen_MM, sock_MM, cnt_MM;
    struct ip_mreq mreq_MM;


    
    // set up socket //
    sock_MM = socket(AF_INET, SOCK_DGRAM, 0);
    struct linger l_MM;
    l_MM.l_onoff  = 0;
    l_MM.l_linger = 0;
    setsockopt(sock_MM, SOL_SOCKET, SO_LINGER,(char *) &l_MM, sizeof(l_MM));
    
    //fcntl(sock, F_SETFL, O_NONBLOCK); 
    if (sock_MM < 0) {
      perror("socket");
      printf("Failed to connect to multicast publish socket");
      exit(1);
    }
    bzero((char *)&addr_MM, sizeof(addr_MM));
    addr_MM.sin_family = AF_INET;
    addr_MM.sin_addr.s_addr = htonl(INADDR_ANY);
    addr_MM.sin_port = htons(m_multicastport_MM);
    addrlen_MM = sizeof(addr_MM);
    
    // send //
    addr_MM.sin_addr.s_addr = inet_addr(m_multicastaddress.c_str());







    //////////////////////////////////////////////////////////
    
    
  while(true){

    zmq::poll(&items [0], 2, -1);

    if ((items [0].revents & ZMQ_POLLIN)) {
      
      
      zmq::message_t received_SD;
      sub_sock_SD.recv(&received_SD);
      std::istringstream iss(static_cast<char*>(received_SD.data()));

      std::string pubmessage=iss.str();
      char message[pubmessage.length()+1];
      
      //    snprintf (message, 512 , "%s" , buffer.GetString()) ;
      snprintf (message, pubmessage.length()+1 , "%s" , pubmessage.c_str() ) ;
      //	  printf("sending: %s\n", message);
      cnt = sendto(sock, message, sizeof(message), 0,(struct sockaddr *) &addr, addrlen);

    }

    if ((items [0].revents & ZMQ_POLLIN)) {
      
      
      zmq::message_t received_MM;
      sub_sock_MM.recv(&received_MM);
      std::istringstream iss(static_cast<char*>(received_MM.data()));
      
      std::string pubmessage=iss.str();
      char message[pubmessage.length()+1];
      
      //    snprintf (message, 512 , "%s" , buffer.GetString()) ;
      snprintf (message, pubmessage.length()+1 , "%s" , pubmessage.c_str() ) ;
      //	  printf("sending: %s\n", message);
      cnt = sendto(sock_MM, message, sizeof(message), 0,(struct sockaddr *) &addr_MM, addrlen_MM);
      
    }
    
	
  }
  



  return 0;

  }
