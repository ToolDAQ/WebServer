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

  SlowControlElement* var1= new SlowControlElement("var1",SlowControlElementType(VARIABLE));
  var1->SetMin(0);
  var1->SetMax(20);
  var1->SetStep(1);
  var1->SetValue(1);
  m_data->SC_vars.push_back(var1);

  SlowControlElement* var2= new SlowControlElement("var2",SlowControlElementType(VARIABLE));
  var2->SetMin(0);
  var2->SetMax(200);
  var2->SetStep(0.01);
  var2->SetValue(5.82);
  m_data->SC_vars.push_back(var2);

  SlowControlElement* LED1= new SlowControlElement("LED1",SlowControlElementType(OPTIONS));
  LED1->AddOption("on");
  LED1->AddOption("off");
  LED1->SetValue("off");
  m_data->SC_vars.push_back(LED1);

  SlowControlElement* LED2= new SlowControlElement("LED2",SlowControlElementType(OPTIONS));
  LED2->AddOption("on");
  LED2->AddOption("off");
  LED2->SetValue("off");
  m_data->SC_vars.push_back(LED2);


  SlowControlElement* modeselect= new SlowControlElement("mode Select",SlowControlElementType(OPTIONS));
  modeselect->AddOption("high");
  modeselect->AddOption("mid");
  modeselect->AddOption("low");
  modeselect->SetValue("mid");
  m_data->SC_vars.push_back(modeselect);


  SlowControlElement* command= new SlowControlElement("command",SlowControlElementType(COMMAND));
  command->AddCommand("command_text");
  m_data->SC_vars.push_back(command);

  SlowControlElement* button1= new SlowControlElement("button1",SlowControlElementType(BUTTON));
  m_data->SC_vars.push_back(button1);

  SlowControlElement* button2= new SlowControlElement("button2",SlowControlElementType(BUTTON));
  m_data->SC_vars.push_back(button2);
  
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

    if(str == "?"){
      reply ="?";
      for(int i=0; i<m_data->SC_vars.size(); i++){
	reply += ", " + m_data->SC_vars.at(i)->Print();
      } 
      
    }
    
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
