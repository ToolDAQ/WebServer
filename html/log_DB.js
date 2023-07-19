var log_output=document.getElementById("log_output");
var update = setInterval(GetLogSources, 5000); // Run the GetLogSources() function every minute
var updating = false;

//load logs on startup
GetLogSources();

function GetLogSources(){ //command to get log files, first cehckes which devices exist then gets the last 15 messages for each

    if(updating) return;
    updating = true;
    
    var command="SELECT distinct(source) from logging"
    
    gettable(command).then(function(result){
	
	var table= document.createElement('table');
	table.innerHTML = result;
	var tmp=[];
	
	for( var i=1; i < table.rows.length; i++){
	    tmp[i-1] =table.rows[i].innerText.replace(/\s/g, '');
	}
	
	var counter=0;	
	
	tmp.map(function(row){
	    
	    var command= "select time, severity, message from logging where source=\"" + row + "\" order by time desc limit 15;";
	    gettable(command).then(function(result2){
		
		var pos=0;
		for( var k=0; k < tmp.length; k++){
		    if(row==tmp[k]) pos=k;
		}
		
		tmp[pos]="<a href=\"./cgi-bin/sqlquerystring.cgi?method=post&user=root&db=daq&command=select time, severity, message from logging where source=%22" + row + "%22 order by time desc;\">" + row + "</a><div id=" + row + " align='left' style=\"#ccc;font:12px/13px Georgia, Garamond, Serif;overflow:scroll;border:2px solid;padding:1%;height:200px\">";
		var output_table= document.createElement('table');
		output_table.innerHTML=result2;
		
		for( var j=1; j < output_table.rows.length; j++){    
		    tmp[pos]+="<b>" + output_table.rows[j].cells[0].innerText +" [" + output_table.rows[j].cells[1].innerText + "]:</b> " + output_table.rows[j].cells[2].innerText + "<br>"	
		}
		
		tmp[pos]+= "</div><p> <script type=\"text/javascript\"> var divid = document.getElementById(\""+ row + "\"); divid.scrollTop = divid.scrollHeight; </script>"
		counter++;
		
		if(counter==tmp.length){
		    
		    var html_insert="";
		    for( var l=0; l < tmp.length; l++){	
			html_insert+=tmp[l];
		    }
		    
		    log_output.innerHTML= html_insert;
		    updating=false;
	
		}	 	
	    });
	    
	});


    });	    
    
}
		   

function gettable(command){ //generic command to get table from SQL
    
    return new Promise(function(resolve, reject){
	var xhr = new XMLHttpRequest();
	
	var url = "./cgi-bin/sqlquery.cgi";
	
	var user ="root";
	var db="daq";
    
	// Set the request method to POST
	xhr.open("POST", url);
	
	// Set the request header to indicate that the request body contains form data
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	
	
	var dataString = "user=" + user + "&db=" + db + "&command=" + command;
	
	
	// Send the request
	xhr.send(dataString);
	xhr.onreadystatechange = function() {
	    
	    if (this.readyState == 4 && this.status == 200) {
		resolve(xhr.responseText);
	    }	       
	    //	    else reject(new Error('error loading'));
	}
    });
    
}

