var tabbar=document.getElementById("logtabbar");
tabbar.classList.add("mdl-layout__tab-bar"); 
tabbar.classList.add("mdl-js-ripple-effect");

var tab = document.createElement("div");
tab.classList.add("mdl-layout__tab");
tab.innerText = "Log Files";
tab.setAttribute('href', './logs.html');
tab.addEventListener('click', function() {
  window.open('./logs.html', '_self');
});
tabbar.appendChild(tab);

var tab2 = document.createElement("div");
tab2.classList.add("mdl-layout__tab");
tab2.innerText = "Database Logs";
tab2.setAttribute('href', './index.html');
tab2.addEventListener('click', function() {
  window.open('./index.html', '_self');
});
tabbar.appendChild(tab2);

