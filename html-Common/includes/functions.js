// Functions:
//   HTTPRequest(method, url, async=false, data=null, user=null, password=null) - undertakes HTTP request and returns data
//   GetSDTable(filter=null, async=null) - returns SDTable with filter applied to service name
//   GetIP(service_name, async=false) - returns IP of first service with name given
//   GetPort(service_name, async=false) - returns port of first serivce with anme given
//   Command(ip, port, command, asynx) - Sends command to the serivce specified and returns string response
//   GetSlowCommands(ip, port, async=false) - returns html to produce all slow control buttons of client
//   SendSCCommand(ip, port, command_output, ...incommands) - command used by slow cotnrol buttons to send commands to clients
//   GetPSQLTable(command, user, database, async=false) - get sql table from database
//   GetPSQL(command, user, database, async=false) - query sql database, response returned as json object
//   MakePlotDataFromPSQL(command, user, databse, output_data_array=null, async=false) - makes data for a plotly plot based on sql table
//   MakePlot(div, data, layout, update=false) - makes or updates a plot div
//   GetPlot(name) - retrieves a plot from the database
//   GetPlot() - retrieves an array of all plots from the database
//   DrawRootPlot(div, obj) - draw a jsroot plot from jsroot plot object
//   DrawRootPlotJSON(div, root_json) - draw a jsroot plot from jsroot compatible JSON string
//   DrawRootPlotDB(div, plotname, plotver=-1) - draw a jsroot plot from database
"use strict";

//import { httpRequest, parse, draw, redraw, resize, toJSON, cleanup } from 'https://root.cern/js/latest/modules/main.mjs';
import * as JSROOT from 'https://root.cern/js/latest/modules/main.mjs';

/*
function ResolveVariable(variable){
 if (variable instanceof Promise) {
    // If the variable is a promise, block until it's resolved
    variable.then(function(result){
 return result});
  } else {
    // If the variable is not a promise, return it immediately
    return variable;
  }
}
*/

let hostIP=""; //127.0.0.1";

export function HTTPRequest(method, url, async=false, data=null, user=null, password=null){

    var xhr = new XMLHttpRequest();

    xhr.open(method, url, async, user, password);

    // Set the request header to indicate that the request body contains form data
    if(method=="POST")  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    //console.log("HTTPRequest with post data: "+data);
    xhr.send(data);

    if(!async) return xhr.responseText

    else{

	return new Promise(function(resolve, reject){

	    xhr.onreadystatechange = function() {
	    	// once the request is 'DONE' (ignore other status changes)
	    	if(this.readyState == 4){
	    		// resolve if status was OK (https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
	    		// i am unclear on whether some 300 status codes would also be acceptable, for example, 304 seems fine
	    		// but what about 302, 307, etc? do we need to catch and handle the required redirects in such cases?
				if((this.status > 199 && this.status <300) || this.status==304) {
					resolve(xhr.responseText);
				} else {
					// else reject
					//console.log("HTTPRequest FAILURE:");
					//console.log(xhr);
					reject("Request failed with status code "+xhr.status+": "+xhr.statusText);
				}
			}
			return;
	    }

	});

    }

}

// a general asynchronous getter for fetching data from a url
export async function getDataFetchRequest(url, json_or_text="text"){
	//console.log("getDataFetchRequest(",url,")");
	try {
		console.log("getDataFetchRequest fetching ",url," and waiting on response");
		let response = await fetch(url);
		console.log("getDataFetchRequest received response for ",url);
		let thetext = "";
		if(json_or_text=="json"){
			console.log("getDataFetchRequest awaiting on conversion to text for ",url);
			thetext = await response.text();
		} else {
			console.log("getDataFetchRequest awaiting on conversion to json for ",url);
			thetext = await response.json();
		}
		console.log("getDataFetchRequest returning ",url," conversion result"); //,thetext);
		return thetext;
	} catch (err) {
		console.log("Failed to get data from "+url, err);
		return null;
	}
}


