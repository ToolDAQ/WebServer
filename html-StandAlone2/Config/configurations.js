// html/Config/configuration.js
// Description: JavaScript for adding and displaying configurations.
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
	GetConfigurations();
	//loadDeviceConfigurations(); // unused
        
        document.getElementById("addConfigBtn").addEventListener("click", addConfiguration);
}

function GetConfigurations() {
    const query = "SELECT * FROM configurations ORDER BY time DESC LIMIT 10";
    //console.log("query: "+query);
    GetPSQLTable(query, "root", "daq", true).then(function (result) {
		const configTable = document.getElementById('configTable');
		//console.log("Configurations result"+result);
        configTable.innerHTML = result;
    }).catch(function (error) {
        console.error("Error fetching configurations:", error);
    });
}

function addConfiguration() {
    const name = document.getElementById("name").value;
    const description = document.getElementById("description").value;
    const author = document.getElementById("author").value;
    const data = document.getElementById("data").value;

    // Ensure data is in JSON format
    try {
        JSON.parse(data);
    } catch (e) {
        alert("Invalid JSON format in data field.");
        return;
    }

    const queryInsert = `
        INSERT INTO configurations (time, name, version, description, author, data)
        VALUES ( now(), '${name}', (select COALESCE(MAX(version)+1,0) FROM configurations WHERE name='${name}'),
                 '${description}', '${author}', '${data}'::jsonb)
    `;

    GetPSQLTable(queryInsert, "root", "daq", true).then(() => {
        // Clear the form after successful submission
        document.getElementById("configForm").reset();

        // Refresh the table to display the new configuration
        GetConfigurations();
    }).catch(function (error) {
        console.error("Error adding configuration:", error);
    });
    

}

///////////////////////////////////
// functions below here not used //
///////////////////////////////////

let selectedConfigs = []; // Array to store selected device configs

// Function to fetch and display device configurations in the modal
function loadDeviceConfigurations() {
    const query = "SELECT device, version FROM device_config ORDER BY time DESC LIMIT 10";
    GetPSQL(query, "root", "daq", true).then(function (result) {
        const deviceConfigList = document.getElementById('deviceConfigList');
        deviceConfigList.innerHTML = ""; // Clear previous content
        //console.log("loadDeviceConfigurations result: ",result);
        
        result.forEach(row => {
            const configHTML = `
                <label>
                    <input type="checkbox" value='${JSON.stringify(row)}'>
                    ${row.device} (v${row.version})
                </label><br>
            `;
            deviceConfigList.innerHTML += configHTML;
        });
    }).catch(function (error) {
        console.error("Error fetching device configurations:", error);
    });
}

// Function to open the modal
function openModal() {
    const dialog = document.getElementById('deviceConfigModal');
    if (!dialog.showModal) {
        dialogPolyfill.registerDialog(dialog); // For browsers without native support
    }
    dialog.showModal();
}

// Function to close the modal
function closeModal() {
    const dialog = document.getElementById('deviceConfigModal');
    dialog.close();
}

// Function to add selected device configurations to the form
function addSelectedConfigs() {
    const checkboxes = document.querySelectorAll('#deviceConfigList input[type="checkbox"]:checked');
    selectedConfigs = Array.from(checkboxes).map(checkbox => JSON.parse(checkbox.value));

    // Display selected configs in the form
    const selectedDeviceConfigsDiv = document.getElementById('selectedDeviceConfigs');
    selectedDeviceConfigsDiv.innerHTML = selectedConfigs.map(config => `
        <p>${config.device} (v${config.version})</p>
    `).join('');

    // Close modal
    closeModal();
}
