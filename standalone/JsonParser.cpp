#include "JsonParser.h"
#include <iostream>

void JSONP::SetVerbose(bool verb){
	verbose = verb;
}

std::string JSONP::Trim(std::string thejson){
	// discard leading whitespace
	size_t pos=0;
	size_t len=thejson.length();
	while((pos<len) && std::isspace(thejson.at(pos))){
		++pos;
		--len;
	}
	// also discard any trailing whitespace
	while(len>0 && std::isspace(thejson.at(pos+len-1))){
		--len;
	}
	return thejson.substr(pos,len);
}

bool JSONP::iEquals(std::string str1, std::string str2){
	for(char& achar : str1) achar = std::toupper(achar);
	for(char& achar : str2) achar = std::toupper(achar);
	return (str1==str2);
}


bool JSONP::Parse(std::string thejson, BoostStore& output){

	if(verbose) std::cout<<"parsing '"<<thejson<<"'"<<std::endl;
	// strip leading/trailing whitespace
	thejson = Trim(thejson);
	
	// a valid json string always represents an object or an array
	// sanity check that our json is enclosed in '{ ... }' or '[ ... ]'
	if(thejson.length()<2 || not ( (thejson.front()=='{' && thejson.back()=='}') ||
	                               (thejson.front()=='[' && thejson.back()==']') ) ) {
		std::cerr<<"sanity check failed; empty json or missing outermost braces!"<<std::endl;
		return false;
	}
	
	// if object, convert to BoostStore
	if(thejson.front()=='{'){
		return ScanJsonObject(thejson.substr(1,thejson.length()-2), output);
	}
	
	// if array, well, the contents we can make a BoostStore,
	// but we'll need to make up a key: we'll use simple index keys: "0"
	// (this will also be true for nested arrays)
	if(thejson.front()=='['){
		JsonParserResult res;
		bool ok =  ScanJsonArray(thejson.substr(1,thejson.length()-2), res);
		if(!ok || res.type==JsonParserResultType::undefined) return false;
		switch (res.type){
			case JsonParserResultType::ints: {
				output.Set("0",res.theints);
				break;
			}
			case JsonParserResultType::floats: {
				output.Set("0",res.thefloats);
				break;
			}
			case JsonParserResultType::strings: {
				output.Set("0",res.thestrings);
				break;
			}
			case JsonParserResultType::bools: {
				output.Set("0",res.thebools);
				break;
			}
			case JsonParserResultType::nulls: {
				output.Set("0",res.thenulls);
				break;
			}
			case JsonParserResultType::stores: {
				output.Set("0",res.thestores);
				break;
			}
			case JsonParserResultType::empty: {
				std::vector<std::string> emptyvec{};
				output.Set("0",emptyvec);
				break;
			}
			default:{
				std::cerr<<"unhandled case from ScanJsonArray"<<std::endl;
				return false;
			}
		}
		return true;
	}
	
	return false;  // dummy
	
}

