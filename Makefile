Dependencies = /opt

libs = ToolFrameworkCore ToolDAQFramework boost_1_66_0/install zeromq-4.0.7

include_dirs = $(addprefix -I $(Dependencies)/,$(addsuffix /include,$(libs)))
lib_dirs     = $(addprefix -L $(Dependencies)/,$(addsuffix /lib,$(libs)))

CXXFLAGS ?= -O3 -pipe
CXXFLAGS += $(include_dirs) $(lib_dirs)

programs = backgroundSD Trigger_proxy Win_Mac_translation_server

.PHONY: all clean

all: $(programs)

backgroundSD: src/backgroundSD2.cpp
	$(CXX) -o $@ $< $(CXXFLAGS) -lDAQStore -lServiceDiscovery -lDAQDataModelBase -lStore -lDataModelBase -lzmq -lboost_date_time -lboost_serialization -lboost_iostreams

Trigger_proxy: src/Trigger_proxy.cpp
	$(CXX) -o $@ $< $(CXXFLAGS) -lzmq -lboost_date_time -lboost_serialization -lboost_iostreams -lDAQStore -lServiceDiscovery -lStore -lDAQDataModelBase -lDataModelBase

Win_Mac_translation_server: src/Win_Mac_translation_server.cpp
	$(CXX) -o $@ $< $(CXXFLAGS) -lzmq -lboost_date_time -lboost_serialization -lboost_iostreams

clean:
	rm -f $(programs)
