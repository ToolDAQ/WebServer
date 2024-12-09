var tabbar=document.getElementById("tabbar");
tabbar.classList.add("mdl-layout__tab-bar"); 
tabbar.classList.add("mdl-js-ripple-effect");

var tab = document.createElement("div");
tab.classList.add("mdl-layout__tab");
tab.innerText = "Database";
tab.setAttribute('href', '/monitoring.html');
tab.addEventListener('click', function() {
    window.open('/monitoring.html', '_self');
});
tabbar.appendChild(tab);

var tab2 = document.createElement("div");
tab2.classList.add("mdl-layout__tab");
tab2.innerText = "Files";
tab2.setAttribute('href', '/monitoringfiles.html');
tab2.addEventListener('click', function() {
    window.open('/monitoringfiles.html', '_self');
});
tabbar.appendChild(tab2);
