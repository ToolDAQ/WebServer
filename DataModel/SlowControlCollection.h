#ifndef SLOW_CONTROL_COLLECTION_H
#define SLOW_CONTROL_COLLECTION_H

#include <SlowControlElement.h>

class SlowControlCollection{

 public:

  SlowControlCollection();
  ~SlowControlCollection();

  SlowControlElement* operator[](std::string key);
  bool Add(std::string name, SlowControlElementType type);
  bool Remove(std::string name);
  void Clear();
  std::string Print();

 private:

  std::map<std::string, SlowControlElement*> SC_vars;

};

#endif
