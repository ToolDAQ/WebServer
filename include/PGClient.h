#ifndef PGCLIENT_H
#define PGCLIENT_H

#include "Store.h"
#include "DAQUtilities.h"

#include "zmq.hpp"
#include "boost/date_time/posix_time/posix_time.hpp"

#include <string>
#include <iostream>
#include <stdio.h> // fwrite
#include <map>
#include <queue>
#include <future>
#include <mutex>
#include <unistd.h>  // gethostname
#include <locale>    // toupper
#include <functional>   // std::function, std::negate

struct Query {
	Query(std::string dbname_in, std::string query_string_in, char query_type_in);
	Query(const Query& qry_in);  // copy constructor
	Query(Query&& qry_in);       // move constructor
	Query& operator=(Query&& query_in); // move assignment operator
	Query();
	void Print() const;
	std::string dbname;
	std::string query_string;
	char type;
	uint32_t success;            // middleman treats this as BOOL: 1=success, 0=fail
	std::vector<std::string> query_response;
	std::string err;
	uint32_t msg_id;
};

class PGClient {
	public:
	PGClient(){};
	~PGClient(){};
	void SetUp(zmq::context_t* in_context, std::function<void(std::string msg, int msg_verb, int verbosity)> log=nullptr); // possibly move to constructor
	bool Initialise(std::string configfile);
	bool Finalise();	

	// interfaces called by clients. These return within timeout
	bool SendQuery(std::string dbname, std::string query_string, std::vector<std::string>* results, int* timeout_ms, std::string* err);
	bool SendQuery(std::string dbname, std::string query_string, std::string* results, int* timeout_ms, std::string* err);
	// wrapper funtion; add query to outgoing queue, receive response. ~30s timeout.
	
	
	private:

	int clt_pub_port;
	int clt_dlr_port;
	mutable std::mutex send_queue_mutex;
	mutable std::mutex dlr_socket_mutex;
	
	std::function<void(std::string msg, int msg_verb, int verbosity)> m_log = nullptr;
	Store m_variables;
	DAQUtilities* utilities = nullptr;
	// required by the Utilities class to keep track of connections to clients
	std::map<std::string,Store*> clt_pub_connections;
	std::map<std::string,Store*> clt_dlr_connections;
	
	zmq::context_t* context = nullptr;
	
	zmq::socket_t* clt_pub_socket = nullptr;
	zmq::socket_t* clt_dlr_socket = nullptr;
	
	std::vector<zmq::pollitem_t> in_polls;
	std::vector<zmq::pollitem_t> out_polls;
	
	std::queue<std::pair<Query, std::promise<int>>> waiting_senders;
	std::map<uint32_t, std::promise<Query>> waiting_recipients;

	void Log(std::string msg, int msg_verb, int verbosity); //??  generalise private
	bool InitZMQ(); //private
	bool RegisterServices(); //private
	bool DoQuery(Query qry, std::promise<Query>); //private
	// actual send/receive functions
	bool SendNextQuery(); //private
	bool GetNextResponse(); //priavte
	
	bool BackgroundThread(std::future<void> terminator);
	std::thread background_thread;   // a thread that will perform zmq socket operations in the background
	std::promise<void> terminator;   // call set_value to signal the background_thread should terminate
	
	// TODO add retrying
	int max_retries;
	int inpoll_timeout;
	int outpoll_timeout;
	int query_timeout;
	
	// TODO add stats reporting
	boost::posix_time::time_duration resend_period;      // time between resends if not acknowledged
	boost::posix_time::time_duration print_stats_period; // time between printing info about what we're doing
	boost::posix_time::ptime last_write;                 // when we last sent a write query
	boost::posix_time::ptime last_read;                  // when we last sent a read query
	boost::posix_time::ptime last_printout;              // when we last printed out stats about what we're doing
	
	int read_queries_failed;
	int write_queries_failed;
	
	// general
	int verbosity;
	// verbosity levels: if 'verbosity' < this level, the message type will be logged.
	int v_error=0;
	int v_warning=1;
	int v_message=2;
	int v_debug=3;
	int get_ok;
	boost::posix_time::time_duration elapsed_time;
	std::string hostname;
	int execute_iterations=0;
	
