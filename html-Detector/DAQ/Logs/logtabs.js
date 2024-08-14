var tabbar=document.getElementById("tabbar");
tabbar.classList.add("mdl-layout__tab-bar"); 
tabbar.classList.add("mdl-js-ripple-effect");

var tab = document.createElement("div");
tab.classList.add("mdl-layout__tab");
tab.innerText = "Log Files";
tab.setAttribute('href', '/DAQ/Logs/logs.html');
tab.addEventListener('click', function() {
  window.open('/DAQ/Logs/logs.html', '_self');
});
tabbar.appendChild(tab);

var tab2 = document.createElement("div");
tab2.classList.add("mdl-layout__tab");
tab2.innerText = "Database Logs";
tab2.setAttribute('href', '/DAQ/Logs/index.html');
tab2.addEventListener('click', function() {
  window.open('/DAQ/Logs/index.html', '_self');
});
tabbar.appendChild(tab2);

