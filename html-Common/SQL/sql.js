"use strict;"

import { GetPSQLTable } from "/includes/functions.js";

var output = document.getElementById("output");
var tableselect = document.getElementById("tableselect");
var select = document.querySelector('select');
var submit= document.getElementById("submit");
var command= document.getElementById("command");
var sqloutput= document.getElementById("sqloutput");
var limit= document.getElementById("limit");

//update dropdown at startup
updatedropdown();

function updatedropdown(){ //function to get SQL tables and populate dropdown

    //var xhr = new XMLHttpRequest();

    //var url = "/cgi-bin/sqltable.cgi";

    //var user ="root";
    //var db="daq";
    var command="SELECT table_name from information_schema.tables where table_schema='public' AND table_type='BASE TABLE'"

    // Set the request method to POST
    //xhr.open("POST", url);

    // Set the request header to indicate that the request body contains form data
    //xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");


    //var dataString = "user=" + user + "&db=" + db + "&command=" + command;


    // Send the request
    //xhr.send(dataString);



    //xhr.onreadystatechange = function() {
    //	if (this.readyState == 4 && this.status == 200) {

    GetPSQLTable(command, "root","daq",true).then(function(result){

	output.innerHTML = result;
	var table = document.getElementById("table");

	for( var i=1; i < table.rows.length; i++){
	    tableselect.options.add(new Option( table.rows[i].innerText, table.rows[i].innerText));
	}
	tableselect.selectedIndex=-1;
	output.innerHTML = "";
	tableselect.dispatchEvent(new Event("change"));

    });


}

// actions to take when submit button pressed
function submit_query() {
    submit.disabled=true;

    if( command.value.localeCompare("help", "en", { sensitivity: "base" })==0) {
	psqlhelp();
	submit.disabled=false;
	return;
    }
    
    GetPSQLTable(command.value, "root","daq",true).then(
	function(result){
	    sqloutput.innerHTML=result;
	    submit.disabled=false;
	},
	function(error) {
            sqloutput.innerHTML = error+"<br><br>Type 'HELP' for some useful SQL database information and command examples.";
            submit.disabled = false;
	}
    );
}


// function to give some helpful hints about how to interact with the psql database
function psqlhelp() {
    let helpMessage = "<strong>Welcome, it appears you would like some help.</strong><br><br>"
    
    helpMessage = helpMessage.concat("The following database tables are available:<ul>")
    for( var i=0; i < tableselect.length; i++) {
	helpMessage = helpMessage.concat("<li><code>"+tableselect[i].text+"</code></li>");
    }

    helpMessage = helpMessage.concat("</ul>To see a description of a table structure, try a command of the form:<br>")
    helpMessage = helpMessage.concat("<code>\\d table_name;</code>")
    helpMessage = helpMessage.concat("<br>For example:<br>")
    helpMessage = helpMessage.concat("<code>\\d "+tableselect[0].text+";</code><br>")
    
    helpMessage = helpMessage.concat("<br>To see the latest entries from to a given table, try a command of the form:<br>")
    helpMessage = helpMessage.concat("<code>SELECT * FROM table_name;</code>")
    helpMessage = helpMessage.concat("<br>For example:<br>")
    helpMessage = helpMessage.concat("<code>SELECT * FROM "+tableselect[0].text+";</code><br>")

    helpMessage = helpMessage.concat("<br>To select data from only a specific device, try:<br>")
    helpMessage = helpMessage.concat("<code>SELECT * FROM table_name WHERE condition;</code>")

    sqloutput.innerHTML = helpMessage;
    output.innerHTML = "";
}


select.addEventListener('change', function() {  //actions to take on change of select box
    // Get the selected option
    if( tableselect.selectedIndex==-1) return;
    var selectedOption = this.options[this.selectedIndex];
    var command = "select * from "+ selectedOption.value;

    if(selectedOption.value=="monitoring" || selectedOption.value=="logging" || selectedOption.value=="alarms" || selectedOption.value=="configurations") command +=" order by time desc";
    command+=" limit " + limit.value;

    GetPSQLTable(command, "root","daq",true).then(function(result){

	output.innerHTML=result;

    });
    // Perform an action with the selected option
    //console.log('You selected: ' + selectedOption.value);

});


//submit.addEventListener('click', function(){ //actions to take when submit button pressed
  //  submit.disabled=true;
    // // var commandsend=command.value.replace(/\*/g, "'*'");
    // //commandsend=commandsend.replace(/'/g, "\"");
    //var commandsend=command.value.replace(/'/g, "\"");
    //commandsend=commandsend.replace(/\*/g, "'*'");

    //GetPSQLTable(commandsend, "root","daq",true).then(function(result){

//	sqloutput.innerHTML=result;
//	submit.disabled=false;

  //  });

//});

submit.addEventListener('click', submit_query);
command.addEventListener('keypress', function (e) {
  if (e.which == 13) submit_query();
});
