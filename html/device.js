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

    status_div.innerHTML = result.innerHTML;
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

    logs.innerHTML = result;
    var table = logs.querySelector("table");
    table.style.width = '100%';
    const cell = table.rows[0].cells[2];
    cell.style.whiteSpace = 'normal';

});
}
