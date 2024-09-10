// html/DeviceConfig/deviceConfig.js
// Description: JavaScript for the device configuration page.

// Initial load of device configs
document.addEventListener("DOMContentLoaded", function () {
    // Fetch and display the existing device configurations on page load
    GetDeviceConfigs();
});

// Function to fetch and display device configurations from the database
function GetDeviceConfigs() {
    const query = "SELECT * FROM device_config ORDER BY time DESC LIMIT 10";
    GetPSQLTable(query, "root", "daq", true).then(function (result) {
        const deviceConfigOutput = document.getElementById("deviceConfigOutput");
        deviceConfigOutput.innerHTML = result;
    }).catch(function (error) {
        console.error("Error fetching device configurations:", error);
    });
}

// Function to add a new device configuration
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

    // First, fetch the highest version number for the given device
    const queryGetVersion = `SELECT MAX(version) as max_version FROM device_config WHERE device = '${device}'`;

    GetPSQLTable(queryGetVersion, "root", "daq", true).then(function (result) {
        // Get the current highest version
        const highestVersion = result[0].max_version || 0;  // Default to 0 if no version exists
        const newVersion = highestVersion + 1;
        // Now, insert the new device configuration with the auto-incremented version
        const query = `
            INSERT INTO device_config (time, device, version, author, description, data)
            VALUES (now(), '${device}', ${newVersion}, '${author}', '${description}', '${data}'::jsonb)
        `;

        GetPSQLTable(query, "root", "daq", true).then(() => {
            // Refresh the table after adding a new config
            GetDeviceConfigs();
        }).catch(function (error) {
            console.error("Error adding device configuration:", error);
        });
        }).catch(function (error) {
        console.error("Error fetching version:", error);
    });
}