export function GetSDTable(filter=null, async=false) {
  //  filter= ResolveVariable(filter);

    function ProcessTable(csvData){
	var table= document.createElement('table');
	table.id="SDTable";

	var rows = csvData.split("\n");
	rows.map(function(row) {
	    var cells = row.split(",");

	    if(cells.length == 5){

			if(cells[3]==filter){
				var newrow = table.insertRow(table.rows.length);
				var cell1 = "<td>[" + cells[0] + "]</td>";
				var cell2 = "<td>" + cells[1] + "</td>";
				var cell3 = "<td>" + cells[2] + "</td>";
				var cell4 = "<td>" + cells[3] + "</td>";
				var cell5 = "<td>" + cells[4] + "</td>";
				newrow.innerHTML = cell1 + cell2 + cell3 + cell4 + cell5;
			}
	    }
	});

	return table;
    }


    if(async){

	return new Promise(function(resolve, reject){

	    HTTPRequest("GET", "/cgi-bin/tablecontent5.cgi", true).then(function(result){

		resolve(ProcessTable(result));

	    });
	});
    }

    else return ProcessTable(HTTPRequest("GET", "/cgi-bin/tablecontent5.cgi", false));

}


export function GetIP(service_name, async=false){
  //service_name= ResolveVariable(service_name);

    if(async){
	return new Promise(function(resolve, reject){

		GetSDTable(service_name, true).then(function(result){
			if(result.rows === 'undefined' || !result.rows.length ||
			   result.rows[0].cells === 'undefined' || !result.rows[0].cells.length){
				reject("GetIP no matching services found!")
				return "";
			}
			resolve(result.rows[0].cells[1].innerText);
	    });
	});
    }

    else{
		let result = GetSDTable(service_name); // html table object
		//console.log("GetIP got: ");   // result.rows is a htmlcollection
		//console.log(result);
		if(result.rows === 'undefined' || !result.rows.length ||
		   result.rows[0].cells === 'undefined' || !result.rows[0].cells.length){
			/*
			console.log("GetIP no matching services found!");
			console.log(result);
			console.log(result.rows);
			console.log(result.rows[0]);
			console.log(result.rows[0].cells);
			console.log(result.rows[0].cells[1]);
			*/
			return "";
		}
		return result.rows[0].cells[1].innerText;

    }
}


export function GetPort(service_name, async=false){
    //service_name= ResolveVariable(service_name);

    if(async){
	return new Promise(function(resolve, reject){

	    GetSDTable(service_name, true).then(function(result){
		if(result.rows === 'undefined' || !result.rows.length ||
		   result.rows[0].cells === 'undefined' || !result.rows[0].cells.length){
			reject("GetPort no matching services found!");
			return 0;
		}
		resolve(result.rows[0].cells[2].innerText);
	    });
	});
    }

    else{

		let result = GetSDTable(service_name); // html table object
		//console.log("GetIP got: ");   // result.rows is a htmlcollection
		//console.log(result);
		if(result.rows === 'undefined' || !result.rows.length ||
		   result.rows[0].cells === 'undefined' || !result.rows[0].cells.length){
			//console.log("GetPort no matching services found!");
			return 0;
		}
		return result.rows[0].cells[2].innerText;

    }
}


export function Command(ip, port, command, async=false){ //this command sends messages to services
    //ip= ResolveVariable(ip);
    //port= ResolveVariable(port);
    //command= ResolveVariable(command);

    // Convert the object to a URL-encoded string
    var data_string = "ip=" + ip + "&port=" + port + "&command=" + command;


    if(!async) return HTTPRequest("POST", "/cgi-bin/sendcommand2nopadding.cgi", false, data_string).split("\n")[1];

    else{

	return new Promise(function(resolve, reject){

	    HTTPRequest("POST", "/cgi-bin/sendcommand2nopadding.cgi", true, data_string).then(
	    function(result){
			resolve(result.split("\n")[1]);
	    },
	    function(reason){
	    	reject(reason);
	    });
	});
    }
}

