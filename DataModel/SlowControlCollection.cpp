#include <SlowControlCollection.h>

SlowControlCollection::SlowControlCollection(){

}

SlowControlCollection::~SlowControlCollection(){


  Clear();

}


void SlowControlCollection::Clear(){
  
  for(std::map<std::string, SlowControlElement*>::iterator it=SC_vars.begin(); it!=SC_vars.end(); it++){
    delete it->second;
    it->second=0;
  }
  
  SC_vars.clear();
  
}


bool SlowControlCollection::Add(std::string name, SlowControlElementType type){

  if(SC_vars.count(name)) return false;
  SC_vars[name] = new SlowControlElement(name, type);
  return true;

}

bool SlowControlCollection::Remove(std::string name){

  if(SC_vars.count(name)){
    std::map<std::string, SlowControlElement*>::iterator it;
    for(it=SC_vars.begin(); it!=SC_vars.end(); it++){
      if(it->first==name) break;
  }
    delete it->second;
    it->second=0;
    SC_vars.erase(it);
    return true;  
  }

  return false;

}

SlowControlElement* SlowControlCollection::operator[](std::string key){
  if(SC_vars.count(key)) return SC_vars[key];
  return 0;  
}

std::string SlowControlCollection::Print(){

  std::string reply = "?";   
  for(std::map<std::string, SlowControlElement*>::iterator it=SC_vars.begin(); it!=SC_vars.end(); it++){
    reply += ", " + it->second->Print();
  } 
  
  return reply;
  
}
