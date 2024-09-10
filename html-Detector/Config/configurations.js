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
	const version = 1;

	// Ensure data is in valid JSON format
	let parsedData;
    try {
        parsedData = JSON.parse(data);
    } catch (e) {
        alert("Invalid JSON format in data field.");
        return;
	}

	// First, fetch the highest version number for the given device
    // const queryGetVersion = `SELECT MAX(version) as max_version FROM configurations WHERE name = '${name}'`;

    // SQL query to insert new configuration into the database
    const query = `
        INSERT INTO configurations (time, name, version, description, author, data)
        VALUES (now(), '${name}', '${version}', '${description}', '${author}', '${JSON.stringify(parsedData)}'::jsonb)
    `;

    // Execute query to insert the new configuration
    GetPSQLTable(query, "root", "daq", true).then(() => {
        // Clear the form after successful submission
        document.getElementById("configForm").reset();

        // Refresh the table to display the new configuration
        GetConfigurations();
    }).catch(function (error) {
        console.error("Error adding configuration:", error);
    });
}
