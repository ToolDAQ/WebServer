var updating =false;
var pause_updating =false;
var table = document.getElementById("table-container");
var select = document.getElementById("ip");
var update = setInterval(updateTable, 5000); // Run the updateTable() function every minute
var refresh_button = document.getElementById('refresh');
var ip_box = document.getElementById('ip_filter');
var name_box = document.getElementById('name_filter');
var status_box = document.getElementById('status_filter');
var groupbox= document.getElementById('group');
var groupcell= document.getElementById('groupcell');
var controls = document.getElementById("controls");   
var send_button = document.getElementById('Send Command');
var command_output = document.getElementById("output");
var commands = document.getElementById("command");


////////////////////////////////////////////////////////////////
//////////////////////////////////Service discovery table section
////////////////////////////////////////////////////////////////

// Run the updateTable() function on startup
updateTable();

// Run the updateTable() function on refresh press
refresh_button.onclick = updateTable;


function updateTable() { //this command updates the service discovery table

    if(updating || pause_updating) return;  
    updating=true;
    
    var csvFile = "./cgi-bin/tablecontent5.cgi";
    
    // Use XMLHttpRequest to get the CSV content from the file
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
	if (this.readyState == 4 && this.status == 200) {
	    
	    let buttons = document.getElementsByTagName('button');
	    for (let i = 0; i < buttons.length; i++) {
		buttons[i].disabled = true;
	    }
	    
	    
	    // Delete all the rows from the table
	    while (table.rows.length > 1) {
		table.deleteRow(1);
	    }
	    
//probably want to get slect box posion to replace it after update

	    // Set the length of the <select> options to 0
	    var tmp_select_value=select.value;
	    select.options.length = 0;
	   

            var csvData = xhr.responseText;
            var rows = csvData.split("\n");
	    rows.map(function(row) {
		var cells = row.split(",");
		
		if(cells.length == 5){
		//if(cells.length == 5 && cells[1].includes(ip_filter) && cells[3].includes(name_filter) && cells[4].includes(status_filter)){
		    
		    var newrow = table.insertRow(table.rows.length);
		    var colour = "#00FFFF";
		    if( cells[4] == "Online" ) colour = "#FF00FF"
		    else if( cells[4] == "Waiting to Initialise ToolChain" ) colour="#FFFF00"
		    else {
			var substatus = cells[4].split(" ");
			for ( var i = 0 ; i < substatus.length ; i++) {
			    if ( substatus[i] == "running" ) colour="#00FF00"
			}
		    }
		    var cell1 = "<td bgcolor=\"" + colour + "\">[" + cells[0] + "]</td>";
		    var cell2 = "<td bgcolor=\"" + colour + "\">" + cells[1] + "</td>";
		    var cell3 = "<td style=\"display:none\" bgcolor=\"" + colour + "\">" + cells[2] + "</td>";
		    //var cell4 = "<td bgcolor=\"" + colour + "\"> <a href=\"slowcontrol.html?ip=" + cells[1] +"port="+ cells[2] +"\">" + cells[3] + "</a></td>";
		    var cell4 = "<td bgcolor=\"" + colour + "\">" + "<a href=\"device.html?$method=post&name=" + cells[3] + "&ip=" + cells[1] + "&port=" + cells[2] +"\" style=\"color: black\">" + cells[3] + "</a>" + "</td>";
		    var cell5 = "<td bgcolor=\"" + colour + "\">" + cells[4] + "</td>";
		    newrow.innerHTML = cell1 + cell2 + cell3 + cell4 + cell5;
		    
		    select.options.add(new Option("[" + cells[0] + "]", cells[1] + ":" + cells[2]));	
		    
		    
		    
		    
		    
		}
	    });


	    select.options.add(new Option("Group", "Group"));	


	    select.value=tmp_select_value;

 	    // trigger the onchange function
	    select.dispatchEvent(new Event("change"));   


	   
	    for (let i = 0; i < buttons.length; i++) {
		buttons[i].disabled = false;
		
	    }
	    updating=false;
	}
	
    };
    xhr.open("GET", csvFile, true);
    xhr.send();
}



ip_box.addEventListener('change', function() {  //apply flitering to table based on ip
    var ip_filter = "";
    if(ip_box.value == "<filter>")  ip_filter = "";
    else if(ip_box.value == "")  ip_box.value = "<filter>";
    else ip_filter = ip_box.value;
    var style="";
    for(var i=1; i<table.rows.length; i++){
        if (table.rows[i].cells[1].innerText.includes(ip_filter)){ style=""}
        else { style="display:none"}

        for(var j=0; j<table.rows[i].cells.length; j++){
            if(j != 2) table.rows[i].cells[j].style=style;
        }
	
    }
});