export function GetSlowCommands(ip, port, command_output, async=false){

    //ip = ResolveVariable(ip);
    //port = ResolveVariable(port);


    function MakeControls(result){

        var tmp_controls= "";

        result=result.replace('Available commands: ', '');
        tmp_controls = "<form id=\"input\">";

        var commands = result.split(",");
        commands.map(function(type) {
            type=type.trim();

	    if(type.includes("{") && type.includes("}")){
                type=type.replace(/}/g,"");
                var fields=type.split("{");
		var html ="<p>" + fields[0] + ":  <textarea id=\"" + fields[0] + "args\" readonly>" +  fields[1] + "</textarea><\p>";
		tmp_controls += html;
            }

            else if(type.includes("[") && type.includes(":")){
                type=type.replace("[","");
                type=type.replace("]","");
                var fields=type.split(":");
                fields=fields.map(function(item){return item.trim();});
                tmp_controls +=  "<p>" +fields[0] + "  <input type=\"range\" min=\"" + fields[1] + "\" max=\"" + fields[2] + "\"  step=\"" + fields[3] + "\" value=\"" + fields[4] + "\" id=\"" + fields[0] + "slider\" onchange=\"document.getElementById('"+ fields[0] + "').value=this.value\">  <input type=\"number\" id=\"" + fields[0] + "\" min=\""+ fields[1] + "\" max=\"" + fields[2] + "\" step=\"" + fields[3] + "\" value=\"" + fields[4] + "\" onchange=\"document.getElementById('"+ fields[0] + "slider').value=this.value\">  <button type=\"button\" onclick=\"SendSCCommand('" + ip + "', '" + port + "', '" +  command_output.id + "', \'" + fields[0] + "', '" + fields[0] + "slider' )\">Update</button></p>";
            }

            else if(type.includes("[") && type.includes(";")){
                type=type.replace("[","");
                type=type.replace("]","");
                var fields=type.split(";");
                fields=fields.map(function(item){return item.trim();});
                var html ="<p>" + fields[0] ;
                for (let i = 1; i < fields.length-1; i++) {
                    html += " <input type=\"radio\" id=\"" + fields[0] + fields[i] + "\" name=\"" + fields[0] + "\" value=\"" + fields[i] +"\" ";
                    if( fields[i] == fields[fields.length-1]) html +="checked";
                    html +="><label for=\"" + fields[0] + fields[i] + "\">" + fields[i] + "</label>";
                }
                tmp_controls += html + "  <button type=\"button\" onclick=\"SendSCCommand('" + ip + "', '" + port + "', '" +  command_output.id + "', \'" + fields[0] + "', '" + fields[0] + fields[fields.length-1] +"')\">Update</button></p>";

            }

            else if(type.includes("<") && type.includes(">")){
                type=type.replace(/>/g,"");
                var fields=type.split("<");
                fields=fields.map(function(item){return item.trim();});
                var html ="<p>" + fields[0] + "  <input type=\"text\" id=\"" + fields[0] + "args\" value=\"";

                for (let i = 1; i < fields.length; i++) {
                    html += "<" + fields[i] + "> ";
                }
                tmp_controls += html + "\">  <button type=\"button\" onclick=\"SendSCCommand('" + ip + "', '" + port + "', '" +  command_output.id + "', \'" + fields[0] + "', '" + fields[0] +"args')\">Send</button></p>";

            }

            else{

                tmp_controls += "<p><button type=\"button\" onclick=\"SendSCCommand('" + ip + "', '" + port + "', '" +  command_output.id + "', \'" + type + "\')\">" + type + "</button></p>";
            }

        });
        tmp_controls += "</form> ";
        return tmp_controls;

    };


    var commands = "?"

    if(!async) return MakeControls(Command(ip, port, commands, async));

    else{

	return new Promise(function(resolve, reject){

	    Command(ip, port, commands, async).then(function(result){

		resolve(MakeControls(result));

	    });
	});
    }

}


