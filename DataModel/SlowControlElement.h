#ifndef SLOW_CONTROL_ELEMENT
#define SLOW_CONTROL_ELEMENT

#include <string>
#include <store.h>
#include <sstream>

enum SlowControlElementType { BUTTON, VARIABLE, OPTIONS, COMMAND };

class SlowControlElement{

 public:
 
  SlowControlElement(std::string name, SlowControlElementType type);
  std::string GetName();
  bool IsName(std::string name);
  std::string Print();
  
  template<typename T> bool SetMin(T value){ 
    if(m_type == SlowControlElementType(VARIABLE)){
      options.Set("min",value);
      return true;
    }
    else return false;
  }
  
  template<typename T> bool SetMax(T value){ 
    if(m_type == SlowControlElementType(VARIABLE)){
      options.Set("max",value);
      return true;
    }
    else return false;
  }
  
  template<typename T> bool SetStep(T value){ 
    if(m_type == SlowControlElementType(VARIABLE)){
      options.Set("step",value);
      return true;
    }
    else return false;
  }
  
    template<typename T> bool AddOption(T value){
  if(m_type == SlowControlElementType(OPTIONS)){
      num_options++;
      std::stringstream tmp;
      tmp<<num_options;
      options.Set(tmp.str(), value);
      return true;
    }
    else return false;
  }

  bool AddCommand(std::string value){
    if(m_type == SlowControlElementType(COMMAND)){
      num_options++;
      std::stringstream tmp;
      tmp<<num_options;
      options.Set(tmp.str(), value);
      return true;
    }
    else return false;
  }

  template<typename T> bool SetValue(T value){
    options.Set("value", value);
    return true;
  }
  
  template<typename T> bool GetValue(T &value){
    options.Get("value", value);
    return true;
  }
  
 private:

  std::string m_name;
  SlowControlElementType m_type;
  Store options;
  unsigned int num_options;
 
};

#endif
