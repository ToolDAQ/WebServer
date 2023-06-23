#include "PGClient.h"

Query::Query(std::string dbname_in, std::string query_string_in, char type_in){
	dbname = dbname_in;
	query_string = query_string_in;
	type = type_in;
	success=0;
	query_response=std::vector<std::string>{};
	err="";
	msg_id=-1;
}

Query::Query(){
	dbname="";
	query_string="";
	type='\0';
	success=0;
	query_response=std::vector<std::string>{};
	err="";
	msg_id=-1;
}

void Query::Print() const {
	std::cout<<"dbname="<<dbname<<std::endl;
	std::cout<<"query="<<query_string<<std::endl;
	std::cout<<"type="<<type<<std::endl;
	std::cout<<"success="<<success<<std::endl;
	std::cout<<"err="<<err<<std::endl;
	std::cout<<"id="<<msg_id<<std::endl;
	std::cout<<"response.size()="<<query_response.size()<<std::endl;
	for(auto&& aresp : query_response){
		std::cout<<aresp<<std::endl;
	}
}

Query::Query(const Query& qry_in){
	dbname = qry_in.dbname;
	query_string = qry_in.query_string;
	type = qry_in.type;
	success = qry_in.success;
	query_response = qry_in.query_response;
	err = qry_in.err;
	msg_id = qry_in.msg_id;
}

Query::Query(Query&& qry_in){
	dbname = qry_in.dbname;
	query_string = qry_in.query_string;
	type = qry_in.type;
	success = qry_in.success;
	query_response = std::move(qry_in.query_response);
	err = qry_in.err;
	msg_id = qry_in.msg_id;
	qry_in.dbname="";
	qry_in.query_string="";
	qry_in.type='\0';
	qry_in.success=0;
	qry_in.msg_id=-1;
	qry_in.query_response=std::vector<std::string>{};
}

Query& Query::operator=(Query&& qry_in){
	if(this!=&qry_in){
		dbname = qry_in.dbname;
		query_string = qry_in.query_string;
		type = qry_in.type;
		success = qry_in.success;
		query_response = std::move(qry_in.query_response);
		err = qry_in.err;
		msg_id = qry_in.msg_id;
		qry_in.dbname="";
		qry_in.query_string="";
		qry_in.type='\0';
		qry_in.success=0;
		qry_in.msg_id=-1;
		qry_in.query_response=std::vector<std::string>{};
	}
	return *this;
}

void PGClient::SetUp(zmq::context_t* in_context, std::function<void(std::string msg, int msg_verb, int verbosity)> log){
	
  context = in_context;
  m_log = log;

}

bool PGClient::Initialise(std::string configfile){
	
	/*               Retrieve Configs            */
	/* ----------------------------------------- */

	// configuration options can be parsed via a Store class
	if(configfile!="") m_variables.Initialise(configfile);
	

	/*            General Variables              */
	/* ----------------------------------------- */
	verbosity = 1;
	max_retries = 3;
	m_variables.Get("verbosity",verbosity);
	m_variables.Get("max_retries",max_retries);
	int advertise_endpoints = 1;
	m_variables.Get("advertise_endpoints",advertise_endpoints);

	get_ok = InitZMQ();
	if(not get_ok) return false;

	// new HK version; don't advertise endpoints, middleman just assumes they exist
	if(advertise_endpoints){
		get_ok &= RegisterServices();
		if(not get_ok) return false;
	}

	/*                Time Tracking              */
	/* ----------------------------------------- */

	// time to wait between resend attempts if not ack'd
	int resend_period_ms = 1000;
	// how often to print out stats on what we're sending
	int print_stats_period_ms = 5000;

	// Update with user-specified values.
	m_variables.Get("resend_period_ms",resend_period_ms);
	m_variables.Get("print_stats_period_ms",print_stats_period_ms);

	// convert times to boost for easy handling
	resend_period = boost::posix_time::milliseconds(resend_period_ms);
	print_stats_period = boost::posix_time::milliseconds(print_stats_period_ms);

	// initialise 'last send' times
	last_write = boost::posix_time::microsec_clock::universal_time();
	last_read = boost::posix_time::microsec_clock::universal_time();
	last_printout = boost::posix_time::microsec_clock::universal_time();

	// get the hostname of this machine for monitoring stats
	char buf[255];
	get_ok = gethostname(buf, 255);
	if(get_ok!=0){
		std::cerr<<"Error getting hostname!"<<std::endl;
		perror("gethostname: ");
		hostname = "unknown";
	} else {
		hostname = std::string(buf);
	}

	// initialise the message IDs based on the current time in unix seconds
	//msg_id = (int)time(NULL); -> not unique enough
	uint64_t nanoseconds_since_epoch = std::chrono::duration_cast<std::chrono::nanoseconds>(std::chrono::high_resolution_clock::now().time_since_epoch()).count();
	msg_id = static_cast<uint32_t>(nanoseconds_since_epoch);
	if(verbosity>3) std::cout<<"initialising message ID to "<<msg_id<<std::endl;

	// kick off a thread to do actual send and receive of messages
	terminator = std::promise<void>{};
	std::future<void> signal = terminator.get_future();
	background_thread = std::thread(&PGClient::BackgroundThread, this, std::move(signal));

	return true;
}

