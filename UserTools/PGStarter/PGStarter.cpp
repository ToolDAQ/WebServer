#include "PGStarter.h"

PGStarter::PGStarter():Tool(){}


bool PGStarter::Initialise(std::string configfile, DataModel &data){

  if(configfile!="")  m_variables.Initialise(configfile);
  //m_variables.Print();

  m_data= &data;
  m_log= m_data->Log;

  if(!m_variables.Get("verbose",m_verbose)) m_verbose=1;

  if(configfile==""){

    Log("ERROR: No Config file present for postgres setup, config file is needed.", 0, m_verbose);
    
    return false;

  }

  std::string service_name="";
  
  m_data->vars.Get("service_name", service_name);

  m_data->SQL.Initialise(m_data->context, service_name, configfile);


  return true;
}


bool PGStarter::Execute(){

  return true;
}


bool PGStarter::Finalise(){


  m_data->SQL.Finalise();

  return true;
}
