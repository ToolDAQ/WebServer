#include "httplib.h"
#include <iostream>
#include <chrono>
#include <thread>
#include <ctime>

using namespace httplib;

int main() {
    Server svr;

    svr.Get("/events", [](const Request& req, Response& res) {
        res.set_header("Content-Type", "text/event-stream");
        res.set_header("Cache-Control", "no-cache");
        res.set_header("Connection", "keep-alive");
        res.set_header("Access-Control-Allow-Origin", "*");

        std::cout<<"connected"<<std::endl;

        res.set_chunked_content_provider(
            "text/event-stream",
            [](size_t offset, DataSink& sink) {
                while (sink.is_writable()) {
                    std::this_thread::sleep_for(std::chrono::seconds(2));

                    auto now = std::time(nullptr);
                    std::string msg = "data: " + std::string(std::ctime(&now));
                    msg.pop_back(); // remove newline
                    msg += "\n\n";

                    // Write with pointer and size
                    if (!sink.write(msg.c_str(), msg.size())) {
                        std::cerr << "Write failed\n";
                        break;
                    }
                }

                sink.done();
                return true;
            }
        );
    });

    std::cout << "SSE server running at http://localhost:9000/events\n";
    svr.listen("0.0.0.0", 9000);
}
