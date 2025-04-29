let utctime=document.getElementById("utctime");
let exptime=document.getElementById("exptime");
let user=document.getElementById("user");

function getTimeInTimezones() {
    // Get the current time in the user's timezone
    utctime.innerText = new Date().toLocaleTimeString(undefined, {
        timeZone: 'UTC'
    });

    // Get the time in the defined timezone
    exptime.innerText = new Date().toLocaleTimeString(undefined, {
        // FIXME this should be set to local timezone of the experiment
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

}

function getCookie(cookieName) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(cookieName + '=')) {
            return cookie.substring(cookieName.length + 1);
        }
    }
    return null; // Cookie not found
}


if(user != undefined){
	user.innerText=getCookie("user");
	getTimeInTimezones();
	setInterval(getTimeInTimezones, 1000); // 1000 milliseconds = 1 second
}