	// ZMQ socket identities - we really only need the reply socket one
	// since that's the one the middleman needs to know to send replies back
	std::string clt_ID;
	
	uint32_t msg_id = 0;
	
	// =======================================================
	
	// zmq helper functions
	// TODO move to separate class as these are shared by middleman
	
	int PollAndReceive(zmq::socket_t* sock, zmq::pollitem_t poll, int timeout, std::vector<zmq::message_t>& outputs);
	bool Receive(zmq::socket_t* sock, std::vector<zmq::message_t>& outputs);
	
	// base cases; send single (final) message part
	// 1. case where we're given a zmq::message_t -> just send it
	bool Send(zmq::socket_t* sock, bool more, zmq::message_t& message);
	// 2. case where we're given a std::string -> specialise accessing underlying data
	bool Send(zmq::socket_t* sock, bool more, std::string messagedata);
	// 3. case where we're given a vector of strings
	bool Send(zmq::socket_t* sock, bool more, std::vector<std::string> messages);
	// 4. generic case for other primitive types -> relies on &messagedata and sizeof(T) being suitable.
	template <typename T>
	bool Send(zmq::socket_t* sock, bool more, T&& messagedata){
		if(verbosity>10) std::cout<<__PRETTY_FUNCTION__<<" called"<<std::endl;
		zmq::message_t message(sizeof(T));
		memcpy(message.data(), &messagedata, sizeof(T));
		bool send_ok;
		if(more) send_ok = sock->send(message, ZMQ_SNDMORE);
		else     send_ok = sock->send(message);
		if(verbosity>10) std::cout<<"returning "<<send_ok<<std::endl;
		return send_ok;
	}
	
	// recursive case; send the next message part and forward all remaining parts
	template <typename T, typename... Rest>
	bool Send(zmq::socket_t* sock, bool more, T&& message, Rest&&... rest){
		if(verbosity>10) std::cout<<__PRETTY_FUNCTION__<<" called"<<std::endl;
		bool send_ok = Send(sock, true, std::forward<T>(message));
		if(not send_ok) return false;
		send_ok = Send(sock, false, std::forward<Rest>(rest)...);
		if(verbosity>10) std::cout<<"returning "<<send_ok<<std::endl;
		return send_ok;
	}
	
	// wrapper to do polling if required
	// version if one part
	template <typename T>
	int PollAndSend(zmq::socket_t* sock, zmq::pollitem_t poll, int timeout, T&& message){
		if(verbosity>10) std::cout<<__PRETTY_FUNCTION__<<" called"<<std::endl;
		int send_ok=0;
		// check for listener
		int ret = zmq::poll(&poll, 1, timeout);
		if(ret<0){
			// error polling - is the socket closed?
			send_ok = -3;
		} else if(poll.revents & ZMQ_POLLOUT){
			bool success = Send(sock, false, std::forward<T>(message));
			send_ok = success ? 0 : -1;
		} else {
			// no listener
			send_ok = -2;
		}
		if(verbosity>10) std::cout<<"returning "<<send_ok<<std::endl;
		return send_ok;
	}
	
	// wrapper to do polling if required
	// version if more than one part
	template <typename T, typename... Rest>
	int PollAndSend(zmq::socket_t* sock, zmq::pollitem_t poll, int timeout, T&& message, Rest&&... rest){
		if(verbosity>10) std::cout<<__PRETTY_FUNCTION__<<" called"<<std::endl;
		int send_ok = 0;
		// check for listener
		int ret = zmq::poll(&poll, 1, timeout);
		if(ret<0){
			// error polling - is the socket closed?
			send_ok = -3;
		} else if(poll.revents & ZMQ_POLLOUT){
			bool success = Send(sock, true, std::forward<T>(message), std::forward<Rest>(rest)...);
			send_ok = success ? 0 : -1;
		} else {
			// no listener
			send_ok = -2;
		}
		if(verbosity>10) std::cout<<"returning "<<send_ok<<std::endl;
		return send_ok;
	}
	
};

#endif
