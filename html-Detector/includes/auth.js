// auth.js
import { GetPSQLTable } from '/includes/functions.js';

export function authenticateUser() {
    let uname = document.getElementById('uname').value.trim();
    let password = document.getElementById('password').value.trim();

    if (!uname || !password) {
        alert("Both username and password are required");
        return;
    }

    let query = `SELECT username FROM users WHERE username = '${uname}' AND password = crypt('${password}', password);`

    GetPSQLTable(query, "root", "daq", true)
        .then((response) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(response, 'text/html');

            const usernameRow = doc.querySelector("tr:nth-child(2) td");

            if (usernameRow) {
                document.cookie = `user=${uname}`
                window.location.href = "/index.html";
            } else {
                alert("Invalid username or password");
            }
        })
        .catch((error) => {
            console.error("Error during authentication:", error);
            alert("An error occurred during authentication. Please try again.");
        });
}

document.getElementById("submit").onclick = function (event) {
    event.preventDefault();
    authenticateUser();
};

// Function to delete all cookies
function deleteAllCookies() {
    var cookies = document.cookie.split(";"); // Get all cookies as an array of strings

    // Iterate through each cookie
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("="); // Find the position of '=' in the cookie string
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie; // Get the cookie name

        // Set the expiration date of the cookie to a time in the past
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;";
    }
}

// Call the function to delete all cookies
deleteAllCookies();


forgotPasswordLink.addEventListener('click', function(event) {
    event.preventDefault();
    alert("Contact admin for help resetting your login credentials.");
});