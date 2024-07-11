Dependencies=/opt

libs = ToolFrameworkCore ToolDAQFramework boost_1_66_0/install zeromq-4.0.7 libpqxx-6.4.5/install

include_dirs = $(addprefix -I $(Dependencies)/,$(addsuffix /include,$(libs)))
lib_dirs     = $(addprefix -L $(Dependencies)/,$(addsuffix /lib,$(libs)))

CXXFLAGS ?= -O3 -pipe
CXXFLAGS += $(include_dirs) $(lib_dirs)

programs = getplot.cgi sendcommand2.cgi sendcommand2nopadding.cgi

.PHONY: all clean

all: $(programs)

sendcommand2.cgi: sendcommand2.cpp
	$(CXX) -o $@ $< $(CXXFLAGS) -lzmq -lcgicc -lStore

sendcommand2nopadding.cgi: sendcommand2nopadding.cpp
	$(CXX) -o $@ $< $(CXXFLAGS) -lzmq -lcgicc -lStore

getplot.cgi: getplot.cpp
	g++ -o $@ $< -std=c++11 -Wno-attributes -I /opt/libpqxx-6.4.5/install/include -L /opt/libpqxx-6.4.5/install/lib -lpqxx -lpq

clean:
	rm -f $(programs)
