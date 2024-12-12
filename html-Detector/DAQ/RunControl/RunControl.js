// html/DAQ/RunControl.js
// Description: JavaScript for controlling start/stop of runs & subruns
"use strict";

import { GetPSQLTable, GetPSQL, GetIP, GetPort, GetSDTable, Command } from '/includes/functions.js';

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

var servicePromise;
function Init(){
	console.log("Initialising page");

	// Disable buttons initially
	ToggleButtons(true);

	// create a promise that will immediately fire off FindRunControlService as an executor function
	// to start the search for the service (this lets us access the result as soon as it's available)
	servicePromise = new Promise(FindRunControlService);
	// we don't strictly need the result right now, but this will silence any errors
	servicePromise.then(null,(reason)=>{});
	// keep it updated by in the background
	// (the first fire of setInterval is after an initial delay interval)
	setInterval(FindRunControlService, 20000); // every 20s

	// load run configurations from the database to populate the drop-downs
	// first fire
	GetRunConfigurations();
	// keep it updated in the background
	setInterval(GetRunConfigurations, 20000); // every 20s

	// TODO add a button to switch from 'simple' to 'advanced'
	// simple: one dropdown of run configurations by name, version (maybe not even version, just use the latest?)
	// advanced: expands to a series of drop-downs that select run name, then version, with populated date+description

	document.getElementById("RunStart").addEventListener("click", StartNewRun);
	document.getElementById("RunStop").addEventListener("click", StopRun);
	document.getElementById("SubRun").addEventListener("click", StartNewSubrun);

	document.getElementById("configname").addEventListener("change", PopulateVersions);
}

/* Function to disable/enable buttons */
function ToggleButtons(disable) {
	const runControlButtons = document.querySelectorAll("#RunControl button");
	runControlButtons.forEach((button) => {
			button.disabled = disable;
	});

	const responseDiv = document.getElementById('response');
	if (disable) {
			responseDiv.value = "No service found. Buttons disabled.";
	} else {
			responseDiv.value = "Service found. Ready to start.";
	}
}

