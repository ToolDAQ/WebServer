function jsonToHtmlTable(jsonString) {
  // Parse the input JSON string
  let jsonData;
  try {
    jsonData = JSON.parse(jsonString);
  } catch (e) {
    return `<p>Error: Invalid JSON string.</p>`;
  }

  // Helper function to create a table row
  function createRow(cells, isHeader = false) {
    let row = '<tr>';
    cells.forEach(cell => {
      row += isHeader ? `<th>${cell}</th>` : `<td>${cell}</td>`;
    });
    row += '</tr>';
    return row;
  }

  // Recursive function to handle arrays and objects
  function processValue(value) {
    if (Array.isArray(value)) {
      // If the value is an array, recursively process each element
      let table = '<table border="1">';
      value.forEach((item, index) => {
        if (typeof item === 'object') {
          table += createRow([`Item ${index + 1}`]) + processValue(item);
        } else {
          table += createRow([`Item ${index + 1}`, processValue(item)]);
        }
      });
      table += '</table>';
      return table;
    } else if (typeof value === 'object' && value !== null) {
      // If the value is an object, create a table for its key-value pairs
      let table = '<table border="1">';
      let headers = Object.keys(value);
      table += createRow(headers, true); // Add headers
      let row = headers.map(key => processValue(value[key])); // Add values
      table += createRow(row);
      table += '</table>';
      return table;
    } else {
      // For other types (strings, numbers, booleans, null), return the value as a string
      return value === null ? 'null' : value.toString();
    }
  }

  // Start processing the JSON data
  let htmlTable = '<table border="1">';
  if (Array.isArray(jsonData)) {
    jsonData.forEach(item => {
      htmlTable += processValue(item);
    });
  } else if (typeof jsonData === 'object') {
    htmlTable += processValue(jsonData);
  }
  htmlTable += '</table>';

  return htmlTable;
}

