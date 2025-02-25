"use strict;"
import { GetPSQLTable } from "/includes/functions.js";
import { dbJson } from '/includes/tooldaq.js';

if (document.readyState !== 'loading'){
	Init();
} else {
	document.addEventListener("DOMContentLoaded", function () {
		Init();
	});
}

let autoRefreshInterval = null;

function Init(){
	DisplayZeroStateMessage();
	GetLogItems();
	document.getElementById("fetch-logs-button").addEventListener("click", FetchLogs);
	CreateRefreshAllButton();

	const autoRefreshCheckbox = document.getElementById("auto-refresh-checkbox");
	autoRefreshCheckbox.addEventListener("change", function () {
		const intervalContainer = document.getElementById("auto-refresh-container");
		intervalContainer.style.display = this.checked ? "block" : "none";

		if (this.checked) {
				StartAutoRefresh();
		} else {
				StopAutoRefresh();
		}
	});
	const intervalInput = document.getElementById("log-update-interval");
	intervalInput.addEventListener("input", function () {
		if (autoRefreshCheckbox.checked) {
				StartAutoRefresh();
		}
	});
}

function StartAutoRefresh() {
    StopAutoRefresh(); // Clear any existing interval
    const intervalInput = document.getElementById("log-update-interval");
    const feedback = document.getElementById("refresh-feedback");
		let refreshInterval = parseInt(intervalInput.value, 10);

    if (isNaN(refreshInterval) || refreshInterval < 15) {
        refreshInterval = 120;
        feedback.style.color = "#d32f2f";
        feedback.textContent = "⚠️ Minimum refresh interval should be a number greater 15 seconds! Using default (120 seconds).";
    } else {
        feedback.style.color = "#00796b";
        feedback.textContent = `✅ Auto-refresh set to ${refreshInterval} seconds.`;
    }

    autoRefreshInterval = setInterval(() => {
        RefreshAllLogs();
    }, refreshInterval * 1000);
}

function StopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

function CreateRefreshAllButton() {
	const refreshAllButton = document.createElement("button");
	refreshAllButton.id = "refresh-all-button";
	refreshAllButton.textContent = "Refresh All";
	refreshAllButton.classList.add("mdl-button", "mdl-js-button", "mdl-button--raised");
	refreshAllButton.style.backgroundColor = "#4CAF50"; // Green color
	refreshAllButton.style.marginLeft = "10px";
	refreshAllButton.style.display = "none";

	refreshAllButton.addEventListener("click", RefreshAllLogs);

	const fetchLogsButton = document.getElementById("fetch-logs-button");
	fetchLogsButton.insertAdjacentElement("afterend", refreshAllButton);
}

function SetupAutocomplete() {
	const input = document.getElementById("log-device-input");
	const suggestionBox = document.getElementById("device-suggestions");

	input.addEventListener("input", function () {
		const searchText = input.value.toLowerCase();
		suggestionBox.innerHTML = "";

		if (!window.deviceList || window.deviceList.length === 0 || !searchText) return;

		const filteredDevices = window.deviceList.filter(device =>
			device.toLowerCase().includes(searchText)
		);

		filteredDevices.forEach(device => {
			const suggestion = document.createElement("div");
			suggestion.textContent = device;
			suggestion.addEventListener("click", function () {
				input.value = device;
				suggestionBox.innerHTML = "";
			});
			suggestionBox.appendChild(suggestion);
		});
	});

	// Hide suggestions on click outside
	document.addEventListener("click", function (e) {
		if (!input.contains(e.target) && !suggestionBox.contains(e.target)) {
			suggestionBox.innerHTML = "";
		}
	});
}

function DisplayZeroStateMessage() {
	const logContainer = document.getElementById("logs-container");
	const zeroStateDiv = document.createElement("div");
		zeroStateDiv.id = "zero-div";
    zeroStateDiv.classList.add("mdl-shadow--2dp");
    zeroStateDiv.style.marginTop = "20px";
    zeroStateDiv.style.padding = "20px";
    zeroStateDiv.style.minHeight = "100px";
    zeroStateDiv.style.backgroundColor = "#f1f1f1";

    zeroStateDiv.innerHTML = `
			<p style="text-align: center; font-size: 16px; color: #666;">
				No logs to display yet.<br>
				Select a device and specify the number of logs you want to see, then click <strong>Show Logs</strong> to get started.
				<br> You can repeat this process for different devices.
			</p>
    `;

    logContainer.appendChild(zeroStateDiv);
}

function GetLogItems() {
	const query = "SELECT distinct(device) from logging";
	dbJson(query).then(function (result) {
		window.deviceList = result.map(item => item.device) || [];
		SetupAutocomplete();
	}).catch(function (error) {
		console.error("Error fetching log items:", error);
		alert("There was an error fetching the log items.");
		window.deviceList = [];
	});
}