bool PGClient::InitZMQ(){
	
	/*                  ZMQ Setup                */
	/* ----------------------------------------- */
	
	// we have two zmq sockets:
	// 1. [PUB]    one for sending write queries to all listeners (the master)
	// 2. [DEALER] one for sending read queries round-robin and receving responses
	
	// specify the ports everything talks/listens on
	clt_pub_port = 77778;   // for sending write queries
	clt_dlr_port = 77777;   // for sending read queries
	// socket timeouts, so nothing blocks indefinitely
	int clt_pub_socket_timeout=500;
	int clt_dlr_socket_timeout=500;  // both send and receive
	
	// poll timeouts - units are milliseconds
	inpoll_timeout=500;
	outpoll_timeout=500;
	
	// total timeout on how long we wait for response from a query
	query_timeout=2000;
	
	// Update with user-specified values.
	m_variables.Get("clt_pub_port",clt_pub_port);
	m_variables.Get("clt_dlr_port",clt_dlr_port);
	m_variables.Get("clt_pub_socket_timeout",clt_pub_socket_timeout);
	m_variables.Get("clt_dlr_socket_timeout",clt_dlr_socket_timeout);
	m_variables.Get("inpoll_timeout",inpoll_timeout);
	m_variables.Get("outpoll_timeout",outpoll_timeout);
	m_variables.Get("query_timeout",query_timeout);
	
	
	// to send replies the middleman must know who to send them to.
	// for read queries, the receiving router socket will append the ZMQ_IDENTITY of the sender
	// which can be given to the sending router socket to identify the recipient.
	// BUT the default ZMQ_IDENTITY of a socket is empty! We must set it ourselves to be useful!
	// for write queries we ALSO need to manually insert the ZMQ_IDENTITY into the written message,
	// because the receiving sub socket does not do this automaticaly.
	
	// using 'getsockopt(ZMQ_IDENTITY)' without setting it first produces an empty string,
	// so seems to need to set it manually to be able to know what the ID is, and
	// insert it into the write queries.
	// FIXME replace with whatever ben wants?
	get_ok = m_variables.Get("ZMQ_IDENTITY",clt_ID);
	if(!get_ok){
		boost::uuids::uuid u = boost::uuids::random_generator()();
		clt_ID = boost::uuids::to_string(u);
		std::cerr<<"Warning! no ZMQ_IDENTITY in PGClient settings!"<<std::endl;
	}
	clt_ID += '\0';
	
		
	// socket to publish write queries
	// -------------------------------
	clt_pub_socket = new zmq::socket_t(*context, ZMQ_PUB);
	clt_pub_socket->setsockopt(ZMQ_SNDTIMEO, clt_pub_socket_timeout);
	clt_pub_socket->bind(std::string("tcp://*:")+std::to_string(clt_pub_port));
	
	
	// socket to deal read queries and receive responses
	// -------------------------------------------------
	clt_dlr_socket = new zmq::socket_t(*context, ZMQ_DEALER);
	clt_dlr_socket->setsockopt(ZMQ_SNDTIMEO, clt_dlr_socket_timeout);
	clt_dlr_socket->setsockopt(ZMQ_RCVTIMEO, clt_dlr_socket_timeout);
	clt_dlr_socket->setsockopt(ZMQ_IDENTITY, clt_ID.c_str(), clt_ID.length());
	clt_dlr_socket->setsockopt(ZMQ_IMMEDIATE,1);
	clt_dlr_socket->bind(std::string("tcp://*:")+std::to_string(clt_dlr_port));
	
	/*
	// debug: check socket option
	char cltidbuff[255];
	size_t len=255;
	clt_dlr_socket->getsockopt(ZMQ_IDENTITY,(void*)(&cltidbuff[0]),&len);
	std::cout<<"retrieved socket length was: "<<len<<" chars with contents:"<<std::endl;
	fwrite(cltidbuff,sizeof(cltidbuff[0]),len,stdout);
	*/
	
	// bundle the polls together so we can do all of them at once
	zmq::pollitem_t clt_pub_socket_pollout= zmq::pollitem_t{*clt_pub_socket,0,ZMQ_POLLOUT,0};
	zmq::pollitem_t clt_dlr_socket_pollin = zmq::pollitem_t{*clt_dlr_socket,0,ZMQ_POLLIN,0};
	zmq::pollitem_t clt_dlr_socket_pollout = zmq::pollitem_t{*clt_dlr_socket,0,ZMQ_POLLOUT,0};
	
	in_polls = std::vector<zmq::pollitem_t>{clt_dlr_socket_pollin};
	out_polls = std::vector<zmq::pollitem_t>{clt_pub_socket_pollout,
	                                         clt_dlr_socket_pollout};
	
	return true;
}

