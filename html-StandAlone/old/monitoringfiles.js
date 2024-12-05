var updating=false;
var plots_output= document.getElementById("plots_output");
var update = setInterval(GetPlotFiles, 5000); // Run the GetPlotFiles() function every minute

// Run the GetPlotFiles function on startup
GetPlotFiles();

function GetPlotFiles(){ //command to retreive all plot files

    if(updating) return;  
    updating=true;
    
    var csvFile = "./cgi-bin/monitoringplots.cgi";
    
    // Use XMLHttpRequest to get the CSV content from the file
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {

	if (this.readyState == 4 && this.status == 200) {
	    plots_output.innerHTML=xhr.responseText;	
	}
	
	updating=false;
	
    };
    
    xhr.open("GET", csvFile, true);
    xhr.send();
    
};