bool JSONP::ScanJsonArray(std::string thejson, JsonParserResult& result){
	if(verbose) std::cout<<"ScanJsonArray parsing '"<<thejson<<"'"<<std::endl;
	// passed a json array
	// should be sequence of comma delimited values
	
	// trivial case
	if(thejson==""){
		result.type=JsonParserResultType::empty;
		return true;
	}
	
	// json arrays are annoyingly flexible; they can be homogeneous,
	// containing ints, floats, strings, bools, nulls or objects,
	// but they can also be inhomogeneous combining elements of all these different types
	// try to encapsulate the array in the minimal datatype required
	std::vector<int>& theints = result.theints;
	std::vector<double>& thefloats = result.thefloats;
	std::vector<std::string>& thestrings = result.thestrings;
	std::vector<int>& thebools = result.thebools;             // BoostStore doesn't support vector<bool>
	std::vector<std::string>& thenulls = result.thenulls;     // BoostStore doesn't support vector<nullptr_t>
	std::vector<BoostStore>& thestores = result.thestores;    // FIXME rather than a vector<BoostStore>
	// it would be better to use a BoostStore of BoostStores, where each element's key is its index TODO
	// we just need to track the index in case we aren't filling a vector
	
	// we'll use a set of flags while parsing to select how we try to
	// interpret the next element. As each type gets ruled out we'll
	// skip trying that interpretation for further elements
	bool all_ints=true;
	bool all_floats=true;
	bool all_strings=true;
	bool all_bools=true;
	bool all_nulls=true;
	bool all_stores=true;
	
	// we can rule out some of these immediately based on characters in the json string
	// for example if it contains a quote, we can rule out all elements being numbers, bools or nulls
	if(thejson.find('"')!=std::string::npos){
		if(verbose) std::cout<<"found quote: can't be ints, floats, bools or nulls"<<std::endl;
		// not numeric, bool or null
		all_ints=false;
		all_floats=false;
		all_bools=false;
		all_nulls=false;
		// could be strings, objects or nested arrays
	}
	// conversely if it doesn't contain a quote char, it can't be all strings
	if(thejson.find('"')==std::string::npos){
		if(verbose) std::cout<<"no quotes: can't be strings"<<std::endl;
		all_strings=false;
	}
	// we can also rule out integers, bools and nulls by the presence of a '.' character
	else if(thejson.find('.')!=std::string::npos){
		if(verbose) std::cout<<"found full stop: can't be ints, bools or nulls"<<std::endl;
		all_ints=false;
		all_bools=false;
		all_nulls=false;
		// could be floats or strings, or arrays or objects
	}
	// rule out integers by anything other than digits and signs
	if(thejson.find_first_not_of("01234567890+-, ")!=std::string::npos){
		if(verbose) std::cout<<"found something other than digits: can't be ints"<<std::endl;
		all_ints=false;
	}
	// rule out doubles by anything other than numbers, signs and scientific notation characters
	if(thejson.find_first_not_of("0123456789+-.Ee^*, ")!=std::string::npos){
		if(verbose) std::cout<<"found something other than SI characters: can't be floats"<<std::endl;
		all_floats=false;
	}
	// rule out bools and nulls by finding anything other than the corresponding characters
	if(thejson.find_first_not_of("tTrRuUeEfFaAlLsSeE, ")!=std::string::npos){
		if(verbose) std::cout<<"found characters not in true or false; can't be bools"<<std::endl;
		all_bools=false;
	}
	if(thejson.find_first_not_of("nNuUlL, ")!=std::string::npos){
		if(verbose) std::cout<<"found characters not in null; can't be nulls"<<std::endl;
		all_nulls=false;
	}
	// we can identify arrays and objects by enclosers, but only if we've ruled out strings
	// (otherwise these could potentially just be characters within the strings)
	if(all_strings==false && thejson.substr(1,thejson.length()-2).find("{}[]:")!=std::string::npos){
		if(verbose) std::cout<<"can't be strings and has delimiters; must be array or object"<<std::endl;
		all_ints=false;
		all_floats=false;
		all_strings=false;
		all_bools=false;
		all_nulls=false;
	}
	
	// ok, we have our best initial determination of element types
	// the rest we'll have to figure out as we go.
	
	if(verbose) std::cout<<"scanjsonarray performing parse loop on "<<thejson<<std::endl;
	
	// scan through the array
	size_t next_start=0;
	size_t next_end=0;
	while(true){
		
		if(verbose) std::cout<<"next_start="<<next_start<<", next_end="<<next_end<<std::endl;
		if(next_end==std::string::npos || next_end==thejson.length()) break;
		if(next_end!=0) next_start=next_end+1;
		if(verbose) std::cout<<"new next_start="<<next_start<<", next_end="<<next_end<<std::endl;
		
		// find the end of the next array entry
		// note that as entry elements may be objects, nested arrays, or strings that contain commas,
		// we can't just treat it as a comma-delimited list
		bool in_string=false;
		std::vector<char> delimiters;
		if(verbose)	std::cout<<"scanning remaining string: "
		                     <<thejson.substr(next_start,std::string::npos)<<std::endl;
		for(next_end=next_start; next_end<thejson.length(); ++next_end){
			if(verbose){
				std::cout<<"next char: "<<thejson.at(next_end)
				         <<" instring: "<<in_string<<", delimiters: ";
				for(int k=0; k<delimiters.size(); ++k){
					if(k>0) std::cout<<", ";
					std::cout<<delimiters.at(k);
				}
				std::cout<<std::endl;
			}
			char& nextchar = thejson.at(next_end);
			if(in_string && nextchar=='"'){
				in_string=false;
				continue;
			}
			if(!in_string && nextchar=='"'){
				in_string=true;
				continue;
			}
			if(!in_string && (nextchar=='{' || nextchar=='[')){
				delimiters.push_back(nextchar);
				continue;
			}
			if(!in_string && (nextchar=='}' || nextchar==']')){
				delimiters.pop_back();
				continue;
			}
			if(!in_string && delimiters.empty() && nextchar==','){
				break;  // end of value
			}
		}
		if(verbose) std::cout<<"broke"<<std::endl;
		// extract entry
		std::string tmp = thejson.substr(next_start, next_end-next_start);
		if(verbose) std::cout<<"next array element is "<<tmp<<std::endl;
		tmp=Trim(tmp);
		if(verbose) std::cout<<"trimmed is '"<<tmp<<"'"<<std::endl;
		
		if(tmp.front()=='{' || tmp.front()=='['){
			// found an object or array
			// since inhomogeneous element types are valid, we could have already parsed
			// several previous entries and built up e.g. a vector<int>. But now,
			// since we can't append an object to that vector, we need to translate those
			// previosly parsed elements into a new vector<BoostStores> which is sufficiently
			// generic to accommodate the new element as well
			all_ints=false;
			all_floats=false;
			all_strings=false;
			all_bools=false;
			all_nulls=false;
			if(theints.size()){
				thestores.resize(theints.size());
				for(int i=0; i<theints.size(); ++i) thestores.at(i).Set("0", theints.at(i));
				theints.clear();
			}
			if(thefloats.size()){
				thestores.resize(thefloats.size());
				for(int i=0; i<thefloats.size(); ++i) thestores.at(i).Set("0", thefloats.at(i));
				thefloats.clear();
			}
			if(thestrings.size()){
				thestores.resize(thestrings.size());
				for(int i=0; i<thestrings.size(); ++i) thestores.at(i).Set("0", thestrings.at(i));
				thestrings.clear();
			}
			if(thebools.size()){
				thestores.resize(thebools.size());
				for(int i=0; i<thebools.size(); ++i) thestores.at(i).Set("0", thebools.at(i));
				thebools.clear();
			}
			if(thenulls.size()){
				thestores.resize(thenulls.size());
				std::string emptystring="";
				for(int i=0; i<thenulls.size(); ++i) thestores.at(i).Set("0", emptystring);
				thenulls.clear();
			}
		}
		if(tmp.front()=='{'){
			// add the new element
			thestores.resize(thestores.size()+1);
			bool ok =  ScanJsonObject(tmp.substr(1,tmp.length()-2), thestores.back());
			if(!ok) return false;
			continue;
		}
		if(tmp.front()=='['){
			// add the new element
			thestores.resize(thestores.size()+1);
			JsonParserResult res;
			bool ok =  ScanJsonArray(tmp.substr(1,tmp.length()-2), res);
			if(!ok || res.type==JsonParserResultType::undefined) return false;
			switch (res.type){
				case JsonParserResultType::ints: {
					thestores.back().Set("0",res.theints);
					break;
				}
				case JsonParserResultType::floats: {
					thestores.back().Set("0",res.thefloats);
					break;
				}
				case JsonParserResultType::strings: {
					thestores.back().Set("0",res.thestrings);
					break;
				}
				case JsonParserResultType::bools: {
					thestores.back().Set("0",res.thebools);
					break;
				}
				case JsonParserResultType::nulls: {
					thestores.back().Set("0",res.thenulls);
					break;
				}
				case JsonParserResultType::stores: {
					thestores.back().Set("0",res.thestores);
					break;
				}
				case JsonParserResultType::empty: {
					std::vector<std::string> emptyvec{};
					thestores.back().Set("0",emptyvec);
					break;
				}
				default:{
					std::cerr<<"unhandled case from ScanJsonArray"<<std::endl;
					return false;
				}
			}
			continue;
		}
		
		// ok not an object or array, try to handle it as a simpler type
		if(all_ints){
			if(verbose) std::cout<<"trying int"<<std::endl;
			// try to parse as integer, until we find something that fails
			try {
				size_t endpos=0;
				int nextint = std::stoi(tmp,&endpos);
				if(endpos!=tmp.length()) throw std::invalid_argument("extra chars");
				if(verbose) std::cout<<"match int"<<std::endl;
				theints.push_back(nextint);
				continue;
			}
			catch(std::invalid_argument& e){
				all_ints = false;
				// swap any already parsed integers to the float array
				if(theints.size() && thefloats.size()){
					// sanity check: shouldn't ever happen
					std::cerr<<"parsing error; transferring ints into non-empty floats!"<<std::endl;
					return false;
				}
				for(int& anint : theints) thefloats.push_back(anint);
			}
		}
		if(all_floats){
			if(verbose) std::cout<<"trying float"<<std::endl;
			// try to parse as a double until we find something that fails
			try {
				size_t endpos=0;
				double nextfloat = std::stod(tmp,&endpos);
				if(endpos!=tmp.length()) throw std::invalid_argument("extra chars");
				if(verbose) std::cout<<"match float"<<std::endl;
				thefloats.push_back(nextfloat);
				continue;
			}
			catch(std::invalid_argument& e){
				all_floats = false;
				// must be inhomogeneous types. transfer to stores
				if(thefloats.size() && thestores.size()){
					// sanity check: shouldn't ever happen
					std::cerr<<"parsing error; transferring floats into non-empty stores!"<<std::endl;
					return false;
				}
				thestores.resize(thefloats.size());
				for(int i=0; i<thefloats.size(); ++i){
					thestores.at(i).Set("0", thefloats.at(i));
				}
			}
		}
		if(all_bools){
			if(verbose) std::cout<<"trying bool"<<std::endl;
			if(iEquals(tmp,"TRUE")){
				thebools.push_back(1);
				if(verbose) std::cout<<"match bool"<<std::endl;
				continue;
			} else if(iEquals(tmp,"FALSE")){
				thebools.push_back(0);
				if(verbose) std::cout<<"match bool"<<std::endl;
				continue;
			} else {
				// not all bools
				all_bools=false;
				// transfer current contents to Store
				if(thebools.size() && thestores.size()){
					// sanity check: shouldn't ever happen
					std::cerr<<"parsing error; transferring bools into non-empty stores!"<<std::endl;
					return false;
				}
				thestores.resize(thestores.size());
				for(int i=0; i<thebools.size(); ++i){
					thestores.at(i).Set("0", thebools.at(i));
				}
			}
		}
		if(all_nulls){
			if(verbose) std::cout<<"trying null"<<std::endl;
			if(iEquals(tmp,"null")){
				thenulls.resize(thenulls.size()+1);
				if(verbose) std::cout<<"match null"<<std::endl;
				continue;
			} else {
				// not all nulls
				all_nulls=false;
				// transfer current contents to Store
				if(thenulls.size() && thestores.size()){
					// sanity check: shouldn't ever happen
					std::cerr<<"parsing error; transferring nulls into non-empty stores!"<<std::endl;
					return false;
				}
				thestores.resize(thenulls.size());
				for(int i=0; i<thenulls.size(); ++i){
					std::string emptystring="";
					thestores.at(i).Set(std::to_string(i), emptystring);
				}
			}
		}
		if(all_strings){
			if(verbose) std::cout<<"trying string"<<std::endl;
			// check it looks like a string
			if(tmp.length()>1 && tmp.front()=='"' && tmp.back()=='"'){
				// remove the enclosing quotes
				thestrings.push_back(tmp.substr(1,tmp.length()-2));
				if(verbose) std::cout<<"match string"<<std::endl;
				continue;
			} else {
				// doesn't look like a json string. need to use stores
				all_strings=false;
				// transfer current contents to Stores
				if(thestrings.size() && thestores.size()){
					// sanity check: shouldn't ever happen
					std::cerr<<"parsing error; transferring nulls into non-empty stores!"<<std::endl;
					return false;
				}
				thestores.resize(thestrings.size());
				for(int i=0; i<thestrings.size(); ++i){
					thestores.at(i).Set("0",thestrings.at(i));
				}
			}
		}
		if(all_stores){
			if(verbose) std::cout<<"falling back to store"<<std::endl;
			// build a BoostStore to encapsulate this element,
			// but note that it's not an object or array, so we're just gonna
			// have to make a BoostStore entry of the correct primitive type
			thestores.resize(thestores.size()+1,BoostStore{typechecking});
			bool ok = ScanJsonObjectPrimitive(tmp, thestores.back());
			if(verbose) std::cout<<"returned "<<ok<<std::endl;
			if(!ok) return false;
			continue;
		}
		// shouldn't get here
		std::cerr<<"Nothing to parse element "<<tmp<<std::endl;
		return false;
		
	}
	
	// determine the type of our return
	int typesset=0;
	if(theints.size())   { result.type = JsonParserResultType::ints;    ++typesset; }
	if(thefloats.size()) { result.type = JsonParserResultType::floats;  ++typesset; }
	if(thestrings.size()){ result.type = JsonParserResultType::strings; ++typesset; }
	if(thebools.size())  { result.type = JsonParserResultType::bools;   ++typesset; }
	if(thenulls.size())  { result.type = JsonParserResultType::nulls;   ++typesset; }
	if(thestores.size()) { result.type = JsonParserResultType::stores;  ++typesset; }
	if(typesset!=1){
		std::cerr<<"multiple types in return from ScanJsonArray!"<<std::endl;
		return false;
	}
	return true;
	
}

