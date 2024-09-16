// html/Config/configuration.js
// Description: JavaScript for adding and displaying configurations.

document.addEventListener("DOMContentLoaded", function () {
    GetConfigurations();

    loadDeviceConfigurations();

    const addDeviceConfigBtn = document.getElementById("addDeviceConfigBtn");
    addDeviceConfigBtn.addEventListener("click", function() {
        openModal(); // Open modal
        loadDeviceConfigurations(); // Fetch and display device configurations when modal opens
    });
});

// Function to fetch and display existing configurations from the database
function GetConfigurations() {
	const query = "SELECT * FROM configurations ORDER BY time DESC LIMIT 10";
	console.log("query"+query);
    GetPSQLTable(query, "root", "daq", true).then(function (result) {
		const configTable = document.getElementById('configTable');
		console.log("Configurations result"+result);
        configTable.innerHTML = result;
    }).catch(function (error) {
        console.error("Error fetching configurations:", error);
    });
}

// Function to add a new configuration
function addConfiguration() {
	const config_id = document.getElementById("id").value;
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

    // First, fetch the highest config_id for auto-increment
    const queryGetConfigId = `SELECT MAX(config_id) as max_config_id FROM configurations`;

    GetPSQLTable(queryGetConfigId, "root", "daq", true).then(function (resultConfigId) {
        // Get the current highest config_id
        const highestConfigId = resultConfigId[0].max_config_id || 0;  // Default to 0 if no config exists
        const newConfigId = highestConfigId + 1;

        // Now, fetch the highest version number for the given configuration name
        const queryGetVersion = `SELECT MAX(version) as max_version FROM configurations WHERE name = '${name}'`;

        GetPSQLTable(queryGetVersion, "root", "daq", true).then(function (resultVersion) {
            // Get the current highest version
            const highestVersion = resultVersion[0].max_version || 0;  // Default to 0 if no version exists
            const newVersion = highestVersion + 1;

            // Now, insert the new configuration with auto-incremented config_id and version
            const queryInsert = `
                INSERT INTO configurations (config_id, time, name, version, description, author, data)
                VALUES (${config_id}, now(), '${name}', ${newVersion}, '${description}', '${author}', '${data}'::jsonb)
            `;

            GetPSQLTable(queryInsert, "root", "daq", true).then(() => {
                // Clear the form after successful submission
                document.getElementById("configForm").reset();

                // Refresh the table to display the new configuration
                GetConfigurations();
            }).catch(function (error) {
                console.error("Error adding configuration:", error);
            });

        }).catch(function (error) {
            console.error("Error fetching version:", error);
        });

    }).catch(function (error) {
        console.error("Error fetching config_id:", error);
    });
}

// function addConfiguration() {
//     const name = document.getElementById("name").value;
//     const description = document.getElementById("description").value;
//     const author = document.getElementById("author").value;
// 	const data = document.getElementById("data").value;

// 	// Ensure data is in valid JSON format
// 	let parsedData;
//     try {
//         parsedData = JSON.parse(data);
//     } catch (e) {
//         alert("Invalid JSON format in data field.");
//         return;
// 	}

// 	// First, fetch the highest version number for the given configuration name and the max_config_id
// 	const queryGetMaxIds = `
//         WITH config_id_cte AS (
// 			SELECT MAX(config_id) as max_config_id FROM configurations
// 		),
// 		version_cte AS (
// 			SELECT MAX(version) as max_version FROM configurations WHERE name = '${name}'
// 		)
// 		SELECT
// 			config_id_cte.max_config_id,
// 			version_cte.max_version
// 		FROM
// 			config_id_cte, version_cte;
//     `;
// 	alert("queryGetMaxIds"+queryGetMaxIds);

//     GetPSQLTable(queryGetMaxIds, "root", "daq", true).then(function (result) {
//         let newConfigId = 1;  // Default config_id if no configurations exist
//         let version = 1;      // Default version if no configuration with the same name exists

//         // If configurations exist, increment the config_id and version appropriately
//         if (result && result[0].max_config_id) {
//             newConfigId = result[0].max_config_id + 1;
// 		}
// 		 alert("newConfigId"+newConfigId);
//         if (result && result[1].max_version) {
//             version = result[1].max_version + 1;
// 		}
// 		alert("version"+version);

//         // SQL query to insert the new configuration with the new version
//         const queryInsert = `
//             INSERT INTO configurations (config_id, time, name, version, description, author, data)
//             VALUES (${newConfigId}, now(), '${name}', ${version}, '${description}', '${author}', '${JSON.stringify(parsedData)}'::jsonb)
//         `;
// 		alert("queryInsert"+queryInsert);

//         // Execute query to insert the new configuration
//         return GetPSQLTable(queryInsert, "root", "daq", true);

//     }).then(() => {
//         // Clear the form after successful submission
//         document.getElementById("configForm").reset();

//         // Refresh the table to display the new configuration
//         GetConfigurations();
//     }).catch(function (error) {
//         console.error("Error adding configuration:", error);
//     });
// }

let selectedConfigs = []; // Array to store selected device configs

// Function to fetch and display device configurations in the modal
function loadDeviceConfigurations() {
    const query = "SELECT device, version FROM device_config ORDER BY time DESC LIMIT 10";
    GetPSQLTable(query, "root", "daq", true).then(function (result) {
        const deviceConfigList = document.getElementById('deviceConfigList');
        deviceConfigList.innerHTML = ""; // Clear previous content

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
