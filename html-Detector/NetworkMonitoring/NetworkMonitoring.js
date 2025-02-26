let pingInterval;

// Start the ping process
document.getElementById('pingButton').addEventListener('click', function() {
    const ip = document.getElementById('ipAddress').value.trim();

    if (!ip) {
        alert("Please enter a valid IP address");
        return;
    }

    // Display ping result area
    document.getElementById('pingResult').style.display = 'block';
    document.getElementById('pingOutput').innerText = "Pinging...";

    // Disable the Ping button and show Stop Ping button
    document.getElementById('pingButton').disabled = true;
    document.getElementById('stopPingButton').style.display = 'inline-block';

    // Start pinging the IP address
    pingInterval = setInterval(function() {
        fetch(`/cgi-bin/ping_network.cgi?ip=${ip}`)
            .then(response => response.text())
            .then(data => {
                document.getElementById('pingOutput').innerText = data;
            })
            .catch(error => {
                document.getElementById('pingOutput').innerText = "Error: Could not reach the server.";
            });
    }, 1000); // ping every 1 second
});

// Stop the ping process
document.getElementById('stopPingButton').addEventListener('click', function() {
    clearInterval(pingInterval);
    document.getElementById('pingButton').disabled = false;
    document.getElementById('stopPingButton').style.display = 'none';
    document.getElementById('pingOutput').innerText = "Ping stopped.";
});

function fetchNetworkData() {
  fetch('/cgi-bin/scan_network.cgi')
      .then(response => response.json())
      .then(data => {
        console.log("Data fetched:", data);
          let tableBody = document.getElementById("network-table-body");
          tableBody.innerHTML = "";
          data.forEach(device => {
              let row = `<tr>
                  <td>${device.ip}</td>
                  <td>${device.mac}</td>
                  <td>${device.name || 'Unknown'}</td>
                  <td>${device.os || 'Unknown'}</td>
              </tr>`;
              tableBody.innerHTML += row;
          });
      })
      .catch(err => console.error("Error fetching data:", err));
}

// setInterval(fetchNetworkData, 10000);
window.onload = fetchNetworkData;