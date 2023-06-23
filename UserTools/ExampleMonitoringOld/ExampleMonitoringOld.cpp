#include "ExampleMonitoringOld.h"

ExampleMonitoringOld::ExampleMonitoringOld():Tool(){}


bool ExampleMonitoringOld::Initialise(std::string configfile, DataModel &data){

  if(configfile!="")  m_variables.Initialise(configfile);
  //m_variables.Print();

  m_data= &data;
  m_log= m_data->Log;

  if(!m_variables.Get("verbose",m_verbose)) m_verbose=1;

  srand (time(NULL));
  last=time(NULL);

  std::stringstream tmp;

  try{
    
    //    tmp<<"dbname="<<*(m_variables["dbname"])<<" hostaddr="<<*(m_variables["hostaddr1"])<<" port="<<*(m_variables["port"]);
    tmp<<"dbname=daq hostaddr=127.0.0.1 port=5432";
    SQLConnection =new pqxx::connection(tmp.str().c_str());
    if(!SQLConnection->is_open()) return false;
         
    
  }
  catch (const std::exception &e){
    std::cerr << e.what() << std::endl;
    return false;
  }
  

  
  return true;
}


bool ExampleMonitoringOld::Execute(){

  if( difftime(time(NULL),last) > 5){

    last=time(NULL);

    std::stringstream tmp;
    
    try{
      
      pqxx::nontransaction N(*(SQLConnection));
      
      Store data;
      
      data.Set("temp1", (rand() % 100 +400)/10.0);
      data.Set("voltage1", (rand() % 1000 +5000)/1000.0);
      float temp2=0.0;
      m_data->SC_vars["var2"]->GetValue(temp2);
      data.Set("temp2", temp2);
      
      std::string datastring="";
      
      data>>datastring;
      
      tmp<<"insert into monitoring(time, name, data) values(Now(), 'example device', '"<<datastring<<"');"; 
      
      N.exec(tmp.str().c_str());
      N.commit();
      
      
      
    }
    catch (const std::exception &e){
      std::cerr << e.what() << std::endl;
      return false;
    }
    
  }
  
  return true;
}


bool ExampleMonitoringOld::Finalise(){

    SQLConnection->disconnect();
    delete SQLConnection;
    SQLConnection=0;


  return true;
}
