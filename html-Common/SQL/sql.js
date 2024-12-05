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
    GetPSQLTable(command.value, "root","daq",true).then(
      function(result){
	sqloutput.innerHTML=result;
	submit.disabled=false;
      },
      function (error) {
        sqloutput.textContent = error.message;
        submit.disabled = false;
      }
    );
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
