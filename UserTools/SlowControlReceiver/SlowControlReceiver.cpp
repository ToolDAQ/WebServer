#include "SlowControlReceiver.h"

SlowControlReceiver::SlowControlReceiver():Tool(){}


bool SlowControlReceiver::Initialise(std::string configfile, DataModel &data){

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

  if (!m_util->AddService("SlowControlReceiver",m_port,false)) return false;

  items[0].socket=*sock;
  items[0].fd=0;
  items[0].events=ZMQ_POLLIN;
  items[0].revents=0;

  
  return true;
}


bool SlowControlReceiver::Execute(){

  zmq::poll(&items[0], 1, 100);

  if ((items[0].revents & ZMQ_POLLIN)){

    zmq::message_t identity;
    sock->recv(&identity);

    zmq::message_t blank;
    sock->recv(&blank);

    zmq::message_t message;
    sock->recv(&message);
    std::istringstream iss(static_cast<char*>(message.data()));
    Store tmp;
    tmp.JsonParser(iss.str());

    std::string str="";

    tmp.Get("msg_value", str);
    tmp.Print();
    std::cout<<"str="<<str<<std::endl;

    std::string reply="error";

    if(str == "?") reply=m_data->SC_vars.Print();
    
    else if(m_data->SC_vars[str]){
      
      reply=*tmp["msg_value"];
      std::stringstream input;
      input<<*tmp["msg_value"];
      std::string key="";
      std::string value="";      
      input>>key>>value;
      if(value=="")value=1;
      m_data->SC_vars[key]->SetValue(value);
      std::cout<<"value="<<value<<std::endl;
    }
    
    Store rr;
    
    *rr["msg_type"]="Command Reply";
    rr.Set("msg_value",reply);
    
    std::string tmp2="";
    rr>>tmp2;
    zmq::message_t send(tmp2.length()+1);
    snprintf ((char *) send.data(), tmp2.length()+1 , "%s" ,tmp2.c_str()) ;
    
    
    sock->send(identity, ZMQ_SNDMORE);
    sock->send(blank, ZMQ_SNDMORE);
    sock->send(send);
  }


  return true;
}


bool SlowControlReceiver::Finalise(){

  bool ret=m_util->RemoveService("SlowControlReceiver");

  delete sock;
  sock=0;

  m_data->SC_vars.Clear();

  if(!ret) return false;

  return true;
}
