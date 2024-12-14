'use strict';
import { GetPSQLTable } from '/includes/functions.js';

var alarm_table;
var alarmsinterval;
var checking_alarm_table = false;
var oldest;
var newest;

 if (document.readyState !== 'loading'){
 	Init();
 } else {
 	document.addEventListener('DOMContentLoaded', Init);
 }

function Init(){
	alarm_table = document.getElementById('alarm_output');
	document.getElementById('btnSilenceAll').addEventListener('click', SilenceByDeviceName);
	document.getElementById('loadMore').addEventListener('click', () => { GetAlarms(true); });
	document.getElementById('deviceNameFilter').addEventListener('change', () => { alarm_table.innerHTML = ''; GetAlarms(); } );
	GetAlarms();
	alarmsinterval = setInterval(GetAlarms, 5000);
}


function GetAlarms(arg = false){
	// note that arg may be an event if function is attached as callback
	// so just because we specify a default boolean false, if its called as a callback with no args, it'll not match (!arg)
	let append = false;
	if(typeof(arg) === 'boolean'){
		append = arg;
	}

	if(checking_alarm_table) {return;}
	checking_alarm_table=true;

	//console.log(`GetAlarms called with append ${append}`);

	try {

		const devName = document.getElementById('deviceNameFilter').value;
		const nameFilter1 = devName ? `WHERE device LIKE '%${devName}%'` : '';
    const nameFilter2 = devName ? `AND device LIKE '%${devName}%'` : '';

		const nrows = document.getElementById('numrows').value;
		let tablesize = alarm_table.getElementsByTagName('tr').length;
		if(tablesize>0) {tablesize--;} // skip header row
		if (tablesize === 0 || typeof oldest === 'undefined') {append = false;} // can't append if it's empty

		let query;
		// update status of all alarms shown
		if(append){
			query = `SELECT * FROM alarms WHERE time < '${oldest}' ${nameFilter2} ORDER BY time DESC LIMIT ${nrows}`;
		} else {
			const rowstoget = (tablesize == 0) ? nrows : tablesize;
			query = `SELECT * FROM alarms ${nameFilter1} ORDER BY time DESC LIMIT ${rowstoget}`;
		}
		//console.log(`runnin query '${query}'`);

		GetPSQLTable(query, 'root', 'daq', true).then(function(result){

			let rows;
			let temp_table;
			if(!append){
				alarm_table.innerHTML = result;
				rows = alarm_table.getElementsByTagName('tr');
			} else {
				temp_table = document.createElement('table');
				temp_table.innerHTML = result;
				rows = temp_table.getElementsByTagName('tr');
			}

			oldest = rows[rows.length - 1].cells[0].innerHTML;

			for (const row of rows) {
				if(row.rowIndex==0) {continue;} // skip header row
				const newCell = document.createElement('td');
				let btnNum = row.rowIndex-1;
				if(append) {btnNum += tablesize;}
				const btnID = 'btnSilence_'+btnNum; // optional
				const timeval = row.cells[0].innerText;
				newCell.innerHTML = `<button timeval=\"${timeval}\", id=\"${btnID}\">Silence</button>`;
				row.appendChild(newCell);
				if(append){
					alarm_table.getElementsByTagName('tbody')[0].insertAdjacentHTML('beforeend', row.innerHTML);

					//let newrow = alarm_table.insertRow();
					//for (let cell of row.cells) newrow.insertCell().innerText = cell.innerText;
				}
				// either of the following
				document.getElementById(btnID).addEventListener('click', () => { Silence(timeval); });
				//document.getElementById(btnID).onclick = function(){ Silence(timeval); };
			}

			if(append) {temp_table.remove;}

		});

	} catch(err){
		console.error(err);
	}
	finally{
		checking_alarm_table=false;
	}

}



function SilenceByDeviceName(){
	const devName = document.getElementById('deviceNameSilence').value;
	if(devName =='') {return;}

	GetPSQLTable(`update alarms set silenced=1 where device='${devName}'`, 'root', 'daq', false);

	// update alarms table
	GetAlarms();
}

function Silence(time){
	//console.log("Silence called by button "+event.target.id);
	//console.log("time is: "+time);

	GetPSQLTable(`update alarms set silenced=1 where time='${time}'`, 'root', 'daq', false);
	GetAlarms();
}
