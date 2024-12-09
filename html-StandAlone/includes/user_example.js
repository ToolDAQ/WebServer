var div = document.getElementById("test");   
var output = document.getElementById("output");

/*
//syncronous method
var table=GetSDTable("");
div.appendChild(table);
var ip = GetIP(table.rows[0].cells[3].innerText);
var port = GetPort(table.rows[0].cells[3].innerText);
div.innerHTML=Command(ip, port, "Status");
div.innerHTML=GetSlowCommands(ip, port);
*/

//asyncromnous method

GetSDTable("",true).then(function(table){
    
    div.appendChild(table);
    
    GetIP(table.rows[0].cells[3].innerText, true).then(function(ip){ 
	
	GetPort(table.rows[0].cells[3].innerText, true).then(function(port){
	    
            Command(ip, port, "Status", true).then(function(status){
		
		div.innerHTML=status;

		GetSlowCommands(ip, port, output, true).then(function(slowcontrols){
		    
		    div.innerHTML=slowcontrols;
		    
		    GetPSQLTable("select * from logging where source=\"my_service\"", "root", "daq", true).then(function(table){

			div.innerHTML=table;	
		    });

		});
	    });
	});
    });    
});

