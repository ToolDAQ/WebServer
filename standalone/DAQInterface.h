#ifndef DAT_INTERFACE_H
#define DAQ_INTERFACE_H

#include <ServiceDiscovery.h>
#include <DAQUtilities.h>
#include <zmq.hpp>
#include <iostream>
#include <string>
#include <SlowControlCollection.h>
#include <boost/uuid/uuid.hpp>            // uuid class
#include <boost/uuid/uuid_generators.hpp> // generators                                                 
#include <boost/uuid/uuid_io.hpp>         // streaming operators etc.                                   
#include <boost/date_time/posix_time/posix_time.hpp>
#include <boost/progress.hpp>
#include <PGClient.h>
#include <JsonParser.h>


class DAQInterface{

 public:

  DAQInterface(std::string name);
  ~DAQInterface();
  bool SQLQuery(std::string dbname, std::string query_string, Store &result, int &timeout, std::string err);
  bool SendLog(std::string message);
  bool SendAlarm(std::string message);
  bool SendMonitoringData(std::string data);
  SlowControlCollection SC_vars;

 private:
  
  ServiceDiscovery* mp_SD;
  zmq::context_t m_context;
  PGClient m_pgclient;
  std::string m_dbname;
  std::string m_name;

};

#endif
