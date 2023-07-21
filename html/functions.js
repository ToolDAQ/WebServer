// Functions:
//   HTTPRequest(method, url, async=false, data=null, user=null, password=null) - undertakes HTTP request and returns data
//   GetSDTable(filter=null, async=null) - returns SDTable with filter applied to service name
//   GetIP(service_name, async=false) - returns IP of first service with name given
//   GetPort(service_name, async=false) - returns port of first serivce with anme given
//   Command(ip, port, command, asynx) - Sends command to the serivce specified and returns string response
//   GetSlowCommands(ip, port, async=false) - returns html to produce all slow control buttons of client
//   SendSCCommand(ip, port, command_output, ...incommands) - command used by slow cotnrol buttons to send commands to clients
//   GetPSQLTable(command, user, database, async=false) - get sql table from database
//   MakePlotDataFromPSQL(command, user, databse, output_data_array=null, async=false) - makes data for a plotly plot based on sql table
//   MakePlot(div, data, layout, update=false) - makes or updates a plot div

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

function HTTPRequest(method, url, async=false, data=null, user=null, password=null){
    
    var xhr = new XMLHttpRequest();
    
    xhr.open(method, url, async, user, password);

    // Set the request header to indicate that the request body contains form data   
    if(method=="POST")  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    
    xhr.send(data);
    
    if(!async) return xhr.responseText
    
    else{
	
	return new Promise(function(resolve, reject){
	    
	    xhr.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 200) {		
		    resolve(xhr.responseText);
		}
	    }
	    
	});
	
    }
    
}

function GetSDTable(filter=null, async=false) { 
  //  filter= ResolveVariable(filter); 
   
    function ProcessTable(csvData){
	var table= document.createElement('table');
	table.id="SDTable";
	
	var rows = csvData.split("\n");
	rows.map(function(row) {
	    var cells = row.split(",");
	    
	    if(cells.length == 5){
		
		var newrow = table.insertRow(table.rows.length);
		var cell1 = "<td>[" + cells[0] + "]</td>";
		var cell2 = "<td>" + cells[1] + "</td>";
		var cell3 = "<td>" + cells[2] + "</td>";
		var cell4 = "<td>" + cells[3] + "</td>";
		var cell5 = "<td>" + cells[4] + "</td>";
		if(filter=="")  newrow.innerHTML = cell1 + cell2 + cell3 + cell4 + cell5;
		else if(cells[3]==filter) newrow.innerHTML = cell1 + cell2 + cell3 + cell4 + cell5;
		
	    }
	});
	
	return table;    
    }
    
    
    if(async){ 
	
	return new Promise(function(resolve, reject){
	    
	    HTTPRequest("GET", "./cgi-bin/tablecontent5.cgi", true).then(function(result){
		
		resolve(ProcessTable(result));
		
	    });
	});
    }
    
    else return ProcessTable(HTTPRequest("GET", "./cgi-bin/tablecontent5.cgi", false));
    
    
    
}


function GetIP(service_name, async=false){
  //service_name= ResolveVariable(service_name);    

    if(async){
	return new Promise(function(resolve, reject){
	    
	    GetSDTable(service_name, true).then(function(result){
		
		resolve(result.rows[0].cells[1].innerText);
	    });
	});
    }
    
    else{

	return GetSDTable(service_name).rows[0].cells[1].innerText;
	
    }
}


function GetPort(service_name, async=false){
    //service_name= ResolveVariable(service_name);

    if(async){
	return new Promise(function(resolve, reject){
	    
	    GetSDTable(service_name, true).then(function(result){
		
		resolve(result.rows[0].cells[2].innerText);
	    });
	});
    }
    
    else{

	return GetSDTable(service_name).rows[0].cells[2].innerText;
	
    }
}


function Command(ip, port, command, async=false){ //this command sends messages to services
    //ip= ResolveVariable(ip);
    //port= ResolveVariable(port);
    //command= ResolveVariable(command);
    
    // Convert the object to a URL-encoded string
    var data_string = "ip=" + ip + "&port=" + port + "&command=" + command;
    
    
    if(!async) return HTTPRequest("POST", "./cgi-bin/sendcommand2nopadding.cgi", false, data_string).split("\n")[1];
    
    else{
	
	return new Promise(function(resolve, reject){
	    
	    HTTPRequest("POST", "./cgi-bin/sendcommand2nopadding.cgi", true, data_string).then(function(result){
		
		resolve(result.split("\n")[1]);
		
	    });
	});
    }
}
	
function GetSlowCommands(ip, port, command_output, async=false){
    
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


function SendSCCommand(ip, port, command_output, ...incommands){

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


function GetPSQLTable(command, user, database, async=false){
 
    command = command.replaceAll("*", "'*'");   
    command = command.replaceAll("=", "|"); 
    var data_string = "user=" + user + "&db=" + database + "&command=" + command;
    
    return HTTPRequest("POST", "./cgi-bin/sqlquery.cgi", async, data_string);


}


function MakePlotDataFromPSQL(command, user, databse, output_data_array=null, async=false){ //function to generate plotly plot
    
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



function MakePlot(div, data, layout, update=false){

    if(data.length>0){
	if(!update){
	    div.innerHTML="";
	    //	Plotly.deleteTraces(div, 0);
	    Plotly.plot(div, data, layout);
	}
	else Plotly.redraw(div,data, layout);
    }
}
   
