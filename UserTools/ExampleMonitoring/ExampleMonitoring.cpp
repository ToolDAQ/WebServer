#include "ExampleMonitoring.h"

ExampleMonitoring::ExampleMonitoring():Tool(){}


bool ExampleMonitoring::Initialise(std::string configfile, DataModel &data){

  if(configfile!="")  m_variables.Initialise(configfile);
  //m_variables.Print();

  m_data= &data;
  m_log= m_data->Log;

  if(!m_variables.Get("verbose",m_verbose)) m_verbose=1;

  srand (time(NULL));
  last=time(NULL);

  
  
  return true;
}


bool ExampleMonitoring::Execute(){

  if( difftime(time(NULL),last) > 5){
    
    last=time(NULL);
    
    
    Store data;
    
    data.Set("temp1", (rand() % 100 +400)/10.0);
    data.Set("voltage1", (rand() % 1000 +5000)/1000.0);
    float temp2=0.0;
    m_data->SC_vars["var2"]->GetValue(temp2);
    data.Set("temp2", temp2);
    
    std::string json_string="";
    
    data>>json_string;
    
    return m_data->SQL.SendMonitoringData(json_string);
    
  }


  return true;
  
}


bool ExampleMonitoring::Finalise(){



  return true;
}
