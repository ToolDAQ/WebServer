import { GetPSQLTable } from "/includes/functions.js";

var alarm_table = document.getElementById("alarm output");
var alarmsinterval = setInterval(GetAlarms, 5000);
var checking_alarm_table = false;

GetAlarms();

function GetAlarms(){
    
    if(checking_alarm_table) return;
    checking_alarm_table=true;

    GetPSQLTable("select * from alarms order by time desc limit 50", "root", "daq", true).then(function(result){
	
	alarm_table.innerHTML="";
	alarm_table.innerHTML=result;
	
	const rows = alarm_table.getElementsByTagName("tr");
	
	for (const row of rows) {
	    if(row.rowIndex==0) continue;
	    const newCell = document.createElement("td");
	    const btnID = "btnSilence_"+(row.rowIndex-1); // optional
	    const timeval = row.cells[0].innerText;
	    newCell.innerHTML = `<button timeval=\"${timeval}\", id=\"${btnID}\">Silence</button>`;
	    row.appendChild(newCell);
	    // either of the following
	    document.getElementById(btnID).addEventListener("click", () => { Silence(timeval); });
	    //document.getElementById(btnID).onclick = function(){ Silence(timeval); };
	}
	checking_alarm_table=false;
	
    });
    
}

function Silence(time){
  //console.log("Silence called by button "+event.target.id);
  //console.log("time is: "+time);

  GetPSQLTable(`update alarms set silenced=1 where time='${time}'`, "root", "daq", false);
    GetAlarms();
}
