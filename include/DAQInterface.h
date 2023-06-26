#ifndef DAQ_INTERFACE_H
#define DAQ_INTERFACE_H

#include <ServiceDiscovery.h>
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


class DAQInterface{

 private: 

  zmq::context_t m_context;
  ServiceDiscovery* mp_SD;
  PGClient m_pgclient;
  std::string m_dbname;
  std::string m_name;

 public:

  DAQInterface(std::string name);
  ~DAQInterface();
  bool SQLQuery(std::string dbname, std::string query_string, std::string &result, int &timeout, std::string& err);
  bool SendLog(std::string message, int severity=2, std::string device="");
  bool SendAlarm(std::string message, std::string device="");
  bool SendMonitoringData(std::string json_data, std::string device="");
  bool SendConfig(std::string json_data, std::string device="");
  bool GetConfig(std::string &json_data, int version, std::string device="");
  SlowControlCollection SC_vars;

};

#endif
