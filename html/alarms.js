var alarm_table = document.getElementById("alarm output");
var alarmsinterval = setInterval(GetAlarms, 5000);
var checking_alarm_table = false;

GetAlarms();

function GetAlarms(){
    
    if(checking_alarm_table) return;
    checking=true;

    GetPSQLTable("select * from alarms order by time desc limit 50", "root", "daq", true).then(function(result){
	
	alarm_table.innerHTML="";
	alarm_table.innerHTML=result;
	
	const rows = alarm_table.getElementsByTagName("tr");
	
	for (const row of rows) {
	    if(row.rowIndex==0) continue;
	    const newCell = document.createElement("td");
	    newCell.innerHTML = "<button onclick=\"Silence(\'" + row.cells[0].innerText + "\')\">Silence</button>"; 
	    row.appendChild(newCell);
	}
	checking_alarm_table=false;
	
    });
    
}										       

function Silence(time){

  GetPSQLTable("update alarms set silenced=1 where time=\""+time+"\"", "root", "daq", false);
    GetAlarms();
}