bool PGClient::RegisterServices(){
	
	/*             Register Services             */
	/* ----------------------------------------- */
	
	// to register our query and response ports with the ServiceDiscovery class
	// we can make our lives a little easier by using a Utilities class
	utilities = new DAQUtilities(context);
	
	// we can now register the client sockets with the following:
	utilities->AddService("psql_write", clt_pub_port);
	utilities->AddService("psql_read",  clt_dlr_port);
	
	return true;
}

void PGClient::Log(std::string msg, int msg_verb, int verbosity){
	// this is normally defined in Tool.h
        if(m_log) m_log(msg, msg_verb, verbosity);

        else if(msg_verb<= verbosity) std::cout<<msg<<std::endl;

}


bool PGClient::BackgroundThread(std::future<void> signaller){
	
	Log("PGClient BackgroundThread starting!",v_debug,verbosity);
	while(true){
		// check if we've been signalled to terminate
		std::chrono::milliseconds span(10);
		if(signaller.wait_for(span)!=std::future_status::timeout){
			// terminate has been set
			Log("PGClient background thread received terminate signal",v_debug,verbosity);
			break;
		}
		
		// otherwise continue our duties
		get_ok = GetNextResponse();
		get_ok = SendNextQuery();
	}
	
	return true;
}

bool PGClient::SendQuery(std::string dbname, std::string query_string, std::vector<std::string>* results, int* timeout_ms, std::string* err){
	// send a query and receive response.
	// This is a wrapper that ensures we always return within the requested timeout.
	if(verbosity>10) std::cout<<"PGClient::SendQuery invoked with query '"<<query_string<<"'"<<std::endl;
	
	// we need to send reads and writes to different sockets.
	// we could ask the user to specify, or try to determine it ourselves
	// it's easy enough to do the latter by identifying keywords
	// but std::string.find is case-sensitive, so fix the case
	std::string uppercasequery;
	for(int i=0; i<query_string.length(); ++i) uppercasequery.append(1,std::toupper(query_string[i]));
	
	bool is_write_txn = (uppercasequery.find("INSERT")!=std::string::npos) ||
	                    (uppercasequery.find("UPDATE")!=std::string::npos) ||
	                    (uppercasequery.find("DELETE")!=std::string::npos);
	char type = (is_write_txn) ? 'w' : 'r';
	
	// encapsulate the query in an object.
	// We need this since we can only get one return value from an asynchronous function call,
	// and we want both a response string and error flag.
	if(verbosity>10) std::cout<<"PGClient::SendQuery constructing Query"<<std::endl;
	Query qry{dbname, query_string, type};
	
	// submit the query asynchrously.
	// This way we have control over how long we wait for the response
	// The response will be a Query object with remaining members populated.
	//std::future<Query> response = std::async(std::launch::async, &PGClient::DoQuery, this, qry);
	// std::async returns a std::future that will block on destruction until the promise returns.
	// if we don't want that to happen, i.e. we want to abandon it if it times out,
	// we instead need to obtain a future from a promise (which is somehow not blocking?),
	// and run our code in a detached thread, using the promise to pass back the result.
	// tbh i don't quite get why this is different but there we go.
	// see https://stackoverflow.com/a/23454840/3544936 and https://stackoverflow.com/a/23460094/3544936
	std::promise<Query> returnval;
	std::future<Query> response = returnval.get_future();
	if(verbosity>10) std::cout<<"PGClient::SendQuery spinning up new thread"<<std::endl;
	std::thread{&PGClient::DoQuery, this, qry, std::move(returnval)}.detach();
	
	// the return from a std::async call is a 'future' object
	// this object will be populated with the return value when it becomes available,
	// but we can wait for a given timeout and then bail if it hasn't resolved in time.
	
	int timeout=query_timeout;              // default timeout for submission of query and receipt of response
	if(timeout_ms) timeout=*timeout_ms;     // override by user if a custom timeout is given
	std::chrono::milliseconds span(timeout);
	// wrap our attempt to get the future in a try-catch, in case of exception
	try {
		// wait_for will return either when the result is ready, or when it times out
		if(verbosity>10) std::cout<<"PGClient::SendQuery waiting for response"<<std::endl;
		if(response.wait_for(span)!=std::future_status::timeout){
			// we got a response in time. retrieve and parse return value
			if(verbosity>10) std::cout<<"PGClient::SendQuery fetching response"<<std::endl;
			qry = response.get();
			if(verbosity>10) std::cout<<"PGClient::SendQuery response is "<<qry.query_response.size()
			                          <<" parts"<<std::endl;
			if(results) *results = qry.query_response;
			if(err) *err = qry.err;
			return qry.success;
		} else {
			// timed out
			std::string errmsg="Timed out after waiting "+std::to_string(timeout)+"ms for response "
			                   "from read query '"+query_string+"'";
			if(verbosity>3) std::cerr<<errmsg<<std::endl;
			if(err) *err=errmsg;
			//std::cout<<"SendQuery returning false"<<std::endl;
			return false;
		}
	} catch(std::exception& e){
		// one thing that can cause an exception is if we terminate the application
		// before the promise is fulfilled (i.e. the response came, or zmq timed out)
		// so long as we catch it's fine.
		Log(std::string{"PGClient caught "}+e.what()+" waiting for query "+query_string,v_error,verbosity);
	}
	return false;  // dummy
}

