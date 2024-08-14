// https://github.com/root-project/jsroot/blob/master/docs/JSROOT.md

import { httpRequest, parse, draw, redraw, resize, toJSON, cleanup } from 'https://root.cern/js/latest/modules/main.mjs';

// get the rootplots dropdown box
var dropdownmenu = document.getElementById("rootplot_dropdown");

//update dropdown called on startup
updateplotdropdown();

/*
// read ROOT file
let filename = "https://root.cern/js/files/hsimple.root";
let file = await openFile(filename);
// get an object; this can be a histogram/graph, but could also be a TTree
let obj = await file.readObject("hpxpy;1");
*/

/*
// read JSON file
let obj = await httpRequest('https://jsroot.gsi.de/files/hpx.json', 'object');
*/

/*
// read local JSON variable
let obj = parse(root_json);
*/

/*
// draw the object, specifying div to populate
// for histograms/graphs, the last argument is the draw options
await draw("jsroot_div", obj, "colz");
// for a tree, this could be a Draw command (not sure exactly the format)
//await draw("jsroot_div", obj, "px:py::pz>5");

// or update the plot to account with a new / updated object
//redraw("jsroot_div", obj_updated, "colz");

// or just redraw the same object to account for resizing/layout change
//redraw("jsroot_div");

// one can specify the size, if desired
//resize("jsroot_div", { width: 500, height: 200 });
*/

/*
// to clear drawings from a div use
cleanup("jsroot_div");
*/

/*
// it is also possible to convert any (jsroot?) JavaScript object into ROOT JSON string, using toJSON() function.
import { toJSON, openFile } from 'jsroot';
import { writeFileSync } from 'fs';
let file = await openFile("https://root.cern/js/files/hsimple.root");
let obj = await file.readObject("hpx;1");
let json = await toJSON(obj);
writeFileSync("hpxpy.json", json);
// Such JSON string can of course be re-parsed by JSROOT later.
*/

//generic funcion for returning SQL table
function gettable(command){
	
	//console.log("jsroot.js gettable with query '",command,"'");
	
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
		
		//console.log("sending query '",dataString,"'");
		
		// Send the request
		xhr.send(dataString);
		
		xhr.onreadystatechange = function() {
			
			if (this.readyState == 4 && this.status == 200) {
			//console.log("good response: '",xhr.responseText,"'");
			resolve(xhr.responseText);
			}
	//		else reject(new Error('error loading'));
		}
	});
	
}

// populate a dropdown box with the set of available ROOT plots
function updateplotdropdown(){
	
	var command="SELECT distinct(name) from rootplots";
	
	gettable(command).then(function(result){
		
		//console.log("jsroot.js result from gettable with command '",command,"' was '",result,"'");
		
		// transfer result into a html element... do we need to do this?
		// it's effectively used to convert the result string into an array
		var tmp_tab = document.createElement("table");
		tmp_tab.innerHTML = result;
		//console.log("tmp_tab is ",tmp_tab,", inner html is ",tmp_tab.innerHTML);
		//console.log("tmp_tab rows is ",tmp_tab.rows);
		
		// loop over available plots and populate the drop-down selections
		for( var i=1; i < tmp_tab.rows.length; i++){
			//console.log("jsroot adding option '",tmp_tab.rows[i].innerText,"'");
			dropdownmenu.options.add(new Option(tmp_tab.rows[i].innerText, tmp_tab.rows[i].innerText));
		}
		
		// select none
		dropdownmenu.selectedIndex=-1;
		dropdownmenu.dispatchEvent(new Event("change"));
		
	});
	
}

// function to call when dropdown changes
dropdownmenu.addEventListener('change', function(){
	
	if(dropdownmenu.selectedIndex==-1) return;
	
	//console.log("user selected to show jsroot plot index ",rootplot_dropdown.selectedIndex);
	makejsrootplot();
	
});

//function to generate jsroot plot
async function makejsrootplot(){
	
	// Get the selected option
	if (rootplot_dropdown.options.length >0){
		
		var selectedOption = rootplot_dropdown.options[rootplot_dropdown.selectedIndex].value;
		//console.log("getting json for root plot '",selectedOption,"'");
		
		// i do not knwo why we need this but monitoring.js doesn't.
		selectedOption = selectedOption.trim();
		//console.log("trimmed version: '",selectedOption,"'");
		
		// TODO add support for version number selection
		var command = "select data, draw_options from rootplots where name='"
		           + selectedOption + "' order by time desc limit 1";
		
		gettable(command).then(async function(result){
			
			
			var tmp_tab = document.createElement("table");
			tmp_tab.innerHTML = result;
			//console.log("tmp_tab is ",tmp_tab,", inner html is ",tmp_tab.innerHTML);
			//console.log("tmp_tab rows is ",tmp_tab.rows);
			
			var data = tmp_tab.rows[1].cells[0].innerText;
			var drawoptions = tmp_tab.rows[1].cells[1].innerText;
			
			//console.log("data was '",data,"'");
			//console.log("draw_options was '",drawoptions,"'");
			let obj = parse(data);
			//console.log("obj is ",obj);
			
			// remove any existing plots - with calling this, plots will overlay (kinda like 'same')
			cleanup("jsroot_div");
			
			// draw
			await draw("jsroot_div", obj, drawoptions);
			
		}).catch(() => {
			document.getElementById('jsroot_div').innerHTML =
			    `"<h3>Can not get ${selectedOption} from the server</h3>`;
		});
		
	}
	
};


