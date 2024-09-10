// html/Config/configuration.js
// Description: JavaScript for adding and displaying configurations.

// Event listener for DOMContentLoaded to ensure the page is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    // Fetch and display the existing configurations on page load
    GetConfigurations();
});

// Function to fetch and display existing configurations from the database
function GetConfigurations() {
    const query = "SELECT * FROM configurations ORDER BY time DESC LIMIT 10";
    GetPSQLTable(query, "root", "daq", true).then(function (result) {
        const configTable = document.getElementById('configTable');
        configTable.innerHTML = result;
    }).catch(function (error) {
        console.error("Error fetching configurations:", error);
    });
}

// Function to add a new configuration
function addConfiguration() {
    const name = document.getElementById("name").value;
    const description = document.getElementById("description").value;
    const author = document.getElementById("author").value;
	const data = document.getElementById("data").value;

	// Ensure data is in valid JSON format
	let parsedData;
    try {
        parsedData = JSON.parse(data);
    } catch (e) {
        alert("Invalid JSON format in data field.");
        return;
	}

	// First, fetch the highest version number for the given configuration name
    const queryGetVersion = `SELECT MAX(version) as max_version FROM configurations WHERE name = '${name}'`;

    GetPSQLTable(queryGetVersion, "root", "daq", true).then(function (result) {
        let version = 1; // Default version

        // Check if a version already exists, increment it
        if (result && result[0].max_version) {
            version = result[0].max_version + 1;
        }

        // SQL query to insert the new configuration with the new version
        const queryInsert = `
            INSERT INTO configurations (time, name, version, description, author, data)
            VALUES (now(), '${name}', ${version}, '${description}', '${author}', '${JSON.stringify(parsedData)}'::jsonb)
        `;

        // Execute query to insert the new configuration
        return GetPSQLTable(queryInsert, "root", "daq", true);

    }).then(() => {
        // Clear the form after successful submission
        document.getElementById("configForm").reset();

        // Refresh the table to display the new configuration
        GetConfigurations();
    }).catch(function (error) {
        console.error("Error adding configuration:", error);
    });
}
