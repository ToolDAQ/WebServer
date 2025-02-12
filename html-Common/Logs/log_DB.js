"use strict;"
import { GetPSQLTable } from "/includes/functions.js";
import { dbJson } from '/includes/tooldaq.js';

if (document.readyState !== 'loading'){
	Init();
} else {
	document.addEventListener("DOMContentLoaded", function () {
		Init();
	});
}

function Init(){
	DisplayZeroStateMessage();
	GetLogItems();
	document.getElementById("fetch-logs-button").addEventListener("click", FetchLogs);
}

function DisplayZeroStateMessage() {
	const logContainer = document.getElementById("logs-container");
	const zeroStateDiv = document.createElement("div");
		zeroStateDiv.id = "zero-div";
    zeroStateDiv.classList.add("mdl-shadow--2dp");
    zeroStateDiv.style.marginTop = "20px";
    zeroStateDiv.style.padding = "20px";
    zeroStateDiv.style.minHeight = "100px";
    zeroStateDiv.style.backgroundColor = "#f1f1f1";

    zeroStateDiv.innerHTML = `
			<p style="text-align: center; font-size: 16px; color: #666;">
				No logs to display yet.<br>
				Select a device and specify the number of logs you want to see, then click <strong>Show Logs</strong> to get started.
				<br> You can repeat this process for different devices.
			</p>
    `;

    logContainer.appendChild(zeroStateDiv);
}

function GetLogItems() {
	const query = "SELECT distinct(device) from logging";
	dbJson(query).then(function (result) {
		const log_select = document.getElementById("log-selector");
		log_select.innerHTML = '<option value="" disabled selected>Select log item</option>';

		result.forEach(function (item) {
			const option = document.createElement("option");
			option.value = item.device;
			option.textContent = item.device;
			log_select.appendChild(option);
		});

		componentHandler.upgradeElement(log_select);
	}).catch(function (error) {
		console.error("Error fetching log items:", error);
		alert("There was an error fetching the log items.");
	});
}

function FetchLogs() {
	const device = document.getElementById("log-selector").value;
	let log_line_count = document.getElementById("log-line-count").value;

	if (!device || !log_line_count || isNaN(log_line_count) || log_line_count <= 0) {
		alert("Please select a valid device and specify a valid number of log lines.");
		return;
	}

	const query = `SELECT time, severity, message FROM logging WHERE device = '${device}' ORDER BY time DESC LIMIT ${log_line_count}`;

	dbJson(query).then(function (result) {
			const logContainer = document.getElementById("logs-container");
			const zeroStateDiv = document.getElementById("zero-div");
			if (zeroStateDiv) logContainer.removeChild(zeroStateDiv);

			let log_display = document.getElementById(`log-${device}`);
			if (!log_display) {
				log_display = document.createElement("div");
				log_display.id = `log-${device}`;
				log_display.classList.add("mdl-shadow--2dp");
				log_display.style.marginTop = "20px";
				log_display.style.padding = "20px";
				log_display.style.minHeight = "100px";

				const closeButton = document.createElement("button");
				closeButton.textContent = "Close";
				closeButton.classList.add("mdl-button", "mdl-js-button", "mdl-button--raised", "mdl-button--colored");
				closeButton.style.float = "right";
				closeButton.addEventListener("click", function () {
						log_display.remove();
				});
				log_display.appendChild(closeButton);

				const header = document.createElement("h5");
				header.textContent = `Logs for device: ${device}`;
				header.style.marginBottom = "10px";
				log_display.appendChild(header);
				logContainer.appendChild(log_display);
			}
			else {
				const existingLogs = log_display.querySelectorAll("p");
				existingLogs.forEach(log => log.remove());
			}

			if (result.length === 0) {
					const noLogsMessage = document.createElement("p");
					noLogsMessage.textContent = 'No logs available for this device.';
					log_display.appendChild(noLogsMessage);
			} else {
				result.forEach(function (log) {
					const log_entry = document.createElement("p");
					log_entry.textContent = `${log.time} | Severity: ${log.severity} | Message: ${log.message}`;
					log_display.appendChild(log_entry);
				});
			}

	}).catch(function (error) {
			console.error("Error fetching logs:", error);
			alert("There was an error fetching the logs.");
	});
}

var log_output=document.getElementById("log_output");
var update = setInterval(GetLogSources, 5000); // Run the GetLogSources() function every minute
var updating = false;

//load logs on startup
GetLogSources();

//generic funcion for returning SQL table
function gettable(command){
        return GetPSQLTable(command, 'root', 'daq', true);
}

function GetLogSources(){ //command to get log files, first cehckes which devices exist then gets the last 15 messages for each

    if(updating) return;
    updating = true;

    var command="SELECT distinct(device) from logging"

    gettable(command).then(function(result){

	var table= document.createElement('table');
	table.innerHTML = result;
	var tmp=[];

	for( var i=1; i < table.rows.length; i++){
	    tmp[i-1] =table.rows[i].innerText.replace(/\s/g, '');
	}

	var counter=0;

	tmp.map(function(row){

	    var command= "select time, severity, message from logging where device='" + row + "' order by time desc limit 15;";
	    gettable(command).then(function(result2){

		var pos=0;
		for( var k=0; k < tmp.length; k++){
		    if(row==tmp[k]) pos=k;
		}

		tmp[pos]="<a href=\"/cgi-bin/sqlquerystring.cgi?method=post&user=root&db=daq&command=select time, severity, message from logging where device=%22" + row + "%22 order by time desc;\">" + row + "</a><div id=" + row + " align='left' style=\"#ccc;font:12px/13px Georgia, Garamond, Serif;overflow:scroll;border:2px solid;padding:1%;height:200px\">";
		var output_table= document.createElement('table');
		output_table.innerHTML=result2;

		for( var j=1; j < output_table.rows.length; j++){
		    tmp[pos]+="<b>" + output_table.rows[j].cells[0].innerText +" [" + output_table.rows[j].cells[1].innerText + "]:</b> " + output_table.rows[j].cells[2].innerText + "<br>"
		}

		tmp[pos]+= "</div><p> <script type=\"text/javascript\"> var divid = document.getElementById(\""+ row + "\"); divid.scrollTop = divid.scrollHeight; </script>"
		counter++;

		if(counter==tmp.length){

		    var html_insert="";
		    for( var l=0; l < tmp.length; l++){
			html_insert+=tmp[l];
		    }

		    log_output.innerHTML= html_insert;
		    updating=false;

		}
	    });

	});


    });

}

