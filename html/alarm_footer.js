var audio = new Audio('./jump.ogg');
var alarm_message = document.getElementById("alarm_message");
var updateinterval = setInterval(CheckAlarms, 5000);
var alarminterval = "";
var checking_alarm_footer = false;

CheckAlarms();

function sleep (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function TestAlarm(){
    alarm_message.value = "Alarm Test";
    for (let i = 0; i < 10; i++){
        await sleep(1000);
	audio.play();
	if(document.body.style.backgroundColor == "red"){
	    document.body.style.backgroundColor = "white";
	    alarm_message.style.backgroundColor = "white";
        }
	else{
	    document.body.style.backgroundColor = "red"
	    alarm_message.style.backgroundColor = "red";
	}
	
    }
    alarm_message.value = "no current alarm";
    
}    

function CheckAlarms(){
    
    if(checking_alarm_footer) return;
    checking=true;

    GetPSQLTable("select type from alarms where silenced=0", "root", "daq", true).then(function(result){
	var table= document.createElement('table');
	table.innerHTML=result;
	
	if(table.rows.length<2){
	    AlarmOff();
	    return;
	}
	else{
	    alarm_message.value = table.rows[1].cells[0].innerText;
	    if (alarminterval == "") alarminterval = setInterval(AlarmOn, 1000);
	}
	checking_alarm_footer=false;
    });

}										       

function AlarmOn(){
    audio.play();
    if(document.body.style.backgroundColor == "red"){
	document.body.style.backgroundColor = "white";
	alarm_message.style.backgroundColor = "white";
    }
    else{
	document.body.style.backgroundColor = "red"
	alarm_message.style.backgroundColor = "red";
    }
    
}

function AlarmOff(){
    clearInterval(alarminterval);
    alarminterval = "";        
    document.body.style.backgroundColor = "white";
    alarm_message.style.backgroundColor = "white";
    alarm_message.value =  "no current alarm";
 
}

