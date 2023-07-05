all: Win_Mac_translation_server backgroundSD Trigger_proxy

Win_Mac_translation_server: src/Win_Mac_translation_server.cpp
	g++ -O3 src/Win_Mac_translation_server.cpp -o Win_Mac_translation_server -I /opt/zeromq-4.0.7/include/ -L /opt/zeromq-4.0.7/lib/ -lzmq -I /opt/boost_1_66_0/install/include/ -L /opt/boost_1_66_0/install/lib/ -lboost_date_time -lboost_serialization -lboost_iostreams

backgroundSD: src/backgroundSD2.cpp
	g++ -O3 src/backgroundSD2.cpp -o backgroundSD -I /opt/zeromq-4.0.7/include/ -L /opt/zeromq-4.0.7/lib/ -lzmq -I /opt/boost_1_66_0/install/include/ -L /opt/boost_1_66_0/install/lib/ -lboost_date_time -lboost_serialization -lboost_iostreams -I /opt/ToolDAQFramework/include/ -L /opt/ToolDAQFramework/lib/ -lStore -lServiceDiscovery

Trigger_proxy: src/Trigger_proxy.cpp
	g++ -O3 src/Trigger_proxy.cpp -o Trigger_proxy -I /opt/zeromq-4.0.7/include/ -L /opt/zeromq-4.0.7/lib/ -lzmq -I /opt/boost_1_66_0/install/include/ -L /opt/boost_1_66_0/install/lib/ -lboost_date_time -lboost_serialization -lboost_iostreams -I /opt/ToolDAQFramework/include/ -L /opt/ToolDAQFramework/lib/ -lStore -lServiceDiscovery -lDataModel

clean:
	rm -f Win_Mac_translation_server
	rm -f backgroundSD
	rm -f Trigger_proxy
