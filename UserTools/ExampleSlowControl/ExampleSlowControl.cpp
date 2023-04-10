#include "ExampleSlowControl.h"

ExampleSlowControl::ExampleSlowControl():Tool(){}


bool ExampleSlowControl::Initialise(std::string configfile, DataModel &data){

  if(configfile!="")  m_variables.Initialise(configfile);
  //m_variables.Print();

  m_data= &data;
  m_log= m_data->Log;

  if(!m_variables.Get("verbose",m_verbose)) m_verbose=1;

  //  if(str == "?") reply ="?, [var1:0:20:1:1], [var2:0:20:1:1], [LED1;on;off;off], [LED2;on;off;off], [mode select;high;mid;low;mid] command <command text>, button 1, button2";

  m_data->SC_vars.Add("var1",SlowControlElementType(VARIABLE));
  m_data->SC_vars["var1"]->SetMin(0);
  m_data->SC_vars["var1"]->SetMax(20);
  m_data->SC_vars["var1"]->SetStep(1);
  m_data->SC_vars["var1"]->SetValue(1);
  
  m_data->SC_vars.Add("var2",SlowControlElementType(VARIABLE));
  m_data->SC_vars["var2"]->SetMin(0);
  m_data->SC_vars["var2"]->SetMax(200);
  m_data->SC_vars["var2"]->SetStep(0.01);
  m_data->SC_vars["var2"]->SetValue(5.82);
  
  m_data->SC_vars.Add("LED1",SlowControlElementType(OPTIONS));
  m_data->SC_vars["LED1"]->AddOption("on");
  m_data->SC_vars["LED1"]->AddOption("off");
  m_data->SC_vars["LED1"]->SetValue("off");
  
  m_data->SC_vars.Add("LED2",SlowControlElementType(OPTIONS));
  m_data->SC_vars["LED2"]->AddOption("on");
  m_data->SC_vars["LED2"]->AddOption("off");
  m_data->SC_vars["LED2"]->SetValue("off");
  
  
  m_data->SC_vars.Add("mode_select",SlowControlElementType(OPTIONS));
  m_data->SC_vars["mode_select"]->AddOption("high");
  m_data->SC_vars["mode_select"]->AddOption("mid");
  m_data->SC_vars["mode_select"]->AddOption("low");
  m_data->SC_vars["mode_select"]->SetValue("mid");
  
  
  m_data->SC_vars.Add("command",SlowControlElementType(COMMAND));
  m_data->SC_vars["command"]->AddCommand("command_text");
 
  m_data->SC_vars.Add("button1",SlowControlElementType(BUTTON));
 
  m_data->SC_vars.Add("button2",SlowControlElementType(BUTTON));
  
  return true;
}


bool ExampleSlowControl::Execute(){



  return true;
}


bool ExampleSlowControl::Finalise(){

  return true;
}