bool PGClient::SendQuery(std::string dbname, std::string query_string, std::string* results, int* timeout_ms, std::string* err){
	// wrapper for when user expects only one returned row
	if(err) *err="";
	std::vector<std::string> resultsvec;
	bool ret = SendQuery(dbname, query_string, &resultsvec, timeout_ms, err);
	if(resultsvec.size()>0 && results!=nullptr) *results = resultsvec.front();
	// if more than one row returned, flag as error
	if(resultsvec.size()>1){
		*err += ". Query returned "+std::to_string(resultsvec.size())+" rows!";
		ret=false;
	}
	return ret;
}

bool PGClient::DoQuery(Query qry, std::promise<Query> result){
	if(verbosity>10) std::cout<<"PGClient::DoQuery received query"<<std::endl;
	// submit a query, wait for the response and return it
	
	// capture a unique id for this message
	uint32_t thismsgid = ++msg_id;
	qry.msg_id = thismsgid;
	
	// zmq sockets aren't thread-safe, so we have one central sender.
	// we submit our query and keep a ticket to retrieve the return status on completion.
	// similarly, the next response received may not be for us, so a central dealer receives
	// all responses and deals them out to the appropriate recipient. Again we register
	// ourselves as a recipient for the response, and wait for it to be fulfilled.
	// due to the asynchronous nature of these calls, we must register ourselves
	// as a recipient for a response before we even send the request, to ensure that
	// we can be identified as a the recipient as soon as we submit our query.
	// It's a little odd, but that's how it is.
	if(verbosity>10) std::cout<<"PGClient::DoQuery pre-emptively submitting ticket for response"<<std::endl;
	std::promise<Query> response_ticket;
	std::future<Query> response_reciept = response_ticket.get_future();
	send_queue_mutex.lock();
	waiting_recipients.emplace(thismsgid, std::move(response_ticket));
	send_queue_mutex.unlock();
	
	// submit a request to send our query.
	std::promise<int> send_ticket;
	std::future<int> send_receipt = send_ticket.get_future();
	send_queue_mutex.lock();
	if(verbosity>10) std::cout<<"PGClient::DoQuery putting query into waiting-to-send list"<<std::endl;
	waiting_senders.emplace(qry, std::move(send_ticket));
	send_queue_mutex.unlock();
	
	// wait for our number to come up. loooong timeout, but don't hang forever.
	if(verbosity>10) std::cout<<"PGClient::DoQuery waiting for send confirmation"<<std::endl;
	if(send_receipt.wait_for(std::chrono::seconds(30))==std::future_status::timeout){
		if(verbosity>10) std::cerr<<"PGClient::DoQuery timeout"<<std::endl;
		// sending timed out
		if(qry.type=='w') ++write_queries_failed;
		else if(qry.type=='r') ++read_queries_failed;
		Log("Timed out sending query "+std::to_string(thismsgid),v_warning,verbosity);
		qry.success = false;
		qry.err = "Timed out sending query";
		result.set_value(qry);
		
		// since we are giving up waiting for the response, remove ourselves from
		// the list of waiting recipients
		if(verbosity>10) std::cout<<"PGClient::DoQuery de-registering for response on id "<<thismsgid<<std::endl;
		send_queue_mutex.lock();
		waiting_recipients.erase(thismsgid);
		send_queue_mutex.unlock();
		
		return true;
	} // else got a return value
	
	// so we got response about our send request, but did it go through?
	// check for errors sending
	if(verbosity>10) std::cout<<"PGClient::DoQuery getting send confirmation"<<std::endl;
	int ret = send_receipt.get();
	std::string errmsg;
	if(ret==-3) errmsg="Error polling out socket in PollAndSend! Is socket closed?";
	if(ret==-2) errmsg="No listener on out socket in PollAndSend!";
	if(ret==-1) errmsg="Error sending in PollAndSend!";
	if(ret!=0){
		if(verbosity>10) std::cout<<"PGClient::DoQuery got response "<<ret
		                          <<" from PollAndSend: sending failed"<<std::endl;
		if(qry.type=='w') ++write_queries_failed;
		else if(qry.type=='r') ++read_queries_failed;
		Log(errmsg,v_debug,verbosity);
		qry.success = false;
		qry.err = errmsg;
		result.set_value(qry);
		
		// since the send failed we don't expect a response, so remove ourselves
		// from the list of recipients awaiting response
		send_queue_mutex.lock();
		if(verbosity>10) std::cout<<"PGClient::DoQuery de-registering for response on query "<<thismsgid<<std::endl;
		waiting_recipients.erase(thismsgid);
		send_queue_mutex.unlock();
		
		return false;
	}
	
	// if we succeeded in sending the message, we now need to wait for a repsonse.
	if(verbosity>10) std::cout<<"PGClient::DoQuery waiting for response"<<std::endl;
	if(response_reciept.wait_for(std::chrono::seconds(30))==std::future_status::timeout){
	  if(verbosity>10) std::cout<<"PGClient::DoQuery response timeout"<<std::endl;
		// timed out
		if(qry.type=='w') ++write_queries_failed;
		else if(qry.type=='r') ++read_queries_failed;
		Log("Timed out waiting for response for query "+std::to_string(thismsgid),v_warning,verbosity);
		qry.success = false;
		qry.err = "Timed out waiting for response";
		result.set_value(qry);
		return false;
	} else {
		// got a response!
		if(verbosity>10) std::cout<<"PGClient::DoQuery got a response for query "<<qry.msg_id
		                          <<"passing back to caller"<<std::endl;
		try{
			result.set_value(response_reciept.get());
		} catch(std::exception& e){
			Log("PGClient response for query "+std::to_string(qry.msg_id)+" was exception "+e.what(),v_error,verbosity);
			qry.err=e.what();
			qry.success=false;
			result.set_value(qry);
			return false;
		}
		return true;
	}
	
	return true;  // dummy
	
}