export function SendSCCommand(ip, port, command_output, ...incommands){

    command_output = document.getElementById(command_output);

    let buttons = document.getElementsByTagName('button');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
    }

    var incommand=incommands[0];
    for (let i = 1; i < incommands.length; i++) {
        var tmp = document.getElementById(incommands[i])
        if(tmp.type=="radio") incommand+= " " +document.querySelector('input[name="' + tmp.name + '"]:checked').value;
        else incommand+= " " + tmp.value;
    }



    Command(ip, port, incommand, true).then(function(result){

        command_output.innerHTML = "Sending Command {" + incommand + "} to [" + ip + "] <br>";
        command_output.innerHTML += "[" + ip + "] Reply: " + result;

        let buttons = document.getElementsByTagName('button');
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].disabled = false;
        }

    });

}


export function GetPSQLTable(command, user, database, async=false){

    var data_string = "user="     + user
                    + "&db="      + database
                    + "&command=" + encodeURIComponent(command);

    //console.log(`submitting query: '${data_string}'`);
    return HTTPRequest("POST", "/cgi-bin/sqlquery.cgi", async, data_string);

}

export async function GetPSQL(command, user, database, async=false){

    let dataUrl = "/cgi-bin/sqlqueryjson.cgi";
    var data_string = "user=" + user + "&db=" + database + "&command=" + command;
    //console.log("GetPSQL got query: "+command+", data_string: "+data_string);

    // version using HTTPRequest
    return HTTPRequest("POST", dataUrl, async, data_string);

    // version using getDataFetchRequest, which uses the fetch API rather than XMLHttpRequest
    // see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
    // in fact firefox reports:
    // 'Synchronous XMLHttpRequest on the main thread is deprecated
    //  because of its detrimental effects to the end user’s experience'
    /*
    dataUrl = dataUrl+"?"+data_string;
    if(async){
        // return promise
        return getDataFetchRequest(dataUrl, "text");
    } else {
        // await promise and return json object
        let responsepromise = getDataFetchRequest(dataUrl, "json");
        //console.log("GetPSQL got promise: ",responsepromise);
        let response = await responsepromise;
        //console.log("GetPSQL got response: ",response);
        return response;
    }
    */

}

export function MakePlotDataFromPSQL(command, user, databse, output_data_array=null, async=false){ //function to generate plotly plot

    function MakePlotData(table){

	var div = document.createElement("div");
	div.innerHTML=table;
	var table = div.querySelector("table");
	table.style.display = "none";
	var xdata= new Map();
	var ydata= new Map();

	for( var i=1; i< table.rows.length; i++){

	    var jsondata = JSON.parse(table.rows[i].cells[2].innerText);

	    for (let key in jsondata) {
		if(!xdata.has(key)){
		    xdata.set(key,[table.rows[i].cells[0].innerText.slice(0,-3)]);
		    ydata.set(key,[jsondata[key]]);
		}
		else{
		    xdata.get(key).push(table.rows[i].cells[0].innerText.slice(0,-3));
		    ydata.get(key).push(jsondata[key]);

		}
	    }
	}

		    if( output_data_array == null) output_data_array = [];
	//output_data_array = [];
	for(let [key, value] of xdata){

	    output_data_array.push({
		name: key,
		mode: 'lines',
		x: value,
		y: ydata.get(key)
	    });

	}
	return output_data_array;
    }




    if(!async) return MakePlotData(GetPSQLTable(command, "root", "daq", async));

    else{

	return new Promise(function(resolve, reject){

	    GetPSQLTable(command, "root", "daq", async).then(function(result){

		resolve(MakePlotData(result));

	    });
	});
    }


}



