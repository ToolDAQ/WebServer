#ifndef STORE_H 
#define STORE_H

#include <string>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>
#include <sstream>

/**
 * \class Store
 *
 * This class Is a dynamic data storeage class and can be used to store variables of any type listed by ASCII key. The storage of the varaible is in ASCII, so is inefficent for large numbers of entries.
 *
 * $Author: B.Richards $
 * $Date: 2019/05/28 10:44:00 $
 */

class Store{

 public:

  Store(); ////< Sinple constructor

  bool Initialise(std::string filename); ///< Initialises Store by reading in entries from an ASCII text file, when each line is a variable and its value in key value pairs.  @param filename The filepath and name to the input file.
  void JsonParser(std::string input); ///<  Converts a flat JSON formatted string to Store entries in the form of key value pairs.  @param input The input flat JSON string.
  void Print(); ///< Prints the contents of the Store.
  void Delete(); ///< Deletes all entries in the Store.
  bool Has(std::string key); ///<Returns bool based on if store contains entry given by sting @param string key to comapre.

  /**
     Templated getter function for sore content. Assignment is templated and via reference.
     @param name The ASCII key that the variable in the Store is stored with.
     @param out The variable to fill with the value.
     @return Return value is true if varaible exists in the Store and correctly assigned to out and false if not.
  */
  template<typename T> bool Get(std::string name,T &out){
    
    if(m_variables.count(name)>0){

      std::stringstream stream(m_variables[name]);
      stream>>out;
      return !stream.fail();
    }
    
    else return false;

  }


  /**
     Templated getter function for sore content. 
     @param name The ASCII key that the variable in the Store is stored with.
     @return Return value is default copiler costructed value if not true (note: no checking exists)
  */
  template<typename T> T Get(std::string name){
    
    T tmp;
    if(!Get(name,tmp)) std::cout<<"\033[38;5;196mERROR: Store doesnt hold value \""<<name<<"\" default returned\033[0m"<<std::endl;
 
    return tmp;

  }


  /**
     Templated setter function to assign vairables in the Store.
     @param name The key to be used to store and reference the variable in the Store.
     @param in the varaible to be stored.
  */
  template<typename T> void Set(std::string name,T in){
    std::stringstream stream;
    stream<<in;
    m_variables[name]=stream.str();
  }

  /**
     Returns string pointer to Store element.
     @param key The key of the string pointer to return.
     @return a pointer to the string version of the value within the Store.
  */
  std::string* operator[](std::string key){
    return &m_variables[key];
  }
  
  /**
     Allows streaming of a flat JASON formatted string of Store contents.
  */
  template<typename T> void operator>>(T& obj){
    
    std::stringstream stream;
    stream<<"{";
    bool first=true;
    for (std::map<std::string,std::string>::iterator it=m_variables.begin(); it!=m_variables.end(); ++it){ 
      if (!first) stream<<",";
      stream<<"\""<<it->first<<"\":\""<< it->second<<"\"";
      first=false;
    }
    stream<<"}";
    
    obj=stream.str();
   
  } 
 
 private:

  std::map<std::string,std::string> m_variables;

};

#endif
