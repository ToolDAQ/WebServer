import { GetPSQLTable } from '/includes/functions.js';

var audio = new Audio('/includes/jump.mp3');
var alarm_message = document.getElementById("alarm_message");
var updateinterval = setInterval(CheckAlarms, 5000);
var alarminterval = "";
var checking_alarm_footer = false;
var test_alarm_button = document.getElementById("test_alarm");

checkAutoplayPermission();

CheckAlarms();

function sleep (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Check if autoplay for audio is allowed
function checkAutoplayPermission() {
    audio.play().then(() => {
        console.log('Autoplay is allowed');
    }).catch(() => {
        showEnableAudioButton();
    });
}

function showEnableAudioButton() {
    var enableAudioBtn = document.createElement('button');
    enableAudioBtn.innerText = 'Enable Sound';
    enableAudioBtn.style.position = 'fixed';
    enableAudioBtn.style.bottom = '20px';
    enableAudioBtn.style.right = '20px';
    enableAudioBtn.style.zIndex = '1000';
    document.body.appendChild(enableAudioBtn);

    enableAudioBtn.addEventListener('click', function() {
        audio.play().then(() => {
            alert('Audio enabled! Alarm sound will play next time.');
            enableAudioBtn.remove();
        }).catch((error) => {
            console.error('Audio playback failed:', error);
        });
    });
}

test_alarm_button.addEventListener("click", TestAlarm);

async function TestAlarm() {
    alarm_message.value = "Alarm Test";
    for (let i = 0; i < 4; i++) {
        await sleep(1000);
        AlarmOn();
    }
    alarm_message.value = "no current alarm";
}

function CheckAlarms() {
    if (checking_alarm_footer) return;
    checking_alarm_footer = true;

    GetPSQLTable("select device from alarms where silenced=0", "root", "daq", true).then(function(result) {
        var table = document.createElement('table');
        table.innerHTML = result;

        if (table.rows.length < 2) {
            AlarmOff();
        } else {
            alarm_message.value = table.rows[1].cells[0].innerText;
            if (alarminterval == "") alarminterval = setInterval(AlarmOn, 1000);
        }
        checking_alarm_footer = false;
    });
}

function AlarmOn() {
    playAlarmSound();
    if (document.body.style.backgroundColor == "red") {
        document.body.style.backgroundColor = "white";
        alarm_message.style.backgroundColor = "white";
    } else {
        document.body.style.backgroundColor = "red";
        alarm_message.style.backgroundColor = "red";
    }
}

function AlarmOff() {
    clearInterval(alarminterval);
    alarminterval = "";
    document.body.style.backgroundColor = "white";
    alarm_message.style.backgroundColor = "white";
    alarm_message.value = "no current alarm";
}

// Function to play the alarm sound with fallback for Safari
function playAlarmSound() {
	audio.load();
    audio.play().catch((error) => {
        console.log('Audio playback blocked:', error);
    });
}
