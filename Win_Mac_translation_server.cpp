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


    zmq::socket_t sub_sock (context, ZMQ_SUB);
    sub_sock.bind("tcp://*:666");
    sub_sock.setsockopt (ZMQ_SUBSCRIBE, "", 0);


    zmq::pollitem_t items [] = {
      { sub_sock, 0, ZMQ_POLLIN, 0 },
    };
  

 
    std::string m_multicastaddress="239.192.1.1";
    int m_multicastport=5000;

    
    
    struct sockaddr_in addr;
    int addrlen, sock, cnt;
    struct ip_mreq mreq;
    
    
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
    addr.sin_port = htons(m_multicastport);
    addrlen = sizeof(addr);
    
    // send //
    addr.sin_addr.s_addr = inet_addr(m_multicastaddress.c_str());
    
    
  while(true){

    zmq::poll(&items [0], 1, -1);

    if ((items [0].revents & ZMQ_POLLIN)) {
      
      
      zmq::message_t received_SD;
      sub_sock.recv(&received_SD);
      std::istringstream iss(static_cast<char*>(received_SD.data()));

      std::string pubmessage=iss.str();
      char message[pubmessage.length()+1];
      
      //    snprintf (message, 512 , "%s" , buffer.GetString()) ;
      snprintf (message, pubmessage.length()+1 , "%s" , pubmessage.c_str() ) ;
      //	  printf("sending: %s\n", message);
      cnt = sendto(sock, message, sizeof(message), 0,(struct sockaddr *) &addr, addrlen);

    }
      
  }
  



  return 0;

  }