export function MakePlot(div, data, layout, update=false){

    if(data.length>0){
	if(!update){
	    div.innerHTML="";
	    //	Plotly.deleteTraces(div, 0);
	    Plotly.plot(div, data, layout);
	}
	else Plotly.redraw(div,data, layout);
    }
}

// Fetch a named plot from the database
// Returns a promise to return an object representing the plot with the following structure:
// {
//   plot:   <plot name>,
//   x:      [ <array of x coordinates> ],
//   y:      [ <array of y coordinates> ],
//   xlabel: <x axis label>,
//   ylabel: <y axis label>,
//   title:  <title>,
//   info:   <user supplied data object>
// }
// Parameters:
//   name --- plot name; when undefined returns an array of all plots in the database

export function GetPlot(name) {
  //console.log(`GetPlot called with arg ${name}`);
  let url = '/cgi-bin/getplot.cgi';
  if (name !== undefined) url += '?plot=' + name;
  //console.log(`invoking url ${url}`);
  return HTTPRequest('GET', url, true).then(
    function (reply) {
      return JSON.parse(reply);
    },
    function(reason){
      console.log(`GetPlot error: ${reason}`);
      return;
    }
  );
}

// draw JSROOT plot from database
export async function DrawRootPlotDB(div, plotname, plotver=-1){

	// postgres match doesn't like any extraneous spaces
	plotname = plotname.trim();
	//console.log("trimmed plot name: '",plotname,"'");

	let verselect = "";
	if(typeof(plotver) != 'undefined' && plotver>0){
		verselect = `AND version=${plotver}`;
	}

	var command = "select data, draw_options from rootplots where name='"
	           + plotname + "' " + verselect + " order by time desc limit 1";

	GetPSQLTable(command, "root", "daq", true).then(function(result){

		var tmp_tab = document.createElement("table");
		tmp_tab.innerHTML = result;
		//console.log("tmp_tab is ",tmp_tab,", inner html is ",tmp_tab.innerHTML);
		//console.log("tmp_tab rows is ",tmp_tab.rows);

		if(tmp_tab.rows.length <1){
			div.innerHTML = `"<h3>Can not find plot ${plotname}</h3>`;
			return;
		}

		let data = tmp_tab.rows[1].cells[0].innerText;
		let drawoptions = tmp_tab.rows[1].cells[1].innerText;

		//console.log("data was '",data,"'");
		//console.log("draw_options was '",drawoptions,"'");
		let obj = JSROOT.parse(data);
		//console.log("obj is ",obj);

		return DrawRootPlot(div, obj, drawoptions);
	},
	function(reason){
		div.innerHTML = `"<h3>Can not get ${plotname} from the server: ${reason}</h3>`;
		reject(reason);
	});

	return;
};

// Draw JSROOT plot directly from json
export async function DrawRootPlotJSON(div, root_json, drawoptions=""){

	console.log("DrawRootPlotJSON called with json ");
	console.log(root_json);
	try {
		const obj = JSROOT.parse(root_json);
		console.log("parsed jsroot object is:");
		console.log(obj);

		if(typeof(obj) == 'undefined'){
			throw new Error(`JSROOT error parsing json ${root_json}'`);
		}
		return DrawRootPlot(div, obj, drawoptions);

	} catch(err){
		console.error(err);
		return;
	}
}

// Draw JSROOT plot from jsroot object
export async function DrawRootPlot(div, obj, drawoptions="", width=700, height=400){

	console.log("DrawRootPlot called");
	try {
		// FIXME better way to set the size, dynamically determined
		// can we set the div size here? e.g.
		//div.style=`\"height=${height}, width=${width}\"`;

		// remove any existing plots - with calling this, plots will overlay (kinda like 'same')
		JSROOT.cleanup(div.id);

		console.log("going to await draw of obj ");
		console.log(obj);
		console.log(`onto div ${div.id}`);
		await JSROOT.draw(div.id, obj, drawoptions);
		console.log("drawn");

	} catch(err){
		console.error(err);
		return;
	}

	return;
}