bool JSONP::ScanJsonObjectPrimitive(std::string thejson, BoostStore& outstore){
	if(verbose) std::cout<<"ScanJsonObjectPrimitive scanning '"<<thejson<<"'"<<std::endl;
	thejson=Trim(thejson);
	
	if(thejson.front()=='{' || thejson.front()=='['){
		std::cerr<<"Warning! ScanJsonObjectPrimitive called with object or array!"<<std::endl;
		return false;
	}
	
	try {
		if(verbose) std::cout<<"try int"<<std::endl;
		size_t endpos=0;
		int nextint = std::stoi(thejson,&endpos);
		if(endpos!=thejson.length()) throw std::invalid_argument("extra chars");
		outstore.Set("0",nextint);
		return true;
	}
	catch(std::invalid_argument& e){
		// not an int
		if(verbose) std::cout<<"not int"<<std::endl;
	}
	try {
		if(verbose) std::cout<<"try float"<<std::endl;
		size_t endpos=0;
		double nextfloat = std::stod(thejson,&endpos);
		if(endpos!=thejson.length()) throw std::invalid_argument("extra chars");
		outstore.Set("0",nextfloat);
		return true;
	}
	catch(std::invalid_argument& e){
		// not a float
		if(verbose) std::cout<<"not float"<<std::endl;
	}
	if(verbose) std::cout<<"try bool"<<std::endl;
	if(iEquals(thejson,"TRUE")){
		bool val=true;
		if(verbose) std::cout<<"match bool"<<std::endl;
		outstore.Set("0",val);
		return true;
	}
	if(iEquals(thejson,"FALSE")){
		if(verbose) std::cout<<"match bool"<<std::endl;
		bool val=false;
		outstore.Set("0",val);
		return true;
	}
	if(verbose) std::cout<<"try null"<<std::endl;
	if(iEquals(thejson,"null")){
		if(verbose) std::cout<<"match null"<<std::endl;
		std::string val="";
		outstore.Set("0",val);
		return true;
	}
	if(verbose) std::cout<<"try string"<<std::endl;
	if(thejson.length()>1 && thejson.front()=='"' && thejson.back()=='"'){
		if(verbose) std::cout<<"match string"<<std::endl;
		outstore.Set("0",thejson.substr(1,thejson.length()-2));
		return true;
	}
	std::cerr<<"No handler for string "<<thejson<<" in ScanJsonObjectPrimitive!"<<std::endl;
	
	return false;
	
}

