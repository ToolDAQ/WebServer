import { dbJson } from '/includes/tooldaq.js';

if (document.readyState !== 'loading'){
	GetConfigurations();
} else {
	document.addEventListener("DOMContentLoaded", function () {
		GetConfigurations();
        GetAnotherTable();
	});
}

function GetConfigurations() {
  // SQL query to fetch data (replace with your actual query)
  const query = "SELECT * FROM configurations ORDER BY time DESC LIMIT 10";

  dbJson(query).then((data) => {
    console.log("Data"+data);
      if (data.length === 0) {
          tableContainer.innerHTML = '<p>No data found.</p>';
          return;
      }

      // Build HTML table
      let table = '<table border="1" style="width: 100%; border-collapse: collapse; text-align: left;">';
      table += '<thead><tr>';

      // Add table headers
      Object.keys(data[0]).forEach((key) => {
          table += `<th style="padding: 8px;">${key}</th>`;
      });
      table += '</tr></thead><tbody>';

      // Add table rows
      data.forEach((row) => {
        table += '<tr>';
        Object.values(row).forEach((value) => {
            if (typeof value === "object" && value !== null) {
                // Convert object (e.g., JSONB) to a readable string
                table += `<td style="padding: 8px;">${JSON.stringify(value)}</td>`;
            } else {
                table += `<td style="padding: 8px;">${value}</td>`;
            }
        });
        table += '</tr>';
    });

      table += '</tbody></table>';
      tableContainer.innerHTML = table;
  }).catch((error) => {
      console.error("Error fetching data:", error);
      tableContainer.innerHTML = '<p>Error loading data. Please try again later.</p>';
  });
}

function GetAnotherTable() {
  const query = "SELECT * FROM logging ORDER BY time DESC LIMIT 10";
  const anotherTableContainer = document.getElementById('anotherTableContainer');

  dbTable(query, true).then((result) => {
      anotherTableContainer.innerHTML = result;
      console.log("AnotherTableContainer"+result);
  }).catch((error) => {
      console.error("Error fetching data with dbTable:", error);
      anotherTableContainer.innerHTML = '<p>Error loading data. Please try again later.</p>';
  });
}
