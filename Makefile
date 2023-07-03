
Dependencies=./Dependencies


ZMQLib= -L $(Dependencies)/zeromq-4.0.7/lib -lzmq
ZMQInclude= -I $(Dependencies)/zeromq-4.0.7/include/

BoostLib= -L $(Dependencies)/boost_1_66_0/install/lib -lboost_date_time -lboost_serialization -lboost_iostreams
BoostInclude= -I $(Dependencies)/boost_1_66_0/install/include


all: lib/libDAQInterface.so RemoteControl Win_Mac_translation Example

lib/libDAQInterface.so: src/*.cpp
	g++ -O3 -fPIC  -Wpedantic -std=c++11 -shared src/*.cpp -I include -o lib/libDAQInterface.so -lpthread $(BoostInclude) $(BoostLib) $(ZMQInclude) $(ZMQLib)

RemoteControl: src/RemoteControl.cpp
	g++ -O3  -Wpedantic -std=c++11 src/RemoteControl.cpp -o RemoteControl  -I ./include/ -L lib/ -lDAQInterface -lpthread $(BoostInclude) $(BoostLib) $(ZMQInclude) $(ZMQLib)

Win_Mac_translation: Win_Mac_translation.cpp
	g++ -O3  -Wpedantic -std=c++11 Win_Mac_translation.cpp -o Win_Mac_translation  -I ./include/ -L lib/ -lDAQInterface -lpthread $(BoostInclude) $(BoostLib) $(ZMQInclude) $(ZMQLib)

Example: Example.cpp
	g++ -O3  -Wpedantic -std=c++11 Example.cpp -o Example -I ./include/ -L lib/ -lDAQInterface -lpthread $(BoostInclude) $(BoostLib) $(ZMQInclude) $(ZMQLib)

clean:
	rm -f lib/libDAQInterface.so RemoteControl Win_Mac_translation Example
