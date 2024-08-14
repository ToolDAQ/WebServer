var updating=false;
var log_output= document.getElementById("log_output");
var update = setInterval(GetLogFiles, 5000); // Run the GetLogFiles() function every minute

// Run the GetLogFiles function on startup
GetLogFiles();

function GetLogFiles(){ //command to retreild all log files

    if(updating) return;  
    updating=true;
    
    var csvFile = "./cgi-bin/logs2.cgi";
    
    // Use XMLHttpRequest to get the CSV content from the file
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {

	if (this.readyState == 4 && this.status == 200) {
	    log_output.innerHTML=xhr.responseText;	
	    }
	
	    updating=false;
	
    };
	
    xhr.open("GET", csvFile, true);
    xhr.send();

};
