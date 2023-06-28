all:
	g++ Win_Mac_translation.cpp -o Win_Mac_translation -I /opt/zeromq-4.0.7/include/ -L /opt/zeromq-4.0.7/lib/ -lzmq -I /opt/boost_1_66_0/install/include/ -L /opt/boost_1_66_0/install/lib/ -lboost_date_time -lboost_serialization -lboost_iostreams
