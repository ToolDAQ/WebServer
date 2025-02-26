let pingInterval;

document.getElementById('pingButton').addEventListener('click', function () {
    const ip = document.getElementById('ipAddress').value.trim();

    if (!ip) {
        alert("Please enter a valid IP address");
        return;
    }

    document.getElementById('pingResult').style.display = 'block';
    document.getElementById('pingOutput').innerText = "Pinging...";

    document.getElementById('pingButton').disabled = true;
    document.getElementById('stopPingButton').style.display = 'inline-block';

    fetch(`/cgi-bin/ping_network.cgi?ip=${ip}`)
        .then(response => response.text())
        .then(data => {
            document.getElementById('pingOutput').innerText = data;
        })
        .catch(error => {
            document.getElementById('pingOutput').innerText = "Error: Could not reach the server.";
        });
});

document.getElementById('stopPingButton').addEventListener('click', function () {
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
                  <td>${device.name}</td>
                  <td>${device.os}</td>
                  <td>
                      <div class="action-buttons">
                          <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored ping-device" data-ip="${device.ip}">Ping Device</button>
                          <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent port-scan" data-ip="${device.ip}">Port Scan</button>
                      </div>
                      <div class="device-feedback" id="feedback-${device.ip}"></div>
                  </td>
              </tr>`;
                tableBody.innerHTML += row;
            });
            document.querySelectorAll('.ping-device').forEach(button => {
                button.addEventListener('click', handlePingDevice);
            });

            document.querySelectorAll('.port-scan').forEach(button => {
                button.addEventListener('click', handlePortScan);
            });
        })
        .catch(err => console.error("Error fetching data:", err));
}

function handlePingDevice(event) {
    const ip = event.target.getAttribute('data-ip');
    const feedbackDiv = document.getElementById(`feedback-${ip}`);
    feedbackDiv.innerHTML = 'Pinging device...';

    fetch(`/cgi-bin/ping_network.cgi?ip=${ip}`)
        .then(response => response.text())
        .then(data => {
            feedbackDiv.innerHTML = `<p>Ping Result:</p><pre>${data}</pre>`;
        })
        .catch(error => {
            feedbackDiv.innerHTML = 'Error: Could not reach the device.';
        });
}

function handlePortScan(event) {
    const ip = event.target.getAttribute('data-ip');
    const feedbackDiv = document.getElementById(`feedback-${ip}`);
    feedbackDiv.innerHTML = 'Scanning ports...';

    fetch(`/cgi-bin/scan_ports.cgi?ip=${ip}`)
        .then(response => response.json())
        .then(data => {
            console.log("Port scan results:", data);
            if (data.error) {
                feedbackDiv.innerHTML = `<p>Error: ${data.error}</p>`;
                return;
            }
            let ports = data.ports || [];
            feedbackDiv.innerHTML = `<p>Port Scan Results:</p><ul>`;
            if (ports.length === 0) {
                feedbackDiv.innerHTML += `<li>No open ports found.</li>`;
            } else {
                ports.forEach(port => {
                    feedbackDiv.innerHTML += `<li>Port ${port}: Open</li>`;
                });
            }
            feedbackDiv.innerHTML += `</ul>`;
        })
        .catch(error => {
            console.error("Error scanning ports:", error);
            feedbackDiv.innerHTML = 'Error: Could not scan ports.';
        });
}

setInterval(fetchNetworkData, 30000);
window.onload = fetchNetworkData;