function FetchLogs() {
	const device = document.getElementById("log-device-input").value.trim();
	let log_line_count = parseInt(document.getElementById("log-line-count").value, 10);

	if (!device || !log_line_count || isNaN(log_line_count) || log_line_count <= 0) {
		alert("Please select a valid device and specify a valid number of log lines.");
		return;
	}

	const query = `SELECT time, severity, message FROM logging WHERE device = '${device}' ORDER BY time DESC LIMIT ${log_line_count}`;

	dbJson(query).then(function (result) {
		const logContainer = document.getElementById("logs-container");
		const zeroStateDiv = document.getElementById("zero-div");
		if (zeroStateDiv) logContainer.removeChild(zeroStateDiv);

		let log_display = document.getElementById(`log-${device}`);
		if (!log_display) {
			log_display = document.createElement("div");
			log_display.id = `log-${device}`;
			log_display.classList.add("mdl-shadow--2dp");
			log_display.style.marginTop = "20px";
			log_display.style.padding = "20px";
			log_display.style.minHeight = "100px";
			log_display.style.overflowY = "auto";
			log_display.style.maxHeight = "300px";

			const controlsContainer = document.createElement("div");
			controlsContainer.style.display = "flex";
			controlsContainer.style.justifyContent = "space-between";
			controlsContainer.style.marginBottom = "10px";

			const logCountInput = document.createElement("input");
			logCountInput.type = "number";
			logCountInput.min = "1";
			logCountInput.value = log_line_count;
			logCountInput.style.width = "60px";
			logCountInput.style.marginRight = "10px";
			logCountInput.style.padding = "5px";
			logCountInput.classList.add("log-count-input");

			const refreshButton = document.createElement("button");
			refreshButton.textContent = "Refresh";
			refreshButton.classList.add("mdl-button", "mdl-js-button", "mdl-button--raised", "refresh-button");
			refreshButton.style.backgroundColor = "#2196F3";
			refreshButton.addEventListener("click", function () {
				// RefreshLogs(device, log_line_count);
				const newLogCount = parseInt(logCountInput.value, 10);
				if (!isNaN(newLogCount) && newLogCount > 0) {
					RefreshLogs(device, newLogCount);
				} else {
					alert("Please enter a valid number of log lines.");
				}
			});

			const closeButton = document.createElement("button");
			closeButton.textContent = "Close";
			closeButton.classList.add("mdl-button", "mdl-js-button", "mdl-button--raised", "mdl-button--colored");
			closeButton.style.float = "right";
			closeButton.addEventListener("click", function () {
					log_display.remove();
					CheckLogDivs();
			});
			const exportButton = AddExportButton(log_display, device);
			controlsContainer.appendChild(logCountInput);
			controlsContainer.appendChild(refreshButton);
			controlsContainer.appendChild(closeButton);
			log_display.appendChild(controlsContainer);

			const header = document.createElement("h5");
			header.textContent = `Logs for device: ${device}`;
			header.style.marginBottom = "10px";
			log_display.appendChild(header);
			logContainer.appendChild(log_display);
		}
		const log_display_content = log_display.querySelectorAll("p");
		const existingLogs = Array.from(log_display_content).map(p => p.textContent);

		log_display.querySelectorAll("p").forEach(p => p.remove());
		result.forEach(log => {
			const log_entry = document.createElement("p");
			log_entry.textContent = `${log.time} | Severity: ${log.severity} | Message: ${log.message}`;
			log_display.appendChild(log_entry);
		});

		CheckLogDivs();

		log_display.scrollTop = log_display.scrollHeight;
	}).catch(function (error) {
			console.error("Error fetching logs:", error);
			alert("There was an error fetching the logs.");
	});
}

function RefreshLogs(device, log_line_count) {
	const log_display = document.getElementById(`log-${device}`);
	if (!log_display) return;

	const refreshButton = log_display.querySelector(".refresh-button");
	refreshButton.disabled = true;
	refreshButton.textContent = "Refreshing...";

	const query = `SELECT time, severity, message FROM logging WHERE device = '${device}' ORDER BY time DESC LIMIT ${log_line_count}`;

	dbJson(query).then(function (result) {
		let log_display = document.getElementById(`log-${device}`);

		if (!log_display) return;

		const log_display_content = log_display.querySelectorAll("p");
		const existingLogs = Array.from(log_display_content).map(p => p.textContent);

		let newLogs = [];
		result.forEach(log => {
			const logText = `${log.time} | Severity: ${log.severity} | Message: ${log.message}`;
			if (!existingLogs.includes(logText)) {
				newLogs.push(logText);
			}
		});

		if (newLogs.length > 0) {
			newLogs.forEach(logText => {
				const log_entry = document.createElement("p");
				log_entry.textContent = logText;
				log_display.appendChild(log_entry);
			});
			CheckLogDivs();
			log_display.scrollTop = log_display.scrollHeight;
		}
	}).catch(function (error) {
		console.error("Error refreshing logs:", error);
		alert("There was an error refreshing the logs.");
	}).finally(() => {
		refreshButton.disabled = false;
		refreshButton.textContent = "Refresh";
	});
}

function RefreshAllLogs() {
	const logContainers = document.querySelectorAll("[id^='log-']");
	logContainers.forEach(logDiv => {
		const device = logDiv.id.replace("log-", "");
		const logCountInput = logDiv.querySelector(".log-count-input");
		if (!logCountInput) return;
		const logCount = parseInt(logCountInput.value, 10) || 10;

		RefreshLogs(device, logCount);
	});
}

function CheckLogDivs() {
	const logContainers = document.querySelectorAll("[id^='log-']");
	const refreshAllButton = document.getElementById("refresh-all-button");
	refreshAllButton.style.display = logContainers.length > 0 ? "inline-block" : "none";
}

function AddExportButton(log_display, device) {
	const exportButton = document.createElement("button");
	exportButton.textContent = "Export Logs";
	exportButton.classList.add("mdl-button", "mdl-js-button", "mdl-button--raised", "mdl-button--colored");
	exportButton.style.marginLeft = "10px";
	exportButton.addEventListener("click", function () {
		ExportLogs(device, log_display);
	});

	log_display.appendChild(exportButton);
}

function ExportLogs(device, log_display) {
	const logs = Array.from(log_display.querySelectorAll("p")).map(p => p.textContent).join("\n");
	if (!logs) {
		alert("No logs to export.");
		return;
	}

	const blob = new Blob([logs], { type: "text/plain" });
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = `${device}-logs.txt`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