name_box.addEventListener('change', function() { //apply flitering to table based on name
    var name_filter = "";
    if(name_box.value == "<filter>")  name_filter = "";   
    else if(name_box.value == "") name_box.value = "<filter>";
    else name_filter = name_box.value;
    var style="";
    for(var i=1; i<table.rows.length; i++){
        if (table.rows[i].cells[3].innerText.includes(name_filter)){ style=""}
        else { style="display:none"}

        for(var j=0; j<table.rows[i].cells.length; j++){
            if(j != 2) table.rows[i].cells[j].style=style;
        }

    }
});



status_box.addEventListener('change', function() {  //apply flitering to table based on status
    var status_filter = "";
    if(status_box.value == "<filter>") status_filter = "";
    else if(status_box.value == "") status_box.value = "<filter>";
    else status_filter = status_box.value;
    var style="";
    for(var i=1; i<table.rows.length; i++){
	if (table.rows[i].cells[4].innerText.includes(status_filter)){ style=""}
	else { style="display:none"}
	
	for(var j=0; j<table.rows[i].cells.length; j++){
	    if(j != 2) table.rows[i].cells[j].style=style;
	}
	
    }    
});

////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////




////////////////////////////////////////////////
///////////////////// Send Command Section
///////////////////////////////////////////////////////////////


send_button.addEventListener('click', function() {  ///send a command if send command pressed
    
    if(select.value != "Group") sendcommand2();
    else{
	var list=[];
	if(groupbox.value.includes("(")){
	    var item=groupbox.value.replace("(","");
	    item=item.replace(")","");
	    list=item.split(",");
	    
	} 
	else{
	    for(var i=1; i<table.rows.length; i++){
		if (table.rows[i].cells[3].innerText== groupbox.value){
		    var item=table.rows[i].cells[0].innerText;
		    item=item.replace("[","");
		    item=item.replace("]","");
		    list.push(item);
		}	    
	    }
	}
	var text="";
	list.map(function(item) {
	    select.selectedIndex=item;
	    sendcommand2(); 
	    // below not working ben need to fix
	    text+=command_output.InnerText;
	    command_output.InnerText=text;
	    
	});
	
	select.selectedIndex=select.length -1;
    }
    
});



function sendcommand2(){ // function to send command to device
    
    let buttons = document.getElementsByTagName('button');
    for (let i = 0; i < buttons.length; i++) {
	buttons[i].disabled = true;
    }    

    if(commands.value == ""){
	command_output.innerHTML = "No command given"

	let buttons = document.getElementsByTagName('button');
	for (let i = 0; i < buttons.length; i++) {
	    buttons[i].disabled = false;
	}

	return;
    }
    
    command(select.value.split(":")[0], select.value.split(":")[1], commands.value).then(function(result){
	
	command_output.innerHTML = "Sending Command {" + commands.value + "} to [" + select.value + "] <br>";
	command_output.innerHTML += "[" + select.value + "] Reply: " + result;
	
	commands.value="";
	
	updateTable();
	
	
	let buttons = document.getElementsByTagName('button');
	for (let i = 0; i < buttons.length; i++) {
	    buttons[i].disabled = false;
	}
	
	
    });
    
}
    
function command(ip, port, command){ //this command sends messages to services
    
    return new Promise(function(resolve, reject){

	pause_updating=true;

	 // Create a new XMLHttpRequest object
	var xhr = new XMLHttpRequest();
	
	// Set the URL of the webpage you want to send data to
	var url = "./cgi-bin/sendcommand2nopadding.cgi";
	
	
	// Set the request method to POST
	xhr.open("POST", url);
	
	// Set the request header to indicate that the request body contains form data
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	
	// Create a string containing the form data to be sent in the request body
	//var data = "username=johndoe&password=secret";
	
	
	// Convert the object to a URL-encoded string
	var dataString = "ip=" + ip + "&port=" + port + "&command=" + command;
	
	
	// Send the request
	xhr.send(dataString);
	
	pause_updating=false;	
	
	xhr.onreadystatechange = function() {
	    var cell = document.getElementById("output");
	    
	    if (this.readyState == 4 && this.status == 200) {
		
		var result = xhr.responseText.split("\n");
		resolve(result[1]); 
	    }
	    else{
		//resolve("Error");
	    }
	    
	    
	};  
	
    });
}



////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////




////////////////////////////////////////////////
///////////////////// Slow Control section
///////////////////////////////////////////////////////////////

////// hised and shows group box and gets slow control commands
select.addEventListener('change', function() {
    if(select.value=="Group"){
	groupcell.style.display = 'block'
    }
    else{
	groupcell.style.display = 'none'
	getcommands();
    }
});


