#include "ExampleSlowControl.h"

ExampleSlowControl::ExampleSlowControl():Tool(){}


bool ExampleSlowControl::Initialise(std::string configfile, DataModel &data){

  if(configfile!="")  m_variables.Initialise(configfile);
  //m_variables.Print();

  m_data= &data;
  m_log= m_data->Log;

  if(!m_variables.Get("verbose",m_verbose)) m_verbose=1;
  if(!m_variables.Get("Port",m_port)) m_port=5555;

  m_util=new DAQUtilities(m_data->context);
  
  sock = new  zmq::socket_t(*(m_data->context), ZMQ_ROUTER);

  std::stringstream tmp;
  tmp<<"tcp://*:"<<m_port;

  sock->bind(tmp.str().c_str());

  if (!m_util->AddService("ExampleSlowControl",m_port,false)) return false;

  items[0].socket=*sock;
  items[0].fd=0;
  items[0].events=ZMQ_POLLIN;
  items[0].revents=0;

  
  return true;
}


bool ExampleSlowControl::Execute(){

  zmq::poll(&items[0], 1, 100);

  if ((items[0].revents & ZMQ_POLLIN)){

    zmq::message_t identity;
    sock->recv(&identity);
    //std::istringstream iss1(static_cast<char*>(identity.data()));
    //    std::cout<<"msg1 = "<<iss1.str()<<" "<<identity.size()<<std::endl;
    zmq::message_t blank;
    sock->recv(&blank);
    //std::istringstream iss2(static_cast<char*>(blank.data()));
    //std::cout<<"msg2 = "<<iss2.str()<<" "<<blank.size()<<std::endl;
    zmq::message_t message;
    sock->recv(&message);
    std::istringstream iss(static_cast<char*>(message.data()));
    Store tmp;
    tmp.JsonParser(iss.str());
    //    std::cout<<"msg3 = "<<iss.str()<<std::endl;

    std::string str="";

    tmp.Get("msg_value", str);
    std::cout<<"msg = "<<iss.str()<<std::endl;
    std::cout<<"msg before processing = "<<str<<std::endl;
    std::string reply="error";

    if(str == "?") reply ="?, [variables:0:20:1:1]";

    else{

      Store in;
      str="{"+str+"}";
      in.JsonParser(str);
      in.Print();
    }

    std::cout<<"msg after processing = "<<str<<std::endl;
    //      boost::posix_time::ptime t = boost::posix_time::microsec_clock::universal_time();
    //  std::stringstream isot;
    //  isot<<boost::posix_time::to_iso_extended_string(t) << "Z";
      
    // msg_id++;
      Store rr;
      
      //rr.Set("uuid",m_UUID);
      //rr.Set("msg_id",msg_id);
      //*rr["msg_time"]=isot.str();
      *rr["msg_type"]="Command Reply";
      rr.Set("msg_value",reply);

      //rr.Print();      
      std::string tmp2="";
      rr>>tmp2;
      zmq::message_t send(tmp2.length()+1);
      snprintf ((char *) send.data(), tmp2.length()+1 , "%s" ,tmp2.c_str()) ;

    
    sock->send(identity, ZMQ_SNDMORE);
    sock->send(blank, ZMQ_SNDMORE);
    sock->send(send);
    //std::cout<<"sent"<<std::endl; 
  }


  return true;
}


bool ExampleSlowControl::Finalise(){

  bool ret=m_util->RemoveService("ExampleSlowControl");

  delete sock;
  sock=0;

  if(!ret) return false;

  return true;
}
