// html/DeviceConfig/deviceConfig.js
// Description: JavaScript for the device configuration page.

import { GetPSQLTable } from '/includes/functions.js';
import { dataTable } from '/includes/tooldaq.js';
import '/includes/ace.js'

let editor;

if (document.readyState !== 'loading') {
    //console.log("already loaded, initing");
    Init();
} else {
    //console.log("page still loading, waiting to finish...");
    document.addEventListener("DOMContentLoaded", function () {
        //console.log("page loaded, initing");
        Init();
    });
}

function Init() {
    //console.log("Initialising page");
    setupEditor();
    GetDeviceConfigs();
    document.getElementById("addDeviceConfigBtn").addEventListener("click", addDeviceConfig);
}

function setupEditor() {
    editor = ace.edit("jsonEditor");
    editor.setTheme("ace/theme/chrome");
    editor.session.setMode("ace/mode/json");
    editor.setValue("{\n  \"devices\": []\n}", -1);
}

function GetDeviceConfigs() {
    const query = "SELECT * FROM device_config ORDER BY time DESC LIMIT 20";
    dataTable(query, "deviceConfigOutput");
}

function addDeviceConfig() {
    const device = document.getElementById("device").value;
    const author = document.getElementById("author").value;
    const description = document.getElementById("description").value;
    const data = editor.getValue();

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
        alert("Device configuration saved successfully.");
        clearDeviceConfigInputs();
        GetDeviceConfigs();
    }).catch(function (error) {
        console.error("Error adding device configuration:", error);
    });
}

function clearDeviceConfigInputs() {
    document.getElementById("device").value = "";
    document.getElementById("author").value = "";
    document.getElementById("description").value = "";
    editor.setValue("{\n  \"devices\": []\n}", -1);
}