bool JSONP::ScanJsonObject(std::string thejson, BoostStore& outstore){
	if(verbose) std::cout<<"ScanJsonObject scanning '"<<thejson<<"'"<<std::endl;
	// passed a json object
	// should be sequence of comma delimited key-value pairs,
	// with string keys separated from values by colons
	
	// trivial case
	if(thejson=="") return true;
	
	// scan through the array of key-value pairs
	size_t next_start=0;
	size_t next_end=std::string::npos;
	bool key=true; // alternate key and value
	std::string next_key;
	while(true){
		// find the end of the next array entry
		// note that as entry elements may be objects, nested arrays, or strings that contain commas,
		// we can't just treat it as a comma-delimited list
		bool in_string=false;
		std::vector<char> delimiters;
		if(verbose) std::cout<<"scanning remaining string: "
		                     <<thejson.substr(next_start,std::string::npos)<<std::endl;
		for(next_end=next_start; next_end<thejson.length(); ++next_end){
			if(verbose){
				std::cout<<"key: "<<key<<", next char: "<<thejson.at(next_end)
				         <<" instring: "<<in_string<<", delimiters: ";
				for(int k=0; k<delimiters.size(); ++k){
					if(k>0) std::cout<<", ";
					std::cout<<delimiters.at(k);
				}
				std::cout<<std::endl;
			}
			char& nextchar = thejson.at(next_end);
			if(in_string && nextchar=='"'){
				in_string=false;
				if(key && delimiters.empty()){
					++next_end; // include the closing quote
					if(verbose) std::cout<<"end of key at next_end="<<next_end<<std::endl;
					break;   // end of key
				}
				continue;
			}
			if(!in_string && nextchar=='"'){
				in_string=true;
				continue;
			}
			if(!in_string && (nextchar=='{' || nextchar=='[')){
				delimiters.push_back(nextchar);
				continue;
			}
			if(!in_string && (nextchar=='}' || nextchar==']')){
				delimiters.pop_back();
				continue;
			}
			if(!in_string && delimiters.empty() && nextchar==','){
				if(key){
					std::cerr<<"found comma without property!"<<std::endl;
					return false;
				}
				break;  // end of value
			}
			if(!in_string && delimiters.empty() && nextchar==':'){
				if(key){
					std::cerr<<"found : without key!"<<std::endl;
					return false;
				}
			}
		}
		if(verbose) std::cout<<"next element from "<<next_start<<" to "<<next_end<<std::endl;
		// extract entry
		std::string tmp = thejson.substr(next_start, next_end-next_start);
		if(verbose) std::cout<<"broke loop: '"<<tmp<<"'"<<std::endl;
		tmp=Trim(tmp);
		
		// if processing a key record it and continue to next loop
		if(key){
			next_key=tmp;
			if(verbose) std::cout<<"it key"<<std::endl;
			// sanity checks, key should be a string
			if(next_key.front()!='"' || next_key.back()!='"'){
				std::cerr<<"next key '"<<next_key<<"' is not a string?"<<std::endl;
				return false;
			}
			// strip them off for use as key in output BoostStore
			next_key = next_key.substr(1,next_key.length()-2);
			// swallow any whitespace and ':' separating key from value
			int cc=0;
			while(next_start!=thejson.length()){
				if(std::isspace(thejson.at(next_end))){ ++next_end; }
				else if(thejson.at(next_end)==':'){ ++next_end; ++cc; }
				else break;
			}
			if(next_start==thejson.length()){
				std::cerr<<"encountered end of json with no value for key "<<next_key<<std::endl;
				return false;
			} else if(cc!=1){
				std::cerr<<"didn't find key-value separator in json object?"<<std::endl;
				return false;
			}
			--next_end; // backtrack one
			if(verbose) std::cout<<"sanity checks passed"<<std::endl;
		} else {
			
			if(verbose) std::cout<<"it value"<<std::endl;
			// if not processing a key, parse the value
			bool trytoparse=true;
			if(trytoparse && tmp.front()=='{'){
				// add the new element
				BoostStore res{typechecking};
				bool ok =  ScanJsonObject(tmp.substr(1,tmp.length()-2), res);
				if(!ok) return false;
				outstore.Set(next_key,res);
				trytoparse=false;
			}
			if(verbose && trytoparse) std::cout<<"not object"<<std::endl;
			if(trytoparse && tmp.front()=='['){
				if(verbose) std::cout<<"it array"<<std::endl;
				// add the new element
				JsonParserResult res;
				bool ok =  ScanJsonArray(tmp.substr(1,tmp.length()-2), res);
				if(verbose) std::cout<<"parse array ret:"<<ok<<std::endl;
				if(!ok || res.type==JsonParserResultType::undefined) return false;
				switch (res.type){
					case JsonParserResultType::ints: {
						if(verbose) std::cout<<"array was of ints"<<std::endl;
						outstore.Set(next_key,res.theints);
						break;
					}
					case JsonParserResultType::floats: {
						if(verbose) std::cout<<"array was of floats"<<std::endl;
						outstore.Set(next_key,res.thefloats);
						break;
					}
					case JsonParserResultType::strings: {
						if(verbose) std::cout<<"array was of strings"<<std::endl;
						outstore.Set(next_key,res.thestrings);
						break;
					}
					case JsonParserResultType::bools: {
						if(verbose) std::cout<<"array was of bools"<<std::endl;
						outstore.Set(next_key,res.thebools);
						break;
					}
					case JsonParserResultType::nulls: {
						if(verbose) std::cout<<"array was of nulls"<<std::endl;
						outstore.Set(next_key,res.thenulls);
						break;
					}
					case JsonParserResultType::stores: {
						if(verbose) std::cout<<"array was of stores"<<std::endl;
						outstore.Set(next_key,res.thestores);
						break;
					}
					default:{
						std::cerr<<"unhandled case from ScanJsonArray"<<std::endl;
						return false;
					}
				}
				trytoparse=false;
			}
			if(verbose && trytoparse) std::cout<<"not array"<<std::endl;
			
			if(trytoparse){
				try {
					size_t endpos=0;
					int nextint = std::stoi(tmp,&endpos);
					if(endpos!=tmp.length()) throw std::invalid_argument("extra chars");
					outstore.Set(next_key,nextint);
					trytoparse=false;
				}
				catch(std::invalid_argument& e){
					// not an int
				}
			}
			if(verbose && trytoparse) std::cout<<"not int"<<std::endl;
			if(trytoparse){
				try {
					size_t endpos=0;
					double nextfloat = std::stod(tmp,&endpos);
					if(endpos!=tmp.length()) throw std::invalid_argument("extra chars");
					outstore.Set(next_key,nextfloat);
					trytoparse=false;
				}
				catch(std::invalid_argument& e){
					// not a double
				}
			}
			if(verbose && trytoparse) std::cout<<"not float"<<std::endl;
			if(trytoparse){
				if(iEquals(tmp,"TRUE")){
					bool val=true;
					outstore.Set(next_key,val);
					trytoparse=false;
				} else if(iEquals(tmp,"FALSE")){
					bool val=false;
					outstore.Set(next_key,val);
					trytoparse=false;
				}
			}
			if(verbose && trytoparse) std::cout<<"not bool"<<std::endl;
			if(trytoparse){
				if(iEquals(tmp,"null")){
					std::string nullstring;
					outstore.Set(next_key,nullstring);
					trytoparse=false;
				}
			}
			if(verbose && trytoparse) std::cout<<"not null"<<std::endl;
			if(trytoparse){
				if(tmp.length()>1 && tmp.front()=='"' && tmp.back()=='"'){
					outstore.Set(next_key,tmp.substr(1,tmp.length()-2));
					trytoparse=false;
				}
			}
			if(verbose && trytoparse) std::cout<<"not string"<<std::endl;
			if(trytoparse){
				BoostStore astore{typechecking};
				bool ok = ScanJsonObjectPrimitive(tmp, astore);
				if(!ok) return false;
				outstore.Set(next_key,astore);
				trytoparse=false;
			}
			if(trytoparse){
				// shouldn't get here
				std::cerr<<"Nothing to parse element "<<tmp<<std::endl;
				return false;
			}
		}
		
		key = !key;
		if(verbose) std::cout<<"updating iterators"<<std::endl;
		if(next_end==thejson.length()) break;
		next_start=next_end+1;
	}
	if(verbose) std::cout<<"parsing object done"<<std::endl;
	
	return true;
	
}

