#include <chrono>
#include <iostream>
#include <iomanip>
#include <stdexcept>
#include <sstream>
#include <string>

#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <Store.h>

#include <zmq.hpp>

std::string uri_decode(std::string string) {
  size_t i = 0;
  while (true) {
    i = string.find('+', i);
    if (i == std::string::npos) break;
    string[i++] = ' ';
  };

  i = string.find('%');
  if (i == std::string::npos) return string;

  size_t j = i;
  while (i < string.size())
    if (string[i] == '%') {
      if (!(i + 2 < string.size()
            && isxdigit(string[i+1])
            && isxdigit(string[i+2])))
      {
        std::stringstream ss;
        ss
          << "malformed URI sequence: \""
          << string
          << "\", position "
          << i;
        throw std::runtime_error(ss.str());
      };

      sscanf(&string[++i], "%2hhu", &string[j++]);
      i += 2;
    } else
      string[j++] = string[i++];

  return string;
};

std::unordered_map<std::string, std::string> get_arguments() {
  std::unordered_map<std::string, std::string> result;

  char* query = getenv("QUERY_STRING");
  if (!query) return result;

  char* begin = query;
  char* split;
  char* end;
  do {
    end = strchrnul(begin, '&');
    split = strchr(begin, '=');
    if (!split || split > end) {
      std::stringstream ss;
      ss << "Invalid query string: " << query;
      throw std::runtime_error(ss.str());
    };
    result.emplace(
        std::pair {
          uri_decode(std::string(begin, split)),
          uri_decode(std::string(split + 1, end))
        }
    );
    begin = end + 1;
  } while (*end);

  return result;
};

std::string& get_argument(
    std::unordered_map<std::string, std::string>& arguments,
    const std::string& name
) {
  auto argument = arguments.find(name);
  if (argument == arguments.end())
    throw std::runtime_error("No required argument: " + name);
  return argument->second;
};

int main(int argc, char** argv) {
  try {
    std::ofstream* debug = nullptr;
    if (argc > 2 && strcmp(argv[1], "-d") == 0)
      debug = new std::ofstream(argv[2], std::ios::out);


    auto args = get_arguments();
    std::string& ip   = get_argument(args, "ip");
    std::string& port = get_argument(args, "port");

    std::string command;
    std::string argument;
    std::cin >> command >> std::ws;
    std::getline(std::cin, argument, '\0');

    if (debug) *debug << "command: '" << command << "', argument: '" << argument << '\'' << std::endl;
    std::string json;
    {
      ToolFramework::Store store;

      auto now = std::chrono::system_clock::to_time_t(
          std::chrono::system_clock::now()
      );
      std::stringstream ss;
      ss << std::put_time(std::localtime(&now), "%F %TZ%z");
      store.Set("msg_time", ss.str());

      store.Set("msg_type",  "Command");
      store.Set("msg_value", command);
      store.Set("var1",      argument);

      store >> json;
    };

    if (debug) *debug << "opening zmq context" << std::endl;
    zmq::context_t context(1);

    if (debug) *debug << "creating socket" << std::endl;
    zmq::socket_t socket(context, ZMQ_REQ);
    const int timeout = 5000;
    socket.setsockopt(ZMQ_RCVTIMEO,  timeout);
    socket.setsockopt(ZMQ_SNDTIMEO,  timeout);

    {
      if (debug) *debug << "connecting to socket" << std::endl;
      std::stringstream ss;
      ss << "tcp://" << ip << ':' << port;
      std::string s = ss.str();
      socket.connect(s.c_str());
    };

    zmq::message_t send(json.size() + 1);
    memcpy(send.data(), json.c_str(), json.size() + 1);

    // FIXME should poll for listener before sending
    if (debug) *debug << "sending '" << json << '\'' << std::endl;
    bool ok = socket.send(send);
    if (debug) *debug << "send success: " << ok << std::endl;
    if (!ok) throw std::runtime_error("zmq send failed");

    zmq::message_t receive;
    if (debug) *debug << "receiving..." << std::endl;
    // FIXME should poll for inbound before receiving

    ok = socket.recv(&receive);
    if (debug) *debug << "recv success: " << ok << std::endl;
    if (!ok) throw std::runtime_error("zmq rcv failed");

    size_t size = receive.size();
    if (size == 0) throw std::runtime_error("zmq rcv got empty response");
    std::string answer(size, 0); // one byte too many?
    memcpy(answer.data(), receive.data(), receive.size());
    if (debug) *debug << "got response: '" << answer << '\'' << std::endl;

    ToolFramework::Store store;
    store.JsonParser(answer);

    {
      std::string type;
      if (!store.Get("msg_type", type))
        throw std::runtime_error("Invalid reply: no 'msg_type'");
      if (type != "Command Reply")
        throw std::runtime_error(
            "Invalid reply: expected 'Command Reply', got " + type
        );
    };

    auto response = store.Get<std::string>("msg_value");

    std::cout << "Content-type: text/plain\r\n\r\n" << response;
  } catch (std::exception& e) {
    std::cout
      << "Content-type: text/plain\r\n"
      << "Status: 500\r\n\r\n"
      << e.what();
  };
  return 0;
};
