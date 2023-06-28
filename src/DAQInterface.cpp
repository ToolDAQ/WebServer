#include <DAQInterface.h>

DAQInterface::DAQInterface(std::string name){

  m_name=name;

  mp_SD = new ServiceDiscovery(true, false, 88888, "239.192.1.1", 5000, &m_context, boost::uuids::random_generator()(), name, 5, 60);

  SC_vars.InitThreadedReceiver(&m_context, 88888, 100, false);

  m_pgclient.SetUp(&m_context);

  std::string configfile="./PGClientConfig";

  m_dbname="daq";

  if(!m_pgclient.Initialise(configfile)){

    std::cout<<"error initialising pgclient"<<std::endl;

  }

  // we should connect here i guess

  // after Initilising the pgclient needs ~15 seconds for the middleman to connect
  std::this_thread::sleep_for(std::chrono::seconds(15));
  // hopefully the middleman has found us by now

}
 
DAQInterface::~DAQInterface(){

  m_pgclient.Finalise();
  SC_vars.Clear();
  delete mp_SD;
  mp_SD=0;
  
}

bool DAQInterface::SQLQuery(std::string dbname, std::string query_string, std::string &result, int &timeout, std::string& err){
 
  return m_pgclient.SendQuery(dbname, query_string, &result, &timeout, &err);
    
  // responses are returned as JSON maps, where each key represents a fieldname
  // and the corresponding value the field value. if multiple rows are returned,
  // this applies to each vector entry. Use a json parser to parse it into a BoostStore.
  //std::cout<<"PGHelper getting toolconfig by parsing json '"+result+"'"<<std::endl;
  //  BoostStore store;
  // parser.Parse(result, store);
  
  //  store.set stuff;

}


bool DAQInterface::SendLog(std::string message, int severity, std::string device){

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

bool DAQInterface::SendAlarm(std::string message, std::string device){
  
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

bool DAQInterface::SendMonitoringData(std::string json_data, std::string device){

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


bool DAQInterface::SendConfig(std::string json_data, std::string device){


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

bool DAQInterface::GetConfig(std::string& json_data, int version, std::string device){

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
