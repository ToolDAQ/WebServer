all: Example

Example: Example.cpp src/*.cpp include/*.h
	mkdir -p lib/
	g++ -O3 -fPIC  -Wpedantic -std=c++11 -shared src/*.cpp -I include -o lib/libDAQInterface.so  -L ../Dependencies/boost_1_66_0/install/lib -lboost_date_time -lboost_serialization -lboost_iostreams -I ../Dependencies/boost_1_66_0/install/include/ -I ../Dependencies/zeromq-4.0.7/include/ -L ../Dependencies/zeromq-4.0.7/lib/ -lzmq -lpthread
	g++ -O3  -Wpedantic -std=c++11 Example.cpp -I include/ -L lib/ -lDAQInterface  -L ../Dependencies/boost_1_66_0/install/lib -lboost_date_time -lboost_serialization -lboost_iostreams -I ../Dependencies/boost_1_66_0/install/include/ -I ../Dependencies/zeromq-4.0.7/include/ -L ../Dependencies/zeromq-4.0.7/lib/ -lzmq -o $@

clean:
	rm -f lib/*
	rm -f Example
