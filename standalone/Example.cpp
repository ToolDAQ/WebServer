#include <iostream>
#include <DAQInterface.h>


int main(){


  DAQInterface DAQ_inter("my_service");


  Store configuration;
  std::string config_json="";
  
  bool ok = DAQ_inter.GetConfig(config_json, 0);
  
  if(!ok || config_json==""){
    
    configuration.Set("a", 1);
    configuration.Set("b", 2);
    
    configuration>>config_json;
    
    //std::cout<<"sending new config_json: '"<<config_json<<"'"<<std::endl;
    DAQ_inter.SendConfig(config_json);
    
  } else {
    
    config_json.replace(0,9,"");
    config_json.replace(config_json.end()-2, config_json.end(),""); 
    //std::cout<<"got json='"<<config_json<<"'"<<std::endl;
    configuration.JsonParser(config_json);
    
  }
  
  //configuration.Print();

  DAQ_inter.SendLog("hello world 1");

  DAQ_inter.SendAlarm("High current alarm");

  bool power_on=false;
  int voltage_select=1;
  float voltage_1=3500.6;
  float voltage_2=4000.5;
  float voltage_3=3800.2;
  float temp_1 =35.0;
  float temp_2 =35.0;
  float temp_3 =35.0;
  float current_1 =10.0;
  float current_2 =12.0;
  float current_3 =13.0;

  Store monitoring_data;

  DAQ_inter.SC_vars.Add("Status",SlowControlElementType(BUTTON));
  DAQ_inter.SC_vars["Status"]->SetValue("OK");

  DAQ_inter.SC_vars.Add("Start",SlowControlElementType(BUTTON));
  DAQ_inter.SC_vars["Start"]->SetValue(false);

  DAQ_inter.SC_vars.Add("Stop",SlowControlElementType(BUTTON));
  DAQ_inter.SC_vars["Stop"]->SetValue(false);

  DAQ_inter.SC_vars.Add("Quit",SlowControlElementType(BUTTON));
  DAQ_inter.SC_vars["Quit"]->SetValue(false);

  DAQ_inter.SC_vars.Add("Power_ON",SlowControlElementType(OPTIONS));
  DAQ_inter.SC_vars["Power_ON"]->AddOption("1");
  DAQ_inter.SC_vars["Power_ON"]->AddOption("0");
  DAQ_inter.SC_vars["Power_ON"]->SetValue("0");
  
  DAQ_inter.SC_vars.Add("voltage_1", SlowControlElementType(VARIABLE));
  DAQ_inter.SC_vars["voltage_1"]->SetMin(0);
  DAQ_inter.SC_vars["voltage_1"]->SetMax(5000);
  DAQ_inter.SC_vars["voltage_1"]->SetStep(0.1);
  DAQ_inter.SC_vars["voltage_1"]->SetValue(voltage_1);

  DAQ_inter.SC_vars.Add("voltage_2", SlowControlElementType(VARIABLE));
  DAQ_inter.SC_vars["voltage_2"]->SetMin(0);
  DAQ_inter.SC_vars["voltage_2"]->SetMax(5000);
  DAQ_inter.SC_vars["voltage_2"]->SetStep(0.1);
  DAQ_inter.SC_vars["voltage_2"]->SetValue(voltage_2);

  DAQ_inter.SC_vars.Add("voltage_3", SlowControlElementType(VARIABLE));
  DAQ_inter.SC_vars["voltage_3"]->SetMin(0);
  DAQ_inter.SC_vars["voltage_3"]->SetMax(5000);
  DAQ_inter.SC_vars["voltage_3"]->SetStep(0.1);
  DAQ_inter.SC_vars["voltage_3"]->SetValue(voltage_3);



  bool running=true;

  while(running){

    running=(!DAQ_inter.SC_vars["Quit"]->GetValue<bool>());


    bool started=false;

    if(DAQ_inter.SC_vars["Start"]->GetValue<bool>()){
      started =true;
      DAQ_inter.SC_vars["Start"]->SetValue(false);
    }
    
    while(started){
          
      if(DAQ_inter.SC_vars["Stop"]->GetValue<bool>()){
	started =false;
	DAQ_inter.SC_vars["Stop"]->SetValue(false);
	DAQ_inter.SC_vars["Start"]->SetValue(false);
      }
      
      
      temp_1 = 30+(rand()%100)/100.;
      temp_2 = 28+(rand()%100)/100.;
      temp_3 = 18+(rand()%100)/100.;
      current_1 = rand()%10/2.;
      current_2 = rand()%10/2.;
      current_3 = rand()%10/2.;
      monitoring_data.Set("temp_1", temp_1);
      monitoring_data.Set("temp_2", temp_2);
      monitoring_data.Set("temp_3", temp_3);
      monitoring_data.Set("current_1", current_1);
      monitoring_data.Set("current_2", current_2);
      monitoring_data.Set("current_3", current_3);
      
      std::string monitoring_json="";
      monitoring_data>>monitoring_json;
      
      monitoring_data.Delete();
     
      DAQ_inter.SendMonitoringData(monitoring_json);
      
      
      
      DAQ_inter.SC_vars["Power_ON"]->GetValue(power_on);
      DAQ_inter.SC_vars["voltage_1"]->GetValue(voltage_1);
      DAQ_inter.SC_vars["voltage_2"]->GetValue(voltage_2);
      DAQ_inter.SC_vars["voltage_3"]->GetValue(voltage_3);
      
      if(!power_on){
	voltage_1 = 0.0;
	voltage_2 = 0.0;
	voltage_3 = 0.0;
	DAQ_inter.SC_vars["voltage_1"]->SetValue(voltage_1); 
	DAQ_inter.SC_vars["voltage_2"]->SetValue(voltage_2);
	DAQ_inter.SC_vars["voltage_3"]->SetValue(voltage_3);
      }
      else{
	DAQ_inter.SC_vars["voltage_1"]->GetValue(voltage_1);
	DAQ_inter.SC_vars["voltage_2"]->GetValue(voltage_2);
	DAQ_inter.SC_vars["voltage_3"]->GetValue(voltage_3);
      }
    }
    
    usleep(1000);
  }


  return 0;

}