bool PGClient::GetNextResponse(){
	// get any new messages from middleman, and notify the client of the outcome
	
	std::vector<zmq::message_t> response;
	dlr_socket_mutex.lock();
	int ret = PollAndReceive(clt_dlr_socket, in_polls.at(0), inpoll_timeout, response);
	dlr_socket_mutex.unlock();
	//std::cout<<"PGClient: GNR returned "<<ret<<std::endl;
	
	// check return status
	if(ret==-2) return true;      // no messages waiting to be received
	
	if(verbosity>10) std::cout<<"PGClient::GetNextResponse had response in socket"<<std::endl;
	if(ret==-3){
		Log("PollAndReceive Error polling in socket! Is socket closed?",v_error,verbosity);
		return false;
	}
	
	if(response.size()==0){
		Log("PollAndReceive received empty response!",v_error,verbosity);
		return false;
	}
	
	// received message may be an acknowledgement of a write, or the result of a read.
	// messages are 2+ zmq parts as follows:
	// 1. the message ID, used by the client to match to the message it sent
	// 2. the response code, to signal errors
	// 3.... the SQL query results, if any. Each row is returned in a new message part.
	Query qry;
	if(ret==-1 || response.size()<2){
		// return of -1 suggests the last zmq message had the 'more' flag set
		// suggesting there should have been more parts, but they never came.
		qry.success = false;
		qry.err="Received incomplete zmq response";
		Log(qry.err,v_warning,verbosity);
		if(ret==-1) Log("Last message had zmq more flag set",v_warning,verbosity);
		if(response.size()<2) Log("Only received "+std::to_string(response.size())+" parts",v_warning,verbosity);
		// continue to parse as much as we can - the first part identifies the query,
		// so we can at least inform the client of the failure
	}
	// else if ret==0 && response.size() >= 2: success
	
	// if we got this far we had at least one response part; the message id
	uint32_t message_id_rcvd = *reinterpret_cast<uint32_t*>(response.at(0).data());
	
	// if we also had a status part, get that
	if(response.size()>1){
		qry.success = *reinterpret_cast<uint32_t*>(response.at(1).data());  // 1=success, 0=fail
	}
	// if we also had further parts, fetch those
	for(int i=2; i<response.size(); ++i){
		//qry.query_response.push_back(std::string(reinterpret_cast<const char*>(response.at(i).data())));
		std::string resp(response.at(i).size(),'\0');
		memcpy((void*)resp.data(), response.at(i).data(), response.at(i).size());
		resp = resp.substr(0,resp.find('\0'));
		qry.query_response.push_back(resp);
	}
	
	if(verbosity>3){
		std::stringstream logmsg;
		logmsg << "PGClient::GetNextResponse received response to query "<<message_id_rcvd
	               <<"; status "<<qry.success<<", response '";
		for(auto& apart : qry.query_response){
			logmsg<<"["<<apart<<"]";
		}
		logmsg<<"'"<<std::endl;
		Log(logmsg.str(),v_debug,verbosity);
	}
	
	// get the ticket associated with this message id
	if(waiting_recipients.count(message_id_rcvd)){
		std::promise<Query>* ticket = &waiting_recipients.at(message_id_rcvd);
		ticket->set_value(qry);
		// remove it from the map of waiting promises
		send_queue_mutex.lock();
		waiting_recipients.erase(message_id_rcvd);
		send_queue_mutex.unlock();
	} else {
		// unknown message id?
		Log("Unknown message id "+std::to_string(message_id_rcvd)+" with no client",v_error,verbosity);
		return false;
	}
	
	return true;
}