function getcommands(){
    
    var commands = "?" 
    var tmp_controls= "";

    command(select.value.split(":")[0], select.value.split(":")[1], commands).then(function(result){

	result=result.replace('Available commands: ', '');
	tmp_controls = "<form id=\"input\">";
	//result="Start <service>, Stop <service>, KILL, hello <name> <fish>, [voltage1:0.0:100.0:0.1:50.0], [voltage2:0:100:1:50], [state;a;b;c;a], [LED1;on;off;on], ? ";	
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
		tmp_controls +=  "<p>" +fields[0] + "  <input type=\"range\" min=\"" + fields[1] + "\" max=\"" + fields[2] + "\"  step=\"" + fields[3] + "\" value=\"" + fields[4] + "\" id=\"" + fields[0] + "slider\" onchange=\"document.getElementById('"+ fields[0] + "').value=this.value\">  <input type=\"number\" id=\"" + fields[0] + "\" min=\""+ fields[1] + "\" max=\"" + fields[2] + "\" step=\"" + fields[3] + "\" value=\"" + fields[4] + "\" onchange=\"document.getElementById('"+ fields[0] + "slider').value=this.value\">  <button type=\"button\" onclick=\"sendcommand3(\'" + fields[0] + "', '" + fields[0] + "slider' )\">Update</button></p>"
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
		tmp_controls += html + "  <button type=\"button\" onclick=\"sendcommand3(\'" + fields[0] + "', '" + fields[0] + fields[fields.length-1] +"')\">Update</button></p>";
		
	    }
	    
	    else if(type.includes("<") && type.includes(">")){
		type=type.replace(/>/g,"");
		var fields=type.split("<");
		fields=fields.map(function(item){return item.trim();});
		var html ="<p>" + fields[0] + "  <input type=\"text\" id=\"" + fields[0] + "args\" value=\"";

		for (let i = 1; i < fields.length; i++) {
		    html += "<" + fields[i] + "> "; 
		}
		tmp_controls += html + "\">  <button type=\"button\" onclick=\"sendcommand3(\'" + fields[0] + "', '" + fields[0] +"args')\">Send</button></p>";

	    }
	    
	    else{
		
		tmp_controls += "<p><button type=\"button\" onclick=\"sendcommand3(\'" + type + "\')\">" + type + "</button></p>";
	    }
	    
	});
	tmp_controls += "</form> ";
	controls.innerHTML = tmp_controls;

    });
}
									  


function sendcommand3(...incommands){
    
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


    
    command(select.value.split(":")[0], select.value.split(":")[1], incommand).then(function(result){
	
	command_output.innerHTML = "Sending Command {" + incommand + "} to [" + select.value + "] <br>";
	command_output.innerHTML += "[" + select.value + "] Reply: " + result;
	
	commands.value="";

	updateTable();
	
	let buttons = document.getElementsByTagName('button');
	for (let i = 0; i < buttons.length; i++) {
	    buttons[i].disabled = false;
	}
	
    });
    
}



////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/*


/*


function sendcommand(){
    
    // Create a new XMLHttpRequest object
    var xhr = new XMLHttpRequest();
    
    // Set the URL of the webpage you want to send data to
    var url = "./cgi-bin/sendcommand2.cgi";
    
    var ip = document.getElementById("ip");
    var commands = document.getElementById("command");    
    var button = document.getElementById("Send Command")
    if(commands.value == ""){
	var cell = document.getElementById("output");
	cell.innerHTML = "No command given"
	return;
    }
    ip.disabled=true;
    commands.disabled=true;
    button.disabled=true;
    
    // Set the request method to POST
    xhr.open("POST", url);
    
    // Set the request header to indicate that the request body contains form data
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    
    // Create a string containing the form data to be sent in the request body
    //var data = "username=johndoe&password=secret";

    
    // Convert the object to a URL-encoded string
    var dataString = "ip=" + ip.value.split(":")[0] + "&port=" + ip.value.split(":")[1] + "&command=" + commands.value;
    
    
    // Send the request
    xhr.send(dataString);

    xhr.onreadystatechange = function() {
	var cell = document.getElementById("output");
	
	if (this.readyState == 4 && this.status == 200) {
	    
            var result = xhr.responseText.split("\n");
	    cell.innerHTML = result[1];
	    commands.value="";
	}
	else{
	    cell.innerHTML = "Error";
	    commands.value="";
	}
	
	ip.disabled=false;
	commands.disabled=false;
	button.disabled=false;
	
    };  
    
    
    updateTable();
    
}


                 

// sends command on button click
var btn2 = document.getElementById('Send Command');

});
//disables updates when interacting with command interface
var textBox = document.getElementById('command');
textBox.addEventListener('focus', function() {
    clearInterval(update);
});

textBox.addEventListener('blur', function() {
    update = setInterval(updateTable, 60000)
});

var dropdown = document.getElementById('ip');
dropdown.addEventListener('focus', function() {
    clearInterval(update);
});

dropdown.addEventListener('blur', function() {
    update = setInterval(updateTable, 60000)
});


btn2.addEventListener('focus', function() {
    clearInterval(update);
});

btn2.addEventListener('blur', function() {
    update = setInterval(updateTable, 60000)
});

var controls = document.getElementById('controls');
controls.addEventListener('mouseover', function() {
    clearInterval(update);
});

controls.addEventListener('mouseout', function() {
    update = setInterval(updateTable, 60000)
});


*/
