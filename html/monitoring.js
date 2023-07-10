var last;
var updateinterval;
var output = document.getElementById("output");
var tableselect = document.getElementById("tableselect");
var data =[];
var select = document.querySelector('select');
var graphDiv = document.getElementById("graph"); 
var updating=false;;	    

//update dropdown called on startup
updatedropdown();

function updatedropdown(){ //function for updating dropdown box with monitoring soruces

    //var xhr = new XMLHttpRequest();
    
    //var url = "./cgi-bin/sqltable.cgi";
    
    //var user ="root";
    //var db="daq";
    var command="SELECT distinct(source) from monitoring"
    
    // Set the request method to POST
    //xhr.open("POST", url);
    
    // Set the request header to indicate that the request body contains form data
    //xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    
    
    //var dataString = "user=" + user + "&db=" + db + "&command=" + command;
    
    
    // Send the request
    //xhr.send(dataString);
    
    
    
    //xhr.onreadystatechange = function() {
    //	if (this.readyState == 4 && this.status == 200) {
    
    gettable(command).then(function(result){
	
	output.innerHTML = result;
	var table = document.getElementById("table");
	
	for( var i=1; i < table.rows.length; i++){    
	    tableselect.options.add(new Option( table.rows[i].innerText, table.rows[i].innerText));
	}

	tableselect.selectedIndex=-1;	
	output.innerHTML = "";
	tableselect.dispatchEvent(new Event("change"));
   
    });	    
    
}

	   
function gettable(command){ //generic funcion for returning SQL table
    
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

select.addEventListener('change', function(){ //actions to take when drobdown changes
 
    if(tableselect.selectedIndex==-1) return;
    makeplot();
    updateinterval=setInterval(updateplot, 2000);

});


function makeplot(){ //function to generate plotly plot

    clearInterval(updateinterval);
          
    
    // Get the selected option
    if (select.options.length >0){
	var selectedOption = select.options[select.selectedIndex];
	var command = "select '*' from monitoring where source=\""+ selectedOption.value + "\" order by time asc";
	
	gettable(command).then(function(result){
	    
	    output.innerHTML=result;
	    var table = document.getElementById("table");
	    table.style.display = "none";
	    var xdata= new Map();
	    var ydata= new Map();
	    
	    for( var i=1; i< table.rows.length; i++){
		
		var jsondata = JSON.parse(table.rows[i].cells[2].innerText);
		
		for (let key in jsondata) {
		    
		    //		    if( i == 1 ){
		    if(!xdata.has(key)){
			xdata.set(key,[table.rows[i].cells[0].innerText.slice(0,-3)]);
			ydata.set(key,[jsondata[key]]);
		    }
		    else{
			xdata.get(key).push(table.rows[i].cells[0].innerText.slice(0,-3));
			ydata.get(key).push(jsondata[key]);
			
		    }
		}
	    }
	    
	    data = [];
	    for(let [key, value] of xdata){
		
		data.push({
		    name: selectedOption.value + ":" +key,
		    mode: 'lines',
		    x: value,
		    y: ydata.get(key)
		});
		
	    }
	    
	    var layout = {
		title: 'Monitor Time series with range slider and selectors',          
		xaxis: {
		    rangeselector: selectorOptions,
		    rangeslider: {}
		}
	    };
	    
	    while(!document.getElementById("same").checked && graphDiv.data != undefined && graphDiv.data.length >0)
	    {
		Plotly.deleteTraces(graphDiv, 0);
		//   Plotly.deleteTraces(graphDiv, [0]);
	    }    	
	    //Plotly.deleteTraces('graph', 0);
	    Plotly.plot(graphDiv, data, layout);	    
	    
	});
	// Perform an action with the selected option
	//console.log('You selected: ' + selectedOption.value);
    }
};


function updateplot(){ //fucntion to update plot
    if(updating) return; 
    else{
	updating=true;
    // Get the selected option
    if (select.options.length >0){
	var selectedOption = select.options[select.selectedIndex];

      last=data[0].x[data[0].x.length-1];

//	var command = "select '*' from monitoring where source=\""+ selectedOption.value + "\" and time>to_timestamp(" + ((last.valueOf())/1000.0) + ");  ";

var command = "select '*' from monitoring where source=\""+ selectedOption.value + "\" and time>\"" + last.valueOf() + "\" order by time asc;  ";
	
	gettable(command).then(function(result){

          last=data[0].x[data[0].x.length-1];
    
	    output.innerHTML=result;
	    var table = document.getElementById("table");
	    table.style.display = "none";
	    var xdata= new Map();
	    var ydata= new Map();
	    
	    for( var i=1; i< table.rows.length; i++){
		
		var jsondata = JSON.parse(table.rows[i].cells[2].innerText);
		
		for (let key in jsondata) {
		    
		    //		    if( i == 1 ){
		    if(!xdata.has(key)){
			xdata.set(key,[table.rows[i].cells[0].innerText.slice(0,-3)]);
			ydata.set(key,[jsondata[key]]);
		    }
		    else{
			    xdata.get(key).push(table.rows[i].cells[0].innerText.slice(0,-3));
			    ydata.get(key).push(jsondata[key]);
		
		    }
		}
	    }
	    for(let [key, value] of xdata){
		
		for( var i=0; i< data.length; i++){
		    if(data[i].name == selectedOption.value + ":" +key){ 
			data[i].x=data[i].x.concat(value);
			data[i].y=data[i].y.concat(ydata.get(key));
		    }
		}
		
	    }
	    
	    var layout = {
		title: 'Monitor Time series with range slider and selectors',          
		xaxis: {
		    rangeselector: selectorOptions,
		    rangeslider: {}
		}
	    };
	    
	    
//	    while(!document.getElementById("same").checked && graphDiv.data != undefined && graphDiv.data.length >0)
		//	    {
//		Plotly.deleteTraces(graphDiv, 0);
		//   Plotly.deleteTraces(graphDiv, [0]);
		//	    }    	
		Plotly.redraw(graphDiv,data, layout);	
	    //	    Plotly.plot(graphDiv, data, layout);	    
	    updating=false;
	});
	// Perform an action with the selected option
	//console.log('You selected: ' + selectedOption.value);
    }

    
    }
};


var selectorOptions = { //plot options definitions
    buttons: [ {
        step: 'hour',
        stepmode: 'backward',
        count: 1,
        label: '1hr'
    }, {
        step: 'hour',
        stepmode: 'backward',
        count: 3,
        label: '3hr'
    }, {
        step: 'hour',
        stepmode: 'backward',
        count: 6,
        label: '6hr'
    }, {
        step: 'hour',
        stepmode: 'backward',
        count: 12,
        label: '12hr'
    }, {
        step: 'day',
        stepmode: 'backward',
        count: 1,
        label: '1d'
    }, {
        step: 'day',
        stepmode: 'backward',
        count: 3,
        label: '3d'
    }, {
        step: 'week',
        stepmode: 'backward',
        count: 1,
        label: '1w'
    }, {
        step: 'week',
        stepmode: 'backward',
        count: 2,
        label: '2w'
    }, {
        step: 'month',
        stepmode: 'backward',
        count: 1,
        label: '1m'
    }, {
        step: 'month',
        stepmode: 'backward',
        count: 6,
        label: '6m'
    }, {
        step: 'year',
        stepmode: 'todate',
        count: 1,
        label: 'YTD'
    }, {
        step: 'year',
        stepmode: 'backward',
        count: 1,
        label: '1y'
    }, {
        step: 'all'
    }],
};
