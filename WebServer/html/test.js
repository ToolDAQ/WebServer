// Define the function that updates the table
function updateTable() {
    
    
    // Get a reference to the table
    var table = document.getElementById("table-container");
    var select = document.getElementById("UUID");    

   
    var csvFile = "./cgi-bin/tablecontent.cgi";
  
  
    // Use XMLHttpRequest to get the CSV content from the file
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
	if (this.readyState == 4 && this.status == 200) {
	    //	if (xhr.readyState == XMLHttpRequest.DONE) {
            // Parse the CSV content of the file
	    
	    // Delete all the rows from the table
	    while (table.rows.length > 1) {
		table.deleteRow(1);
	    }
	    
	    // Set the length of the <select> options to 0
	    select.options.length = 0;
	   

            var csvData = xhr.responseText;
            var rows = csvData.split("\n");
	    rows.map(function(row) {
		var newrow = table.insertRow(table.rows.length);
		newrow.innerHTML = row;
		
		// Get the number of rows in the table
		var rowCount = table.rows.length;
		
		// Get the last row in the table
		var lastRow = table.rows.item(rowCount-1);
		
		// Get the first cell in the last row
		var firstCell = lastRow.cells.item(0);
		
		// Get the text in the first cell
		var cellText = firstCell.innerText;
		
		select.options.add(new Option(cellText, lastRow.cells.item(1).innerText));

	    });
	    //            var htmlRows = rows.map(function(row) {
	    //		// Split the row into cells and create an HTML table row
	    //		var cells = row.split(",");
	    //		var htmlCells = cells.map(function(cell) {
	    //                  return "<td>" + cell + "</td>";
	    //		});
	    //		//update the table content	
	    //		var newrow = table.insertRow(1);
	    //		newrow.innerHTML = htmlCells.join("");
	    //           });
	    //	    
	}
    };
    xhr.open("GET", csvFile, true);
    xhr.send();
}

// Run the updateTable() function on startup
updateTable();

// Run the updateTable() function every minute
setInterval(updateTable, 60000);

// Run the updateTable() function on refresh press
var btn = document.getElementById('refresh');
btn.onclick = updateTable;
                  
