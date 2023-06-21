#include <DAQInterface.h>

DAQInterface::DAQInterface(std::string name){

  m_name=name;

  mp_SD = new ServiceDiscovery(true, true, 88888, "239.192.1.1", 5000, &m_context, boost::uuids::random_generator()(), name, 5, 60);

  SC_vars.InitThreadedReceiver(&m_context, 88888, 100, false);

  m_pgclient.SetUp(&m_context, mp_SD);

  std::string configfile="./PGClientConfig";

  m_dbname="daq";

  if(!m_pgclient.Initialise(configfile)){

    std::cout<<"error initialising pgclient"<<std::endl;

    }

    // we should connecthere i guess

    // after Initilising the pgclient needs ~15 seconds for the middleman to connect
    std::this_thread::sleep_for(std::chrono::seconds(15));
    // hopefully the middleman has found us by now

}
 
DAQInterface::~DAQInterface(){

  delete mp_SD;
  mp_SD=0;

  SC_vars.Clear();

  m_pgclient.Finalise();
  
}

bool DAQInterface::SQLQuery(std::string dbname, std::string query_string, Store &result, int &timeout, std::string err){

  std::string resultstring="";
  
  bool ok = m_pgclient.SendQuery(dbname, query_string, &resultstring, &timeout, &err);

  if(!ok) return ok;
  // responses are returned as JSON maps, where each key represents a fieldname
  // and the corresponding value the field value. if multiple rows are returned,
  // this applies to each vector entry. Use a json parser to parse it into a BoostStore.
  //std::cout<<"PGHelper getting toolconfig by parsing json '"+result+"'"<<std::endl;
  //  BoostStore store;
  // parser.Parse(result, store);
  
  //  store.set stuff;
  
  return ok;

}


bool DAQInterface::SendLog(std::string message){


  std::string err="";
  int timeout=300;
  Store result;
  std::string query_string="insert into logs (time, name, log) values (now(), '" + m_name + "', '" + message + "');";

    if(!SQLQuery(m_dbname , query_string, result, timeout, err)){

      std::cout<<"log error: "<<err<<std::endl;

      return false;
    }
  

  return true;

}

bool DAQInterface::SendAlarm(std::string message){
  
  std::string err="";
  int timeout=300;
  Store result;
  std::string query_string="insert into Alarms (time, name, alarm) values (now(), '" + m_name + "', '" + message + "');";
  
  if(!SQLQuery(m_dbname , query_string, result, timeout, err)){
      std::cerr<<"SendAlarm error: "<<err<<std::endl;
      return false;
  }

  return true;

}

bool DAQInterface::SendMonitoringData(std::string data){

  std::string err="";
  int timeout=300;
  Store result;
  std::string query_string="insert into monitoring (time, name, data) values (now(), '" + m_name + "', '" + data + "');";
  if(!SQLQuery(m_dbname , query_string, result, timeout, err)){
      std::cerr<<"SendMonitoringData error: "<<err<<std::endl;
      return false;
  }


  return true;

}
