   
function gettable(command){
    
    return new Promise(function(resolve, reject){
	var xhr = new XMLHttpRequest();
	
	var url = "./cgi-bin/sqlquery.cgi";
	
	var user ="root";
	var db="daq";
    
	// Set the request method to POST
	xhr.open("POST", url);
	
	// Set the request header to indicate that the request body contains form data
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	
	
	var dataString = "user=" + user + "&db=" + db + "&command=" + command;
	
	
	// Send the request
	xhr.send(dataString);
	
	xhr.onreadystatechange = function() {
	    if (this.readyState == 4 && this.status == 200) {
		
		resolve(xhr.responseText);
	    }	       
//	    else reject(new Error('error loading'));
	}
    });
    
}


function updatedropdown(){

    //var xhr = new XMLHttpRequest();
    
    //var url = "./cgi-bin/sqltable.cgi";
    
    //var user ="root";
    //var db="daq";
    var command="SELECT table_name from information_schema.tables where table_schema=\"public\" AND table_type=\"BASE TABLE\""
    
    // Set the request method to POST
    //xhr.open("POST", url);
    
    // Set the request header to indicate that the request body contains form data
    //xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    
    
    //var dataString = "user=" + user + "&db=" + db + "&command=" + command;
    
    
    // Send the request
    //xhr.send(dataString);
    
    
    
    //xhr.onreadystatechange = function() {
    //	if (this.readyState == 4 && this.status == 200) {
    
    gettable(command).then(function(result){
	var tmp = document.getElementById("output")
	tmp.innerHTML = result;
	var table = document.getElementById("table");
	var select = document.getElementById("tableselect");
	
	for( var i=1; i < table.rows.length; i++){
	    
	    select.options.add(new Option( table.rows[i].innerText, table.rows[i].innerText));
	    
	}
	tmp.innerHTML = "";
	select.dispatchEvent(new Event("change"));
    });	    

    
}
		   
		   


updatedropdown();


// Select the select box
var select = document.querySelector('select');

select.addEventListener('change', function() {
    // Get the selected option
    var selectedOption = this.options[this.selectedIndex];
    var command = "select '*' from "+ selectedOption.value;
    if(selectedOption.value=="monitoring" || selectedOption.value=="logging" || selectedOption.value=="alarms" || selectedOption.value=="configurations") command +=" order by time desc";
    var output= document.getElementById("output");
    gettable(command).then(function(result){

	output.innerHTML=result;
	
    });
    // Perform an action with the selected option
    //console.log('You selected: ' + selectedOption.value);
    
});

var submit= document.getElementById("submit");
var command= document.getElementById("command");
var sqloutput= document.getElementById("sqloutput");
submit.addEventListener('click', function(){
    submit.disabled=true;
   // var commandsend=command.value.replace(/\*/g, "'*'");
    //commandsend=commandsend.replace(/'/g, "\"");
    var commandsend=command.value.replace(/'/g, "\"");
    commandsend=commandsend.replace(/\*/g, "'*'");
    gettable(commandsend).then( function(result){
	sqloutput.innerHTML=result;
	submit.disabled=false;
    });
    
});
