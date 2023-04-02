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

  //  if(str == "?") reply ="?, [var1:0:20:1:1], [var2:0:20:1:1], [LED1;on;off;off], [LED2;on;off;off], [mode select;high;mid;low;mid] command <command text>, button 1, button2";

  m_data->SC_vars["var1"]= new SlowControlElement("var1",SlowControlElementType(VARIABLE));
  m_data->SC_vars["var1"]->SetMin(0);
  m_data->SC_vars["var1"]->SetMax(20);
  m_data->SC_vars["var1"]->SetStep(1);
  m_data->SC_vars["var1"]->SetValue(1);
  
  m_data->SC_vars["var2"]= new SlowControlElement("var2",SlowControlElementType(VARIABLE));
  m_data->SC_vars["var2"]->SetMin(0);
  m_data->SC_vars["var2"]->SetMax(200);
  m_data->SC_vars["var2"]->SetStep(0.01);
  m_data->SC_vars["var2"]->SetValue(5.82);
  
  m_data->SC_vars["LED1"]= new SlowControlElement("LED1",SlowControlElementType(OPTIONS));
  m_data->SC_vars["LED1"]->AddOption("on");
  m_data->SC_vars["LED1"]->AddOption("off");
  m_data->SC_vars["LED1"]->SetValue("off");
  
  m_data->SC_vars["LED2"]= new SlowControlElement("LED2",SlowControlElementType(OPTIONS));
  m_data->SC_vars["LED2"]->AddOption("on");
  m_data->SC_vars["LED2"]->AddOption("off");
  m_data->SC_vars["LED2"]->SetValue("off");
  
  
  m_data->SC_vars["mode_select"]= new SlowControlElement("mode_select",SlowControlElementType(OPTIONS));
  m_data->SC_vars["mode_select"]->AddOption("high");
  m_data->SC_vars["mode_select"]->AddOption("mid");
  m_data->SC_vars["mode_select"]->AddOption("low");
  m_data->SC_vars["mode_select"]->SetValue("mid");
  
  
  m_data->SC_vars["command"]= new SlowControlElement("command",SlowControlElementType(COMMAND));
  m_data->SC_vars["command"]->AddCommand("command_text");
 
  m_data->SC_vars["button1"]= new SlowControlElement("button1",SlowControlElementType(BUTTON));
 
  m_data->SC_vars["button2"]= new SlowControlElement("button2",SlowControlElementType(BUTTON));
  
  return true;
}


bool ExampleSlowControl::Execute(){

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

    if(str == "?"){
      reply ="?";
      for(std::map<std::string, SlowControlElement*>::iterator it=m_data->SC_vars.begin(); it!=m_data->SC_vars.end(); it++){
	reply += ", " + it->second->Print();
      } 
      
    }
    
    else if(m_data->SC_vars.count(str)){
    
      reply=*tmp["msg_value"];
      std::stringstream input;
      input<<*tmp["msg_value"];
      std::string key="";
      std::string value="";      
      input>>key>>value;
      if(value=="")value=1;
      m_data->SC_vars[key]->SetValue(value);
      std::cout<<"value="<<value<<std::endl;
      // Store in;
      //str="{"+str+"}";
      //in.JsonParser(str);
      //in.Print();
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


bool ExampleSlowControl::Finalise(){

  bool ret=m_util->RemoveService("ExampleSlowControl");

  delete sock;
  sock=0;

  if(!ret) return false;

  return true;
}
