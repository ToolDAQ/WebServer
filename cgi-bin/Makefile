all: control.cgi controlin.cgi tablecontent.cgi tablecontent2.cgi tablecontent3.cgi sendcommand.cgi sendcommand2.cgi sendcommand2nopadding.cgi tablecontent4.cgi

control.cgi: control.cpp
	g++ -O3  control.cpp -o control.cgi -L /opt/ToolDAQFramework/lib -lStore -lServiceDiscovery -lcgicc  -I /usr/local/include -I /opt/ToolDAQFramework/include -I /opt/boost_1_66_0/install/include/  -I /opt/zeromq-4.0.7/include -L /opt/boost_1_66_0/install/lib  -lboost_date_time -lboost_serialization  -lboost_iostreams  -L /opt/zeromq-4.0.7/lib -lzmq 
	chmod a+x control.cgi

controlin.cgi:  controlin.cpp 
	g++ -O3  controlin.cpp -o controlin.cgi  -L /opt/ToolDAQFramework/lib -lStore -lServiceDiscovery -lcgicc  -I /usr/local/include -I /opt/ToolDAQFramework/include -I /opt/boost_1_66_0/install/include/  -I /opt/zeromq-4.0.7/include -L /opt/boost_1_66_0/install/lib  -lboost_date_time -lboost_serialization  -lboost_iostreams  -L /opt/zeromq-4.0.7/lib -lzmq 
	chmod a+x controlin.cgi

tablecontent.cgi: tablecontent.cpp
	g++ -O3  tablecontent.cpp -o tablecontent.cgi -L /opt/ToolDAQFramework/lib -lStore -lServiceDiscovery  -lcgicc  -I /usr/local/include -I /opt/ToolDAQFramework/include -I /opt/boost_1_66_0/install/include/  -I /opt/zeromq-4.0.7/include -L /opt/boost_1_66_0/install/lib  -lboost_date_time -lboost_serialization  -lboost_iostreams  -L /opt/zeromq-4.0.7/lib -lzmq
	chmod a+x tablecontent.cgi

tablecontent2.cgi: tablecontent2.cpp
	g++ -O3  tablecontent2.cpp -o tablecontent2.cgi -L /opt/ToolDAQFramework/lib -lStore -lServiceDiscovery -lcgicc  -I /usr/local/include -I /opt/ToolDAQFramework/include -I /opt/boost_1_66_0/install/include/  -I /opt/zeromq-4.0.7/include -L /opt/boost_1_66_0/install/lib  -lboost_date_time -lboost_serialization  -lboost_iostreams  -L /opt/zeromq-4.0.7/lib -lzmq
	chmod a+x tablecontent2.cgi

tablecontent3.cgi: tablecontent3.cpp
	g++ -O3  tablecontent3.cpp -o tablecontent3.cgi -L /opt/ToolDAQFramework/lib -lStore -lServiceDiscovery  -lcgicc  -I /usr/local/include -I /opt/ToolDAQFramework/include -I /opt/boost_1_66_0/install/include/  -I /opt/zeromq-4.0.7/include -L /opt/boost_1_66_0/install/lib  -lboost_date_time -lboost_serialization  -lboost_iostreams  -L /opt/zeromq-4.0.7/lib -lzmq
	chmod a+x tablecontent3.cgi

sendcommand.cgi: sendcommand.cpp
	g++ -O3  sendcommand.cpp -o sendcommand.cgi -L /opt/ToolDAQFramework/lib -lStore -lServiceDiscovery  -lcgicc  -I /usr/local/include -I /opt/ToolDAQFramework/include -I /opt/boost_1_66_0/install/include/  -I /opt/zeromq-4.0.7/include -L /opt/boost_1_66_0/install/lib  -lboost_date_time -lboost_serialization  -lboost_iostreams  -L /opt/zeromq-4.0.7/lib -lzmq
	chmod a+x sendcommand.cgi

sendcommand2.cgi: sendcommand2.cpp
	g++ -O3  sendcommand2.cpp -o sendcommand2.cgi -L /opt/ToolDAQFramework/lib -lStore -lServiceDiscovery -lcgicc  -I /usr/local/include -I /opt/ToolDAQFramework/include -I /opt/boost_1_66_0/install/include/  -I /opt/zeromq-4.0.7/include -L /opt/boost_1_66_0/install/lib  -lboost_date_time -lboost_serialization  -lboost_iostreams  -L /opt/zeromq-4.0.7/lib -lzmq 
	chmod a+x sendcommand2.cgi

sendcommand2nopadding.cgi: sendcommand2nopadding.cpp
	g++ -O3  sendcommand2nopadding.cpp -o sendcommand2nopadding.cgi -L /opt/ToolDAQFramework/lib -lStore -lServiceDiscovery  -lcgicc  -I /usr/local/include -I /opt/ToolDAQFramework/include -I /opt/boost_1_66_0/install/include/  -I /opt/zeromq-4.0.7/include -L /opt/boost_1_66_0/install/lib  -lboost_date_time -lboost_serialization  -lboost_iostreams  -L /opt/zeromq-4.0.7/lib -lzmq 
	chmod a+x sendcommand2nopadding.cgi

tablecontent4.cgi: tablecontent4.cpp
	g++ -O3 tablecontent4.cpp -o tablecontent4.cgi -I /opt/zeromq-4.0.7/include/ -L /opt/zeromq-4.0.7/lib/ -lzmq
	chmod a+x tablecontent4.cgi

clean:

	rm control.cgi controlin.cgi tablecontent.cgi tablecontent2.cgi tablecontent3.cgi sendcommand.cgi sendcommand2.cgi sendcommand2nopadding.cgi tablecontent4.cgi

#	g++ logbook.cpp -o logbook.cgi -L /usr/local/lib  -lcgicc  -I /usr/local/include
#	chmod a+x logbook.cgi
#	g++ logs.cpp -o logs.cgi
#	chmod a+x logs.cgi
#	g++ DAQ.cpp -o DAQ.cgi
#	chmod a+x DAQ.cgi
#	g++ settings.cpp -o settings.cgi -L /usr/local/lib -lcgicc -I /usr/local/include
#	chmod a+x settings.cgi
#	g++ settingsin.cpp -o settingsin.cgi -L /usr/local/lib -lcgicc -I /usr/local/include
#	chmod a+x settingsin.cgi
#	g++ settingsin2.cpp -o settingsin2.cgi -L /usr/local/lib -lcgicc -I /usr/local/include
#	chmod a+x settingsin2.cgi
#	g++ settingsin3.cpp -o settingsin3.cgi -L /usr/local/lib -lcgicc -I /usr/local/include
#	chmod a+x settingsin3.cgi
