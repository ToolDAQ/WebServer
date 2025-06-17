export function jsonToHtmlTable(jsonString) {
  let jsonData;
  try {
    jsonData = JSON.parse(jsonString);
  } catch (e) {
    return `<p>Error: Invalid JSON string.</p>`;
  }

  let htmlTable = '<table style="border:1px solid #b3adad; border-collapse:collapse;" contenteditable="true">';

  for (const key in jsonData) {
    if (jsonData.hasOwnProperty(key)) {
      htmlTable += '<tr>';
      htmlTable += `<td style="border:1px solid #b3adad; text-align:center; padding:5px; background: #ffffff; color: #313030;">&nbsp;${key}</td>`;
      htmlTable += `<td style="border:1px solid #b3adad; text-align:center; padding:5px; background: #ffffff; color: #313030;">${createRow(jsonData[key])}</td>`;
      htmlTable += '</tr>';
    }
  }

  htmlTable += '</table>';
  htmlTable += '<button onclick="rebuildJsonFromTable()">Save JSON</button>';
  return htmlTable;
}

function createRow(value) {
  if (Array.isArray(value)) {
    if (value.length > 0 && !Array.isArray(value[0])) {
      let row = '<table style="border:1px solid #b3adad; border-collapse:collapse;"><tbody><tr>';
      value.forEach(item => {
        row += `<td style="border:1px solid #b3adad; text-align:center; padding:5px; background: #ffffff; color: #313030;" contenteditable="true">${item}</td>`;
      });
      row += '</tr></tbody></table>';
      return row;
    }

    // Handle 2D array: each inner array becomes a new row
    else {
      let nestedTable = '<table style="border:1px solid #b3adad; border-collapse:collapse;"><tbody>';
      value.forEach(subArray => {
        nestedTable += '<tr>';
        subArray.forEach(item => {
          nestedTable += `<td style="border:1px solid #b3adad; text-align:center; padding:5px; background: #ffffff; color: #313030;" contenteditable="true">${item}</td>`;
        });
        nestedTable += '</tr>';
      });
      nestedTable += '</tbody></table>';
      return nestedTable;
    }
  } else if (typeof value === 'object' && value !== null) {
    let nestedTable = '<table style="border:1px solid #b3adad; border-collapse:collapse;"><tbody>';
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        nestedTable += `<tr><td style="border:1px solid #b3adad; text-align:center; padding:5px; background: #ffffff; color: #313030;">${key}</td>`;
        nestedTable += `<td style="border:1px solid #b3adad; text-align:center; padding:5px; background: #ffffff; color: #313030;" contenteditable="true">${createRow(value[key])}</td></tr>`;
      }
    }
    nestedTable += '</tbody></table>';
    return nestedTable;
  } else {
    return `<span contenteditable="true">${value === null ? 'null' : value.toString()}</span>`;
  }
}

export function rebuildJsonFromTable() {
  const parseTable = (table, parentKeys = new Set()) => {
    const rows = table.querySelectorAll('tr');
    const result = {}; // Object for key-value pairs
    const resultArray = []; // Array for list structures

    rows.forEach((row) => {
      const cells = Array.from(row.cells);

      if (cells.length === 2) {
        // Handle key-value pairs (e.g., { "key": "value" })
        const key = cells[0].textContent.trim();
        const value = parseCell(cells[1], parentKeys);

        // Only add to result if the key hasn't been processed at a higher level
        if (!parentKeys.has(key)) {
          result[key] = value;
        }
      } else if (cells.length > 1) { // Handle multi-cell rows as 2D arrays (array of arrays)
        // Check if we have only one row and multiple cells (1D array case)
        if (rows.length === 1) {
          // If there's only one row, treat it as a flat 1D array
          const rowArray = cells.map((cell) => parseCell(cell, parentKeys));
          resultArray.push(...rowArray); // Spread to flatten the array
        } else { // Otherwise, treat it as a 2D array
          const rowArray = cells.map((cell) => parseCell(cell, parentKeys));
          resultArray.push(rowArray);
        }
      }
    });

    // If we have key-value pairs, return as object, otherwise array
    return Object.keys(result).length > 0 ? result : resultArray;
  };

  const parseCell = (cell, parentKeys) => {
    const nestedTable = cell.querySelector('table');
    if (nestedTable) {
      // Recursively parse nested tables and track keys at the parent level
      const nestedData = parseTable(nestedTable, parentKeys);

      // Add the keys from the nested table to the parentKeys set
      const nestedKeys = Object.keys(nestedData);
      nestedKeys.forEach((key) => parentKeys.add(key));

      return nestedData;
    } else {
      // Return cell content
      const spanContent = cell.querySelector('span')?.textContent.trim() || cell.textContent.trim();

      // Check if the value is numeric
      if (!isNaN(spanContent) && spanContent !== '') {
        return parseFloat(spanContent); // Convert to number
      }

      // Check if it's a date (could be in various formats)
      if (Date.parse(spanContent)) {
        return new Date(spanContent).toISOString(); // Convert to ISO string
      }
      return spanContent;
    }
  };

  const table = document.querySelector('table[contenteditable="true"]');
  const data = parseTable(table);

  console.log(data);
  alert(JSON.stringify(data, null, 2));
}