function SetStatusMessage(message, duration = 5000) {
	const responseDiv = document.getElementById('response');
	responseDiv.value = message;

	// Set a timeout to clear the message after `duration` milliseconds (default is 5 seconds)
	setTimeout(() => {
			responseDiv.value = ''; // Clear status message
	}, duration);
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

var configs;  // raw json of run configurations to monitor for changes, and only alter page elements when necessary
var configMap = new Map();
var versionMap = new Map();
var getting_configs=false;

// query the database for available run configurations
async function GetRunConfigurations(){

	// don't overlap calls
	if(getting_configs) return;
	getting_configs = true;

	//console.log("getting run configurations from database...");

	try {

		// get dropdown to populate
		const namedropdown = document.getElementById('configname');
		const verdropdown = document.getElementById('configver');

		// run a query to get run configurations from DB
		let querystring = "SELECT config_id,name,version,description FROM configurations";

		let newconfigstring;
		try {
			newconfigstring = await GetPSQL(querystring);
		} catch(error){
			// FIXME GetPQSL can return just an error string rather than an SQL result
			// but it doesn't reject in such cases! crude validity check below, but better upstream
			// e.g. check return value of psql command?
			console.error(error);
			return;
		}
		//console.log("run configurations: '"+newconfigs+"'");

		// skip update if no change
		if(configs === newconfigstring){
			//console.log("no new run configurations; done");
			return;
		}

		// GetPSQL returns its results as a json array... in theory. Crude validity check.
		let newconfigs;
		//newconfigs = JSON.parse("[{\"name\":\"one\"}, {\"name\":\"two\"}]"); // seems to pass as expected
		try {
			newconfigs = JSON.parse(newconfigstring);
		} catch(error){
			console.error(`invalid JSON in run configuration '${newconfigstring}'`);
			return;
		}
		if(newconfigs === 'undefined' || !Array.isArray(newconfigs) || !newconfigs.length){
			console.error("invalid run configuration array:");
			console.error(newconfigs);
			return;
		}
		configs = newconfigs;

		// update the dropdown menus
		// it's annoying (at best) if these background refreshes keep changing user selections
		// (at worst it could change the run type just as the user clicks 'start run')
		let selectedNameIndex = namedropdown.selectedIndex;  // may be undefined if no selection or no options yet
		let selectedName = ""; // just in case ordering changes, preserve selection by name not index
		let selectedVerIndex = verdropdown.selectedIndex;
		let selectedVer = -1;

		if(selectedNameIndex>=0){
			selectedName = namedropdown.options[selectedNameIndex].text;
		}
		if(selectedVerIndex>=0){
			selectedVer = verdropdown.options[selectedVerIndex].value;
		}

		// clear current options before rebuilding
		namedropdown.innerHTML="";
		verdropdown.innerHTML="";
		versionMap.clear();
		configMap.clear();
		let rowindex=0; // index of config name in the configMap
		configs.forEach((row) => {
			configMap.set(row.config_id,[row.name,row.version]);
			// each element is a row, each row is a json object of field:value keys
			// note that these can be accessed as properties of the JSON object
			if(!versionMap.has(row.name)){
				versionMap.set(row.name, new Array());
				let option = document.createElement('option');
				option.text = option.value = row.name;
				// note the new index when we encounter the previously selected run configuration
				if(selectedName === row.name){
					selectedNameIndex = rowindex;
				}
				//console.log("appending option: "+option.text);
				namedropdown.appendChild(option);
				++rowindex;
			}
			versionMap.get(row.name).push(row.version);
			//console.log("adding run configuration: "+row.name+" v"+row.version);
		});

		// restore user selection
		if(selectedNameIndex >=0){
			namedropdown.selectedIndex=selectedNameIndex;
		}
		// if the drop-down was empty but now has values, it'll select the first entry
		//selectedNameIndex = namedropdown.selectedIndex;

		// load corresponding version numbers
		PopulateVersions(selectedVer);

	}

	// ALWAYS reset this when we're done
	finally {

		//console.log("done getting run configurations from database");

		getting_configs = false;
	}
}

function PopulateVersions(selectedVer=-1){

	//console.log(`populate ver called with selectedVer ${selectedVer} of type `+typeof(selectedVer));

	// populate the dropdown of versions associated with a given run configuration name
	const namedropdown = document.getElementById('configname');
	const verdropdown = document.getElementById('configver');

	if(typeof(selectedVer) == "object"){
		// run config name change event trigger, reset version
		selectedVer=-1;
		verdropdown.selectedIndex = -1;
	}

	let selectedNameIndex = namedropdown.selectedIndex;  // may be undefined if no selection or no options yet
	if(selectedNameIndex<0) return;
	let selectedName = namedropdown.options[selectedNameIndex].text;

	let selectedVerIndex=-1;
	let versionarr = versionMap.get(selectedName);
	// sort descending

	// we have to give it a weird prototype as by default it sorts alphabetically
	versionarr.sort(function(a, b) { return a - b; });
	versionarr.reverse();

	// if not told what version to select, look it up (to preserve user selection)
	if(selectedVer<0){
		selectedVerIndex = verdropdown.selectedIndex;
		if(selectedVerIndex>=0){
			selectedVer = verdropdown.options[selectedVerIndex].value;
		} else {
			// if no currently active user selection, by default select the maximum
			selectedVer = versionarr[0];
		}
	}

	verdropdown.innerHTML="";
	versionarr.forEach((ver, index) => {
		let option = document.createElement('option');
		option.text = option.value = ver;
		verdropdown.appendChild(option);
		if(selectedVer == ver){
			selectedVerIndex = index;
		}
	});
	if(selectedVerIndex >=0){
		verdropdown.selectedIndex=selectedVerIndex;
	}
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

var runcontrol_ip = "";
var runcontrol_port = 0;
var getting_service = false;

// we use the following signature so we can pass it as executor to a promise
// this doesn't affect the background searching
async function FindRunControlService(resolve, reject){

	// don't overlap calls
	if(getting_service) return;
	getting_service=true;

	//console.log("searching for RunControl slow control service...");

	const daq_service_name = document.getElementById('ServiceName').value;
	const slow_service_name = "SlowControlReceiver";  // should always be this...

	try {
		SetStatusMessage('Locating RunControl Service...', 5000);
		ToggleButtons(true);

		// FIXME make a 'GetService' in functions.js that returns IP, port and status all at once!
		// get promises that will eventually return IP and port
		let ip_promise = GetIP(daq_service_name,true);
		//let port_promise = GetPort(slow_service_name,true);
		let port_promise = new Promise( (resolve, reject) => { resolve(60000); }); // it's always going to be 60000 says ben
		let status_promise = GetSDTable(daq_service_name, true);

		// produce a combined promise that will wait for both promises to be fulfilled
		// (or for either of them to be rejected)
		const combinedPromise = Promise.all([ip_promise, port_promise, status_promise]);

		// await will throw a reason if either promise rejects,
		// otherwise it will return an array of promised values; i.e. [ip, port]
		let [ip, port, sdtable] = await combinedPromise;

		// sanity checks
		if(ip==""){
			let reason="empty runcontrol service IP!";
			//console.error(reason);
			SetStatusMessage(reason, 5000);
			if(typeof reject === 'function') reject(reason);
		}
		document.getElementById("ServiceIP").value = ip;
		runcontrol_ip = ip;

		if(port=="" || port==0){
			let reason="invalid service port '"+port+"'!";
			SetStatusMessage(reason, 5000);
			//console.error(reason);
			if(typeof reject === 'function') reject(reason);
		}
		document.getElementById("ServicePort").value = port;
		runcontrol_port = port;

		if(sdtable=="" || sdtable.rows[0].cells.length < 5){
			let reason="empty/invalid sdtable for run control service status!";
			//console.error(reason);
			if(typeof reject === 'function') reject(reason);
		}
		// else extract status
		document.getElementById("ServiceStatus").value = (sdtable.rows[0].cells[4].innerText.trim());

		console.log("RunControl service at: "+ip+"::"+port);

		// Enable the buttons now that service is found
		ToggleButtons(false);
		SetStatusMessage('RunControl service found at ' + ip + '::' + port, 5000);

		if(typeof resolve === 'function') resolve([ip,port]);

	} catch(error){
		console.error("FindRunControlService error: "+error);
		SetStatusMessage(`Error: ${error}`, 5000);
		if(typeof reject === 'function') reject(error);
	}

	// ALWAYS reset when we're done
	finally {

		//console.log("done searching for RunControl service");

		getting_service=false;
	}
}

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

	const responseDiv = document.getElementById('response');

	try {

		// get user description and configuration
		const description = document.getElementById('description').value;
		const namedropdown = document.getElementById('configname');
		const verdropdown = document.getElementById('configver');
		const configname = namedropdown.options[namedropdown.selectedIndex].text;
		const configver = verdropdown.options[verdropdown.selectedIndex].text;

		//console.log("run type: "+configname+", v"+configver+", description: '"+description+"'");

		// sanity check
		if(configname === 'undefined' || configver === 'undefined'){
			console.error("run requested with undefined run config name or version?");
			return;
		}

		// map name and version to a config_id
		let runconfig;
		for (const [key, [name,ver]] of configMap) {
			// need to use == not === because map stores num but dropdown stores string
			if(name === configname && ver == configver){
				runconfig = key;
			}
		}
		if(typeof runconfig === 'undefined'){
			console.error("could not find config_id for configuration "+configname+" v"+configver);
			return;
		}
		//console.log("will start a new run with runconfig "+runconfig);

		// command function from functions.js for sending slow control command to a Service
		// function Command(ip, port, command) -> promise
		// sends ip, port, command via a POST request to "cgi-bin/sendcommand2nopadding.cgi"
		// returning promise to response

		responseDiv.value='Locating RunControl Service...';

		// if we do not yet have both IP and port, wait on the promise
		if(runcontrol_ip === "" ||  runcontrol_port === 0){
			try {
				// we don't technically need to get the returned values from the promise
				// because by the time it resolves it'll have populated the globals
				let [ip, port] = await servicePromise;
			} catch(error){
				console.error(`Error locating Run Control slow control service: ${error}`);
				responseDiv.value=`Error locating Run Control slow control service: ${error}`;
				return;
			}
		}
		// in theory at this point we should have valid IP and port

		responseDiv.value='Sending Start Run command...';

		let runstart_command = "RunStart {\"run_description\":\""+description+"\", \"run_configuration\":"+runconfig+"}";
		console.log("Sending run start command '"+runstart_command+"' to "+runcontrol_ip+"::"+runcontrol_port);

		let response = await Command(runcontrol_ip, runcontrol_port, runstart_command, true);
		//let response = Command(runcontrol_ip, runcontrol_port, runstart_command);

		responseDiv.value=`Start Run response: '${response}'`;

	} catch (error){
		console.error("RunStart Command error: "+error);
		responseDiv.value=`Error starting new run: '${error}'`;
		return false;
	}

	// ALWAYS reset when we're done
	finally {

		//console.log("Done sending new run request");

		// re-enable buttons
		for (let i = 0; i < buttons.length; i++) {
			buttons[i].disabled = false;
		}

		working=false;
	}
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

async function StopRun(){

	if(working) return;
	working=true;

	console.log("End of run requested!");

	// disable controls while we process this command
	let buttons = document.getElementsByTagName('button');
	for (let i = 0; i < buttons.length; i++) {
		buttons[i].disabled = true;
	}

	const responseDiv = document.getElementById('response');

	try {

		responseDiv.value='Locating RunControl Service...';

		// if we do not yet have both IP and port, wait on the promise
		if(runcontrol_ip === "" ||  runcontrol_port === 0){
			try {
				// we don't technically need to get the returned values from the promise
				// because by the time it resolves it'll have populated the globals
				let [ip, port] = await servicePromise;
			} catch(error){
				console.error(`Error locating Run Control slow control service! ${error}`);
				responseDiv.value = `Error locating Run Control slow control service! ${error}`;
				return;
			}
		}
		// in theory at this point we should have valid IP and port

		responseDiv.value='Sending Stop Run command...';

		let runstop_command = "RunStop";
		console.log("Sending run stop command '"+runstop_command+"' to "+runcontrol_ip+"::"+runcontrol_port);

		let responsepromise = Command(runcontrol_ip, runcontrol_port, runstop_command);
		let response = await responsepromise;
		responseDiv.value=`Stop Run response: '${response}'`;

	} catch (error){
		console.error("RunStop Command error: "+error);
		responseDiv.value=`Error stopping run: '${error}'`;
		return false;
	}

	// ALWAYS reset when we're done
	finally {

		//console.log("Done sending end of run request");

		// re-enable buttons
		for (let i = 0; i < buttons.length; i++) {
			buttons[i].disabled = false;
		}

		working=false;
	}
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

async function StartNewSubrun(){

	if(working) return;
	working=true;

	console.log("New subrun requested!");

	// disable controls while we process this command
	let buttons = document.getElementsByTagName('button');
	for (let i = 0; i < buttons.length; i++) {
		buttons[i].disabled = true;
	}

	const responseDiv = document.getElementById('response');

	try {

		responseDiv.value='Locating RunControl Service...';

		// if we do not yet have both IP and port, wait on the promise
		if(runcontrol_ip === "" ||  runcontrol_port === 0){
			try {
				// we don't technically need to get the returned values from the promise
				// because by the time it resolves it'll have populated the globals
				let [ip, port] = await servicePromise;
			} catch(error){
				console.error(`Error starting new subrun: '${error}'`);
				responseDiv.value=`Error starting new subrun: '${error}'`;
				return;
			}
		}
		// in theory at this point we should have valid IP and port

		responseDiv.value='Sending New Subrun command...';

		let subrunstart_command = "SubRunStart";
		console.log("Sending subrun start command '"+subrunstart_command+"' to "+runcontrol_ip+"::"+runcontrol_port);

		let responsepromise = Command(runcontrol_ip, runcontrol_port, subrunstart_command);
		let response = await responsepromise;
		responseDiv.value=`New Subrun response: '${response}'`;

	} catch (error){
		console.error("Start New Subrun Command error: "+error);
		responseDiv.value=`Error starting new subrun: '${error}'`;
		return false;
	}

	// ALWAYS reset when we're done
	finally {

		//console.log("Done sending new subrun request");

		// re-enable buttons
		for (let i = 0; i < buttons.length; i++) {
			buttons[i].disabled = false;
		}

		working=false;
	}
}

