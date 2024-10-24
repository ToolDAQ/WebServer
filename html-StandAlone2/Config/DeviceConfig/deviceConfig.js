// html/DeviceConfig/deviceConfig.js
// Description: JavaScript for the device configuration page.

import { GetPSQLTable, GetPSQL } from '/includes/functions.js';

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
        //console.log("Initialising page");
        GetDeviceConfigs();
        document.getElementById("addDeviceConfigBtn").addEventListener("click", addDeviceConfig);
}

function GetDeviceConfigs() {
    const query = "SELECT * FROM device_config ORDER BY time DESC LIMIT 10";
    GetPSQLTable(query, "root", "daq", true).then(function (result) {
        const deviceConfigOutput = document.getElementById("deviceConfigOutput");
        deviceConfigOutput.innerHTML = result;
    }).catch(function (error) {
        console.error("Error fetching device configurations:", error);
    });
}

function addDeviceConfig() {
    const device = document.getElementById("device").value;
    const author = document.getElementById("author").value;
    const description = document.getElementById("description").value;
    const data = document.getElementById("data").value;

    // Ensure data is in JSON format
    try {
        JSON.parse(data);
    } catch (e) {
        alert("Invalid JSON format in data field.");
        return;
    }

    const query = `
        INSERT INTO device_config (time, device, version, author, description, data)
        VALUES (now(), '${device}', (select COALESCE(MAX(version)+1,0) FROM device_config WHERE device='${device}'),
        '${author}', '${description}', '${data}'::jsonb)
    `;

    GetPSQLTable(query, "root", "daq", true).then(() => {
        // Refresh the table after adding a new config
        GetDeviceConfigs();
    }).catch(function (error) {
        console.error("Error adding device configuration:", error);
    });
}
