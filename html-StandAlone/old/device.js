const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const name = urlParams.get('name');
const ip = urlParams.get('ip');
const port = urlParams.get('port')

var status_div = document.getElementById('status');
var commands_div = document.getElementById('commands');
var commands_output_div = document.getElementById('commands_output');
var plots_div = document.getElementById('plots');
var logs_div = document.getElementById('logs');

var sqlquery
var replot = false

GetData();
var updateinterval = setInterval(GetData, 5000);


function GetData(){
    GetSDTable(name, true).then(function(result){
	
	
	const titleRow = document.createElement("tr");
	
	// Array of title names
	const titles = ["", "IP", "Port", "Name", "Status"];
	
	// Create and append the title cells
	for (const title of titles) {
	    const titleCell = document.createElement("td");
	    titleCell.textContent = title;
	    titleRow.appendChild(titleCell);
	}
	
	// Add the title row to the table
	result.insertBefore(titleRow, result.firstChild);
	
	// Center the table within its container
	result.style.margin = "auto";
	result.style.border = "1px solid black"; // Add a border of 1px solid black
	result.style.borderCollapse = "collapse"; // Optional: Collapses the border into a single border
	result.style.backgroundColor = "lightblue"; // Sets the background color of the table
	
	const cells = result.getElementsByTagName("td");
	for (const cell of cells) {
	    cell.style.border = "1px solid black"; // Add a border to each cell
	    cell.style.padding = "8px"; // Optional: Add some padding to improve readability
	}
	status_div.innerHTML = "";
	status_div.appendChild(result);
	// Optional: Add some styles to the table container
	status_div.style.width = "80%"; // Set the container width to 80% of its parent element
	status_div.style.padding = "20px"; // Add some padding for better presentation

    });
    
    
    GetSlowCommands(ip, port, commands_output_div, true).then(function(result){
	
	commands_div.innerHTML = result;
	
    });
    
    sqlquery = "select * from monitoring where source=\"" + name + "\" order by time asc";
    var data = [];
    
    
    MakePlotDataFromPSQL(sqlquery, "root", "daq", data, true).then(function(result){
	
	MakePlot(plots_div, data, layout_timeseries_slider_selector, replot);
	
	replot=true;
    });
    
    
    
    sqlquery = "select time, severity, message from logging where source=\"" + name + "\" order by time desc";
    
    GetPSQLTable(sqlquery , "root", "daq", true).then(function(result){
	
	
	//	result.style.margin = "auto";
	var table=document.createElement("table");
	table.innerHTML=result;
	

	logs.innerHTML="";
	
	for (const row of table.rows) {
	    // Loop through cells of each row
	    if(row.rowIndex==0) continue;
	    logs.innerHTML += "<b>" + row.cells[0].innerText + " [" + row.cells[1].innerText + "]: </b>" +row.cells[2].innerText +"<br>";
	    
	}
	
	logs.style.whiteSpace = "normal";
	logs.style.width = (window.innerWidth *0.8)+"px"; // Set the container width to 80% of its parent element
        logs.style.padding = "20px"; // Add some padding for better presentation
	
    });
}
