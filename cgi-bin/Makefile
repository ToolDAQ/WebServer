all:  sendcommand2.cgi sendcommand2nopadding.cgi


sendcommand2.cgi: sendcommand2.cpp
	g++ -O3  sendcommand2.cpp -o sendcommand2.cgi -L /opt/ToolDAQFramework/lib -lStore -lServiceDiscovery -lcgicc  -I /usr/local/include -I /opt/ToolDAQFramework/include -I /opt/boost_1_66_0/install/include/  -I /opt/zeromq\
-4.0.7/include -L /opt/boost_1_66_0/install/lib  -lboost_date_time -lboost_serialization  -lboost_iostreams  -L /opt/zeromq-4.0.7/lib -lzmq
	chmod a+x sendcommand2.cgi

sendcommand2nopadding.cgi: sendcommand2nopadding.cpp
	g++ -O3  sendcommand2nopadding.cpp -o sendcommand2nopadding.cgi -L /opt/ToolDAQFramework/lib -lStore -lServiceDiscovery  -lcgicc  -I /usr/local/include -I /opt/ToolDAQFramework/include -I /opt/boost_1_66_0/install/inclu\
de/  -I /opt/zeromq-4.0.7/include -L /opt/boost_1_66_0/install/lib  -lboost_date_time -lboost_serialization  -lboost_iostreams  -L /opt/zeromq-4.0.7/lib -lzmq
	chmod a+x sendcommand2nopadding.cgi


clean:

	rm  sendcommand2.cgi sendcommand2nopadding.cgi
