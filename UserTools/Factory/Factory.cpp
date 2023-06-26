#include "Factory.h"

Tool* Factory(std::string tool) {
Tool* ret=0;

// if (tool=="Type") tool=new Type;
if (tool=="DummyTool") ret=new DummyTool;
if (tool=="ExampleMonitoring") ret=new ExampleMonitoring;
if (tool=="ExampleSlowControl") ret=new ExampleSlowControl;
if (tool=="PGStarter") ret=new PGStarter;
if (tool=="SlowControlReceiver") ret=new SlowControlReceiver;
if (tool=="ExampleMonitoringOld") ret=new ExampleMonitoringOld;
return ret;
}
