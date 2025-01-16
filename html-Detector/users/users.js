// Import necessary functions from functions.js
import { GetPSQLTable, HashPassword } from '/includes/functions.js';

// Initialize the page once it's loaded
if (document.readyState !== 'loading') {
    Init();
} else {
    document.addEventListener("DOMContentLoaded", function () {
        Init();
    });
}

function Init() {
    GetUsers();
    const elems = document.querySelectorAll('.modal');
    M.Modal.init(elems);

    document.getElementById("addUserForm").addEventListener("submit", addUser);
}

function GetUsers() {
    const query = "SELECT user_id, username, permissions FROM users ORDER BY username";
    GetPSQLTable(query, "root", "daq", true).then(function (result) {
        const usersTable = document.getElementById("usersTable");
        usersTable.innerHTML = result;
    }).catch(function (error) {
        console.error("Error fetching users:", error);
    });
}

function addUser(event) {
  event.preventDefault();

  const username = document.getElementById("newUsername").value;
  const password = document.getElementById("newPassword").value;
  const permissions = document.getElementById("newPermissions").value;

  HashPassword(password).then(hashedPassword => {
    const query = `
        INSERT INTO users (username, password, permissions)
        VALUES ('${username}', '${hashedPassword}', '${permissions}');
    `;

    GetPSQLTable(query, "root", "daq", true).then(() => {
        GetUsers();

        document.getElementById("addUserForm").reset();
        const modal = M.Modal.getInstance(document.getElementById('userModal'));
        modal.close();
    }).catch(function (error) {
        console.error("Error adding new user:", error);
        alert("Error adding new user.");
    });
  }).catch(function (error) {
     console.error("Error hashing password:", error);
     alert("Error hashing password.");
  });
}
