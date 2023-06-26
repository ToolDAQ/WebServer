// Define the function that updates the table
function updateTable() {

    var btn = document.getElementById('refresh');
    btn.disabled=true;
    
    
    // Get a reference to the table
    var table = document.getElementById("table-container");
    var select = document.getElementById("ip");    

   
    var csvFile = "./cgi-bin/tablecontent3.cgi";
  
  
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
		var cells = row.split(",");
		
		if(cells.length == 5){
		
		var newrow = table.insertRow(table.rows.length);
		    var colour = "#00FFFF";
		    if( cells[4] == "Online" ) colour = "#FF00FF"
		    else if( cells[4] == "Waiting to Initialise ToolChain" ) colour="#FFFF00"
		    else {
			var substatus = cells[4].split(" ");
			for ( var i = 0 ; i < substatus.length ; i++) {
			    if ( substatus[i] == "running" ) colour="#00FF00"
			}
		    }
		    var cell1 = "<td bgcolor=\"" + colour + "\">[" + cells[0] + "]</td>";
		    var cell2 = "<td bgcolor=\"" + colour + "\">" + cells[1] + "</td>";
		    var cell3 = "<td style=\"display:none\" bgcolor=\"" + colour + "\">" + cells[2] + "</td>";
		    var cell4 = "<td bgcolor=\"" + colour + "\">" + cells[3] + "</td>";
		    var cell5 = "<td bgcolor=\"" + colour + "\">" + cells[4] + "</td>";
		    newrow.innerHTML = cell1 + cell2 + cell3 + cell4 + cell5;

		    select.options.add(new Option("[" + cells[0] + "]", cells[1] + ":" + cells[2]));	
		    
		    btn.disabled=false;
		}
	    });
	    
	}
    };
    xhr.open("GET", csvFile, true);
    xhr.send();
}

function sendcommand(){
    
    // Create a new XMLHttpRequest object
    var xhr = new XMLHttpRequest();
    
    // Set the URL of the webpage you want to send data to
    var url = "./cgi-bin/sendcommand2.cgi";
    
    var ip = document.getElementById("ip");
    var commands = document.getElementById("command");    
    var button = document.getElementById("Send Command")
    if(commands.value == ""){
	var cell = document.getElementById("output");
	cell.innerHTML = "No command given"
	return;
    }
    ip.disabled=true;
    commands.disabled=true;
    button.disabled=true;
    
    // Set the request method to POST
    xhr.open("POST", url);
    
    // Set the request header to indicate that the request body contains form data
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    
    // Create a string containing the form data to be sent in the request body
    //var data = "username=johndoe&password=secret";

    
    // Convert the object to a URL-encoded string
    var dataString = "ip=" + ip.value.split(":")[0] + "&port=" + ip.value.split(":")[1] + "&command=" + commands.value;
    
    
    // Send the request
    xhr.send(dataString);

    xhr.onreadystatechange = function() {
	var cell = document.getElementById("output");
	
	if (this.readyState == 4 && this.status == 200) {
	    
            var result = xhr.responseText.split("\n");
	    cell.innerHTML = result[1];
	    commands.value="";
	}
	else{
	    cell.innerHTML = "Error";
	    commands.value="";
	}
	
	ip.disabled=false;
	commands.disabled=false;
	button.disabled=false;
	
    };  
    
    
    updateTable();
    
}

// Run the updateTable() function on startup
updateTable();

// Run the updateTable() function every minute
var update = setInterval(updateTable, 60000);

// Run the updateTable() function on refresh press
var btn = document.getElementById('refresh');
btn.onclick = updateTable;
                  

// sends command on button click
var btn2 = document.getElementById('Send Command');
btn2.onclick = sendcommand;

//disables updates when interacting with command interface
var textBox = document.getElementById('command');
textBox.addEventListener('focus', function() {
    clearInterval(update);
});

textBox.addEventListener('blur', function() {
    update = setInterval(updateTable, 60000)
});

var dropdown = document.getElementById('ip');
dropdown.addEventListener('focus', function() {
    clearInterval(update);
});

dropdown.addEventListener('blur', function() {
    update = setInterval(updateTable, 60000)
});

btn2.addEventListener('focus', function() {
    clearInterval(update);
});

btn2.addEventListener('blur', function() {
    update = setInterval(updateTable, 60000)
});


