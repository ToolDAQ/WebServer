#ifndef PSQL_INTERFACE_H
#define PSQL_INTERFACE_H

#include <zmq.hpp>
#include <iostream>
#include <string>
#include <PGClient.h>


class PSQLInterface{

 private: 

  zmq::context_t* m_context;
  PGClient m_pgclient;
  std::string m_dbname;
  std::string m_name;

 public:

  PSQLInterface();
  ~PSQLInterface();
  bool Initialise(zmq::context_t* context, std::string device_name, std::string config_file);
  bool Finalise();
  bool SQLQuery(std::string dbname, std::string query_string, std::string &result, int &timeout, std::string& err);
  bool SendLog(std::string message, int severity=2, std::string device="");
  bool SendAlarm(std::string message, std::string device="");
  bool SendMonitoringData(std::string json_data, std::string device="");
  bool SendConfig(std::string json_data, std::string device="");
  bool GetConfig(std::string &json_data, int version, std::string device="");
 
};

#endif
