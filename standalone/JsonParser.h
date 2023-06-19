#ifndef JSONP_H
#define JSONP_H
#include "BoostStore.h"
#include <locale>  // std::isspace
#include <string>
#include <vector>
// https://stackoverflow.com/a/27425792/3544936

enum class JsonParserResultType { ints, floats, strings, bools, nulls, stores, empty, undefined };
struct JsonParserResult {
	std::vector<int> theints{};
	std::vector<double> thefloats{};
	std::vector<std::string> thestrings{};
	std::vector<int> thebools{};
	std::vector<std::string> thenulls{};
	std::vector<BoostStore> thestores{};
	JsonParserResultType type=JsonParserResultType::undefined;
};

class JSONP {
	public:
	JSONP(){};
	~JSONP(){};
	
	bool Parse(std::string thejson, BoostStore& output);
	std::string Trim(std::string thejson);
	bool iEquals(std::string str1, std::string str2);
	void SetVerbose(bool);
	
	private:
	bool ScanJsonArray(std::string thejson, JsonParserResult& result);
	bool ScanJsonObjectPrimitive(std::string thejson, BoostStore& outstore);
	bool ScanJsonObject(std::string thejson, BoostStore& outstore);
	int verbose=0;
	bool typechecking=false;
	
};
#endif
