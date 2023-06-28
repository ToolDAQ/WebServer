
Dependencies=./Dependencies


ZMQLib= -L $(Dependencies)/zeromq-4.0.7/lib -lzmq
ZMQInclude= -I $(Dependencies)/zeromq-4.0.7/include/

BoostLib= -L $(Dependencies)/boost_1_66_0/install/lib -lboost_date_time -lboost_serialization -lboost_iostreams
BoostInclude= -I $(Dependencies)/boost_1_66_0/install/include


all: lib/libDAQInterface.so Example

lib/libDAQInterface.so:
	g++ -O3 -fPIC  -Wpedantic -std=c++11 -shared src/*.cpp -I include -o lib/libDAQInterface.so -lpthread $(BoostInclude) $(BoostLib) $(ZMQInclude) $(ZMQLib)

Example:
	g++ -O3  -Wpedantic -std=c++11 Example.cpp -o Example -I ./include/ -L lib/ -lDAQInterface -lpthread $(BoostInclude) $(BoostLib) $(ZMQInclude) $(ZMQLib)

clean:
	rm lib/libDAQInterface.so Example
