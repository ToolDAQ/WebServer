var div = document.getElementById("test");   

var table=GetSDTable("");
div.appendChild(table);
var ip = GetIP(table.rows[0].cells[3].innerText);
var port =GetPort(table.rows[0].cells[3].innerText);
div.innerHTML=Command(ip, port, "Status", false);
GetSlowCommands(div, ip, port);



/*
GetSDTable2("").then(function(result){
    div.appendChild(result);
    //    var ip = result.rows[0].cells[1].innerText;
    //   var port = result.rows[0].cells[2].innerText;
    var ip = GetIP(result.rows[0].cells[3].innerText).then( 
    var port =GetPort(result.rows[0].cells[3].innerText).then(
    //var ip="172.17.0.2";
    //var port="24011";
    GetSlowCommands(div, ip, port)));

});
*/