bool PGClient::SendNextQuery(){
	// send the next message in the waiting query queue
	
	if(waiting_senders.empty()){
		// nothing to send
		return true;
	}
	if(verbosity>10) std::cout<<"PGClient::SendNextQuery got outgoing query to send"<<std::endl;
	
	// get the next query to send
	send_queue_mutex.lock();
	std::pair<Query, std::promise<int>> next_qry = std::move(waiting_senders.front());
	waiting_senders.pop();
	send_queue_mutex.unlock();
	Query& qry = next_qry.first;
	if(verbosity>10) std::cout<<"PGClient::SendNextQuery sending query "<<qry.msg_id<<std::endl;
	if(verbosity>3){
		std::stringstream logmsg;
		logmsg<<"Sending query "<<qry.msg_id<<", \""<<qry.query_string<<"\""<<std::endl;
		//Log(logmsg.str(),v_debug,verbosity);
	}
	
	// write queries go to the pub socket, read queries to the dealer
	zmq::socket_t* thesocket = (qry.type=='w') ? clt_pub_socket : clt_dlr_socket;
	
	// send out the query
	// queries should be formatted as 4 parts:
	// 1. client ID
	// 2. message ID
	// 3. database name
	// 4. SQL statement
	// XXX note! read queries go out via a Dealer socket, which automatically prepends
	// the ZMQ identity of the sender. Writes go out via a Pub socket that does not!
	int ret=-99;
	dlr_socket_mutex.lock();
	if(verbosity>10) std::cout<<"PGClient::SendNextQuery calling PollAndSend"<<std::endl;
	if(qry.type=='w'){
		ret = PollAndSend(thesocket, out_polls.at(1), outpoll_timeout, clt_ID, qry.msg_id, qry.dbname, qry.query_string);
	} else {
		ret = PollAndSend(thesocket, out_polls.at(1), outpoll_timeout, qry.msg_id, qry.dbname, qry.query_string);
	}
	if(verbosity>10) std::cout<<"PGClient::SendNextQuery send returned "<<ret<<", passing to recipient"<<std::endl;
	dlr_socket_mutex.unlock();
	//std::cout<<"PGClient SNQ P&S returned "<<ret<<std::endl;
	
	// notify the client that the message has been sent
	next_qry.second.set_value(ret);
	
	return true;
	
}

