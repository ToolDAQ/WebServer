// html/DAQ/RunControl.js
// Description: JavaScript for controlling start/stop of runs & subruns
"use strict";

import { GetPSQLTable, GetPSQL, GetIP, GetPort } from '/includes/functions.js';

if (document.readyState !== 'loading'){
	//console.log("already loaded, initing");
	Init();
} else {
	//console.log("page still loading, waiting to finish...");
	document.addEventListener("DOMContentLoaded", function () {
		//console.log("page loaded, initing");
		Init();
	});
}

function Init(){
	console.log("Initialising page");
	
	// load run configurations once on page load
	//FindRunControlService();  // actually we'll do the first call with a promise...
	// but keep it updated by in the background
	// (the first fire of setInterval is after an initial delay interval)
	setInterval(FindRunControlService, 10000);
	
	// load run configurations from the database to populate the drop-downs
	// first fire
	GetRunConfigurations();
	// keep it updated in the background
	setInterval(GetRunConfigurations, 10000);
	
	// load run configurations each time drop-down is clicked, to load any newly added ones
	document.getElementById("config").addEventListener("click", GetRunConfigurations);
	
	// TODO add a button to switch from 'simple' to 'advanced'
	// simple: one dropdown of run configurations by name, version (maybe not even version, just use the latest?)
	// advanced: expands to a series of drop-downs that select run name, then version, with populated date+description
	
	document.getElementById("RunStart").addEventListener("click", StartNewRun);
	document.getElementById("RunStop").addEventListener("click", StopRun);
	document.getElementById("SubRun").addEventListener("click", StartNewSubrun);
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

var configs;  // raw json of run configurations to monitor for changes, and only alter page elements when necessary
var getting_configs=false;

// query the database for available run configurations
async function GetRunConfigurations(){
	
	// don't overlap calls
	if(getting_configs) return;
	getting_configs = true;
	
	console.log("getting run configurations from database...");
	
	try {
		
		// get dropdown to populate
		const configdropdown = document.getElementById('config');
		
		// run a query to get run configurations from DB
		let querystring = "SELECT name,version,description FROM configurations";
		
		let newconfigs;
		try {
			newconfigs = await GetPSQL(querystring);
		} catch(error){
			// FIXME GetPQSL can return just an error string rather than an SQL result
			// but it doesn't reject in such cases! crude validity check below, but better upstream
			// e.g. check return value of psql command?
			console.log(error);
			return;
		}
		console.log("run configurations: "+newconfigs);
		
		// skip update if no change
		if(configs === newconfigs){
			console.log("no new run configurations; done");
			return;
		}
		
		// GetPSQL returns its results as a json array... in theory. Crude validity check.
		//newconfigs = JSON.parse("[{\"name\":\"one\"}, {\"name\":\"two\"}]"); // seems to pass as expected
		if(newconfigs === 'undefined' || !Array.isArray(newconfigs) || !newconfigs.length){
			console.log("invalid run configuration array:");
			console.log(newconfigs);
			return;
		}
		configs = newconfigs;
		
		// update the dropdown menu options
		// it's annoying (at best) if these background refreshes keep changing user selections
		// (at worst it could change the run type just as the user clicks 'start run')
		let selectedIndex = configdropdown.selectedIndex;  // may be undefined if no selection or no options yet
		let selectedConfig = ""; // just in case ordering changes, preserve selection by name not index
		if(selectedIndex>=0){
			selectedConfig = configdropdown.options[selectedIndex].text;
			console.log("preserving selected run configuration: "+selectedConfig);
		} else {
			console.log("no run config selected");
		}
		
		// clear current options before rebuilding
		configdropdown.innerHTML="";
		configs.forEach((row, index) => {
			// each element is a row, each row is a json object of field:value keys
			// note that these can be accessed as properties of the JSON object
			let option = document.createElement('option');
			option.text = option.value = row.name;
			// note the new index when we encounter the previously selected run configuration
			if(selectedConfig !== '' && selectedConfig === row.name){
				selectedIndex = index;
			}
			console.log("adding run configuration: "+row.name);
			configdropdown.appendChild(option);
		});
		// restore user selection
		if(selectedIndex >=0) dd.selectedIndex=selectedIndex;
		
		console.log("added "+configs.length+" run configurations");
		
	}
	
	// ALWAYS reset this when we're done
	finally {
		
		console.log("done getting run configurations from database");
		
		getting_configs = false;
	}
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

var runcontrol_ip = "";
var runcontrol_port = 0;
var getting_service = false;

// we use the following signature so we can pass it as executor to a promise
// this doesn't affect the background searching
function FindRunControlService(resolve, reject){
	
	// don't overlap calls
	if(getting_service) return;
	getting_service=true;
	
	console.log("searching for RunControl slow control service...");
	
	const service_name = "RunControl";
	
	try {
		
		// get promises that will eventually return IP and port
		let ip_promise = GetIP(service_name,true);
		let port_promise = GetPort(service_name,true);
		
		// attach a callback to be invoked when ip is found
		ip_promise.then(function(result){
			console.log("GetIP returned: "+result);
			if(result==""){
				let reason="empty runcontrol service IP!";
				console.log(reason);
				reject(reason);
			}
			runcontrol_ip = result;
			document.getElementById("ServiceIP").InnerHTML = result;
		},
		function(error){
			let reason="error getting runcontrol service IP: "+error;
			console.log(reason);
			reject(reason);
		});
		
		// attach a callback to be invoked when port is found
		port_promise.then(function(result){
			console.log("GetPort returned: "+result);
			if(result=="" || result==0){
				let reason="invalid service port '"+result+"'!";
				console.log(reason);
				reject(reason);
			}
			runcontrol_port = result;
			document.getElementById("ServicePort").InnerHTML = result;
		},
		function(error){
			let reason="error getting runcontrol service port: "+error;
			console.log(reason);
			reject(reason);
		});
		
		// wait for those promises to be fulfilled
		// we produce a combined promise that will wait for both promises to be fulfilled
		// (or for either of them to be rejected), and attach another thenable
		// that resolves FindRunControlService as an executor based on the combined value
		const combinedPromise = Promise.all([ip_promise, port_promise]).then((values) => {
			// 'values' will be an array of returns from each promise; i.e. [ip, port]
			console.log("RunControl service at: "+values[0]+"::"+values[1]);
			resolve(values);
		});
		
	} catch(error){
		console.log(error);
		reject(error);
	}
	
	// ALWAYS reset when we're done
	finally {
		
		console.log("done searching for RunControl service");
		
		getting_service=false;
	}
}

// create a promise that will immediately fire off FindRunControlService as an executor function
// to start the search for the service
const servicePromise = new Promise(FindRunControlService);

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

// now the button functions
// only work on one at a time
var working=false;
async function StartNewRun(){
	
	if(working) return;
	working=true;
	
	console.log("New run requested!"); 
	
	// disable controls while we process this command
	let buttons = document.getElementsByTagName('button');
	for (let i = 0; i < buttons.length; i++) {
		buttons[i].disabled = true;
	}
	
	try {
		
		// get user description and configuration
		const description = document.getElementById('response').value;
		const configdropdown = document.getElementById('config');
		const runconfig = configdropdown.options[configdropdown.selectedIndex].text; // or .value, which may be different
		console.log("run type: "+runconfig+", description: '"+description+"'");
		
		// command function from functions.js for sending slow control command to a Service
		// function command(ip, port, command) -> promise
		// sends ip, port, command via a POST request to "cgi-bin/sendcommand2nopadding.cgi"
		// returning promise to response
		
		const responsediv = document.getElementById('response');
		
		responsediv.innerHTML='Locating RunControl Service...';
		
		// if we do not yet have both IP and port, wait on the promise
		if(runcontrol_ip === '' ||  runcontrol_port === 0){
			try {
				// we don't technically need to get the returned values from the promise
				// because by the time it resolves it'll have populated the globals
				let [ip, port] = await servicePromise;
			} catch(error){
				console.log("Error locating Run Control slow control service! "+error);
				return;
			}
		}
		// in theory at this point we should have valid IP and port
		
		responsediv.innerHTML='Sending Start Run command...';
		let runstart_command = "{\"run_description\":\""+description+"\", \"run_configuration\":"+runconfig+"}";
		console.log("Sending run start command '"+runstart_command+"' to "+runcontrol_ip+"::"+runcontrol_port);
		let responsepromise = command(runcontrol_ip, runcontrol_port, runstart_command);
		let response = await responsepromise;
		responsediv.innerHTML=string("Start Run response: '${response}'");
		
	}
	
	// ALWAYS reset when we're done
	finally {
		
		console.log("Done sending new run request");
		
		// re-enable buttons
		for (let i = 0; i < buttons.length; i++) {
			buttons[i].disabled = false;
		}
		
		working=false;
	}
}


async function StopRun(){}
async function StartNewSubrun(){}
