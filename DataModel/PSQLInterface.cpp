#include <PSQLInterface.h>

PSQLInterface::PSQLInterface(){}
PSQLInterface::~PSQLInterface(){}


bool PSQLInterface::Initialise(zmq::context_t* context, std::string device_name, std::string config_file){

  m_context=context;

  m_name=device_name;

  m_pgclient.SetUp(m_context);

  m_dbname="daq";

  if(!m_pgclient.Initialise(config_file)){

    std::cout<<"error initialising pgclient"<<std::endl;
    return false;
  }

  // we should connect here i guess

  // after Initilising the pgclient needs ~15 seconds for the middleman to connect
  std::this_thread::sleep_for(std::chrono::seconds(15));
  // hopefully the middleman has found us by now

  return true;
}
 
bool PSQLInterface::Finalise(){

  return m_pgclient.Finalise();
  
}

bool PSQLInterface::SQLQuery(std::string dbname, std::string query_string, std::string &result, int &timeout, std::string& err){
 
  return m_pgclient.SendQuery(dbname, query_string, &result, &timeout, &err);
    
  // responses are returned as JSON maps, where each key represents a fieldname
  // and the corresponding value the field value. if multiple rows are returned,
  // this applies to each vector entry. Use a json parser to parse it into a BoostStore.
  //std::cout<<"PGHelper getting toolconfig by parsing json '"+result+"'"<<std::endl;
  //  BoostStore store;
  // parser.Parse(result, store);
  
  //  store.set stuff;

}


bool PSQLInterface::SendLog(std::string message, int severity, std::string device){

  if(device=="") device=m_name;
  std::string err="";
  int timeout=300;
  std::string result;
  std::string query_string="insert into logging (time, source, severity, message) values (now(), '" + device + "', "+std::to_string(severity)+", '" + message + "');";

  if(!SQLQuery(m_dbname , query_string, result, timeout, err)){
    
    std::cout<<"log error: "<<err<<std::endl;
    
    return false;
  }
  

  return true;

}

bool PSQLInterface::SendAlarm(std::string message, std::string device){
  
  if(device=="") device=m_name;
  std::string err="";
  int timeout=300;
  std::string result;
  std::string query_string="insert into Alarms (time, name, alarm) values (now(), '" + device + "', '" + message + "');";
  
  if(!SQLQuery(m_dbname , query_string, result, timeout, err)){
    std::cerr<<"SendAlarm error: "<<err<<std::endl;
    return false;
  }
  
  return true;

}

bool PSQLInterface::SendMonitoringData(std::string json_data, std::string device){

  if(device=="") device=m_name;
  std::string err="";
  int timeout=300;
  std::string result;
  std::string query_string="insert into monitoring (time, name, data) values (now(), '" + device + "', '" + json_data + "');";

  if(!SQLQuery(m_dbname , query_string, result, timeout, err)){
    std::cerr<<"SendMonitoringData error: "<<err<<std::endl;
    return false;
  }
  
  
  return true;

}


bool PSQLInterface::SendConfig(std::string json_data, std::string device){


  if(device=="") device=m_name;

  std::string result;
  int timeout=300;
  std::string err="";
  std::string query= "insert into configurations (time, name, version, data) values (now(), '"+ device + "', '0', '"+ json_data + "');";
  
if(!SQLQuery(m_dbname, query, result, timeout, err)){
    std::cerr<<"SendConfig error: "<<err<<std::endl;  
    return false;
  }

  return true;

}

bool PSQLInterface::GetConfig(std::string& json_data, int version, std::string device){

  if(device=="") device=m_name;

  int timeout=300;
  std::string err="";
  std::string query= "select data from configurations";// where name='"+ device + "' and version=" + std::to_string(version) +");";
  
if(!SQLQuery(m_dbname, query, json_data, timeout, err)){
    std::cerr<<"GetConfig error: "<<err<<std::endl;
    return false;
  }

  return true;

}