bool PGClient::Finalise(){
	// terminate our background thread
	Log("PGClient sending background thread term signal",v_debug,verbosity);
	terminator.set_value();
	// wait for it to finish up and return
	Log("PGClient waiting for background thread to rejoin",v_debug,verbosity);
	background_thread.join();
	
	Log("PGClient Removing services",v_debug,verbosity);
	if(utilities) utilities->RemoveService("psql_write");
	if(utilities) utilities->RemoveService("psql_read");
	
	Log("PGClient Deleting Utilities class",v_debug,verbosity);
	if(utilities) delete utilities; utilities=nullptr;
	
	// clear old connections
	clt_pub_connections.clear();
	clt_dlr_connections.clear();
	
	Log("PGClient deleting sockets",v_debug,verbosity);
	delete clt_pub_socket; clt_pub_socket=nullptr;
	delete clt_dlr_socket; clt_dlr_socket=nullptr;
	
	// clear old associated polls
	in_polls.clear();
	out_polls.clear();
	
	// clear old queries and responses
	waiting_senders = std::queue<std::pair<Query, std::promise<int>>>{};
	waiting_recipients.clear();
	
	// can't use 'Log' since we may have deleted the Logging class
	if(verbosity>3) std::cout<<"PGClient finalise done"<<std::endl;
	
	return true;
}

// =====================================================================
// ZMQ helper functions; TODO move these to external class? since they're shared by middleman.

