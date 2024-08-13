#include <iostream>
#include <map>
#include <string>
#include <exception>

#include <pqxx/connection>
#include <pqxx/nontransaction>
#include <pqxx/result>

using std::cout;

std::string uri_decode(const char* begin, const char* end) {
  const char* s = begin;
  std::string result;
  while (s < end) {
    if (*s == '%') {
      char x = 0;
      for (int i = 1; i <= 2; ++i) {
        char c = s[i];
        if (c >= '0' && c <= '9')
          c -= '0';
        else if (c >= 'a' && c <= 'f')
          c -= 'a';
        else if (c >= 'A' && c <= 'F')
          c -= 'A';
        else {
          std::stringstream ss;
          ss << "invalid URI string: `";
          ss.write(begin, end - begin);
          ss << "': invalid hexadecimal: %" << s[1] << s[2];
          throw std::runtime_error(ss.str());
        };
        x = x << 4 | c;
      };
      result.push_back(x);
      s += 3;
    } else
      result.push_back(*s++);
  };
  return result;
};

void out_array(std::string array) {
  array.front() = '[';
  array.back()  = ']';
  cout << array;
};

void out(const std::string& string) {
  cout << '"';
  for (auto c : string) {
    if (c == '"' || c == '\\') cout << '\\';
    cout << c;
  };
  cout << '"';
};

void out_plot(const pqxx::row& plot) {
  cout << '{';
  cout << "\"name\":\"" << plot["plot"].c_str();
  cout << "\",\"x\":";
  out_array(plot["x"].c_str());
  cout << ",\"y\":";
  out_array(plot["y"].c_str());
  cout << ",\"xlabel\":";
  out(plot["xlabel"].c_str());
  cout << ",\"ylabel\":";
  out(plot["ylabel"].c_str());
  cout << ",\"title\":";
  out(plot["title"].c_str());
  cout << ",\"info\":" << plot["info"].c_str();
  cout << '}';
};

int main(int argc, char** argv) {
  try {
    pqxx::connection db("postgresql://root@localhost/daq");
    pqxx::nontransaction t(db);

    char* query = getenv("QUERY_STRING");
    if (query && strncmp(query, "plot=", 5) == 0) {
      char* name = query + 5;

      std::stringstream ss;
      ss << "select * from plots where plot = '";
      ss << t.esc(uri_decode(name, strchrnul(name, '&')));
      ss << '\'';
      auto plots = t.exec(ss.str());

      cout << "Content-type: application/json\n\n";

      if (plots.empty())
        cout << "null";
      else
        out_plot(plots.front());
      cout << '\n';
      return 0;
    };

    auto plots = t.exec("select * from plots");
    cout << "Content-type: application/json\n\n";
    cout << '[';
    bool first = true;
    for (auto plot : plots) {
      if (!first) cout << ',';
      first = false;
      out_plot(plot);
    };
    cout << "]\n";

    return 0;
  } catch (std::exception& e) {
    cout
      << "Content-type: text/plain\n"
         "Status: 500 internal server error\n\n"
      << e.what() << '\n';
  };
};