bool PGClient::Send(zmq::socket_t* sock, bool more, zmq::message_t& message){
	if(verbosity>10) std::cout<<__PRETTY_FUNCTION__<<" called"<<std::endl;
	bool send_ok;
	if(more) send_ok = sock->send(message, ZMQ_SNDMORE);
	else     send_ok = sock->send(message);
	
	if(verbosity>10) std::cout<<"returning "<<send_ok<<std::endl;
	return send_ok;
}

bool PGClient::Send(zmq::socket_t* sock, bool more, std::string messagedata){
	if(verbosity>10) std::cout<<__PRETTY_FUNCTION__<<" called"<<std::endl;
	// form the zmq::message_t
	zmq::message_t message(messagedata.size());
	//snprintf((char*)message.data(), messagedata.size()+1, "%s", messagedata.c_str());
	memcpy(message.data(), messagedata.data(), message.size());
	
	// send it with given SNDMORE flag
	bool send_ok;
	if(more) send_ok = sock->send(message, ZMQ_SNDMORE);
	else     send_ok = sock->send(message);
	
	if(verbosity>10) std::cout<<"returning "<<send_ok<<std::endl;
	return send_ok;
}

bool PGClient::Send(zmq::socket_t* sock, bool more, std::vector<std::string> messages){
	if(verbosity>10) std::cout<<__PRETTY_FUNCTION__<<" called"<<std::endl;
	
	// loop over all but the last part in the input vector,
	// and send with the SNDMORE flag
	for(int i=0; i<(messages.size()-1); ++i){
		if(verbosity>10) std::cout<<"sending part "<<i<<"/"<<messages.size()<<std::endl;
		
		// form zmq::message_t
		zmq::message_t message(messages.at(i).size());
		memcpy(message.data(), messages.at(i).data(), messages.at(i).size());
		//snprintf((char*)message.data(), messages.at(i).size()+1, "%s", messages.at(i).c_str());
		
		// send this part
		bool send_ok = sock->send(message, ZMQ_SNDMORE);
		
		if(verbosity>10) std::cout<<"returned "<<send_ok<<std::endl;
		// break on error
		if(not send_ok) return false;
	}
	
	if(verbosity>10) std::cout<<"sending part "<<(messages.size()-1)<<"/"<<messages.size()<<std::endl;
	// form the zmq::message_t for the last part
	zmq::message_t message(messages.back().size());
	memcpy(message.data(), messages.back().data(), messages.back().size());
	//snprintf((char*)message.data(), messages.back().size()+1, "%s", messages.back().c_str());
	
	// send it with, or without SNDMORE flag as requested
	bool send_ok;
	if(more) send_ok = sock->send(message, ZMQ_SNDMORE);
	else     send_ok = sock->send(message);
	if(verbosity>10) std::cout<<"returned "<<send_ok<<std::endl;
	
	return send_ok;
}

int PGClient::PollAndReceive(zmq::socket_t* sock, zmq::pollitem_t poll, int timeout, std::vector<zmq::message_t>& outputs){
	
	// poll the input socket for messages
	get_ok = zmq::poll(&poll, 1, timeout);
	if(get_ok<0){
		// error polling - is the socket closed?
		return -3;
	}
	
	// check for messages waiting to be read
	if(poll.revents & ZMQ_POLLIN){
		
		// recieve all parts
		get_ok = Receive(sock, outputs);
		if(not get_ok) return -1;
		
	} else {
		// no waiting messages
		return -2;
	}
	// else received ok
	return 0;
}

bool PGClient::Receive(zmq::socket_t* sock, std::vector<zmq::message_t>& outputs){
	
	outputs.clear();
	int part=0;
	
	// recieve parts into tmp variable
	zmq::message_t tmp;
	while(sock->recv(&tmp)){
		
		// transfer the received message to the output vector
		outputs.resize(outputs.size()+1);
		outputs.back().move(&tmp);
		
		// receive next part if there is more to come
		if(!outputs.back().more()) break;
		
	}
	
	// if we broke the loop but last successfully received message had a more flag,
	// we must have broken due to a failed receive
	if(outputs.back().more()){
		// sock->recv failed
		return false;
	}
	
	// otherwise no more parts. done.
	return true;
}

