// html/runConfig/runConfig.js
// Description: JavaScript for the run configuration page.

import { GetPSQLTable } from '/includes/functions.js';
import { dbJson, dataTable } from '/includes/tooldaq.js';

let deviceEditor;
let runConfigEditor;
let modalEditor;

let deviceOptionMap = new Map();
let configOptionMap = new Map();
let selectedConfig = null;
let allDeviceData = [];

if (document.readyState !== 'loading') {
    Init();
} else {
    document.addEventListener("DOMContentLoaded", Init);
}

function Init() {
    GetConfigs();
    setupEditors();
    setupEventListeners();
    loadDeviceList();
    loadConfigOptions();
}

function setupEditors() {
    deviceEditor = ace.edit("deviceJsonViewer");
    deviceEditor.setTheme("ace/theme/chrome");
    deviceEditor.session.setMode("ace/mode/json");
    deviceEditor.setReadOnly(false);
    deviceEditor.setValue("// Select a device", -1);

    runConfigEditor = ace.edit("jsonEditor");
    runConfigEditor.setTheme("ace/theme/chrome");
    runConfigEditor.session.setMode("ace/mode/json");
    runConfigEditor.setValue(JSON.stringify({}, null, 2), -1);

    modalEditor = ace.edit("modalEditor");
    modalEditor.setTheme("ace/theme/github");
    modalEditor.session.setMode("ace/mode/json");
}

function setupEventListeners() {
    document.getElementById("saveDeviceConfigBtn").addEventListener("click", saveDeviceConfig);
    document.getElementById("addConfigBtn").addEventListener("click", saveRunConfig);
    // document.getElementById("jsonImportRunBtn").addEventListener("click", () => openJsonImportModal("run"));
    // document.getElementById("jsonImportDeviceBtn").addEventListener("click", () => openJsonImportModal("device"));
    document.getElementById("importPasteBtn").addEventListener("click", importJsonFromModal);
    document.getElementById("showJsonTableBtn").addEventListener("click", showJsonTable);

    document.getElementById("deviceSearchBox").addEventListener("change", handleDeviceSearchSelection);
    document.getElementById("configSearchBox").addEventListener("change", handleConfigSearchSelection);
}

function loadDeviceList() {
    const query = "SELECT device, version FROM device_config ORDER BY time DESC";
    dbJson(query).then(result => {
        allDeviceData = result;
        renderDeviceList("");
    });

    document.getElementById("deviceFilterInput").addEventListener("input", (e) => {
        renderDeviceList(e.target.value.trim().toLowerCase());
    });
}

function renderDeviceList(filterText) {
    const deviceListContainer = document.getElementById("deviceList");
    const deviceSuggestions = document.getElementById("deviceSuggestions");

    deviceListContainer.innerHTML = "";
    deviceSuggestions.innerHTML = "";
    deviceOptionMap.clear();

    const groupedDevices = {};

    allDeviceData.forEach(row => {
        const deviceName = row.device;
        if (filterText && !deviceName.toLowerCase().includes(filterText)) return;

        if (!groupedDevices[deviceName]) {
            groupedDevices[deviceName] = [];
        }
        if (!groupedDevices[deviceName].includes(row.version)) {
            groupedDevices[deviceName].push(row.version);
        }
    });

    Object.entries(groupedDevices).forEach(([device, versions], index) => {
        const checkboxId = `device_cb_${index}`;
        const selectId = `device_select_${index}`;

        const label = document.createElement("label");
        label.className = "mdl-checkbox mdl-js-checkbox";
        label.setAttribute("for", checkboxId);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = checkboxId;
        checkbox.className = "mdl-checkbox__input";
        checkbox.setAttribute("data-device", device);
        checkbox.addEventListener("change", updateDevicesInRunConfig);

        const span = document.createElement("span");
        span.className = "mdl-checkbox__label";
        span.innerText = device + " ";

        const select = document.createElement("select");
        select.id = selectId;
        select.setAttribute("data-device", device);
        select.className = "mdl-select__input";
        select.addEventListener("change", updateDevicesInRunConfig);

        versions.sort((a, b) => b - a).forEach(version => {
            const option = document.createElement("option");
            option.value = version;
            option.text = `v${version}`;
            select.appendChild(option);
        });

        label.appendChild(checkbox);
        label.appendChild(span);
        label.appendChild(select);

        deviceListContainer.appendChild(label);
        deviceListContainer.appendChild(document.createElement("br"));

        // For search/autocomplete box
        versions.forEach(version => {
            const option = document.createElement("option");
            option.value = `${device} (v${version})`;
            deviceSuggestions.appendChild(option);
            deviceOptionMap.set(option.value, { device, version });
        });
    });

    if (window.componentHandler) {
        componentHandler.upgradeDom();
    }
}

function loadConfigOptions() {
    const query = "SELECT config_id, name, version, description, author FROM configurations ORDER BY time DESC";
    dbJson(query).then(result => {
        const configList = document.getElementById("configSuggestions");
        configList.innerHTML = "";
        configOptionMap.clear();

        result.forEach(row => {
            const option = document.createElement("option");
            option.value = `${row.name} (v${row.version})`;
            configList.appendChild(option);

            configOptionMap.set(option.value, row);
        });
    });
}

function handleConfigSearchSelection() {
    const selectedText = document.getElementById("configSearchBox").value;
    const match = configOptionMap.get(selectedText);

    if (!match) {
        selectedConfig = null;
        return;
    }

    const query = `SELECT data FROM configurations WHERE name='${match.name}' AND version=${match.version} LIMIT 1`;
    dbJson(query).then(result => {
        const configData = result?.[0]?.data;
        if (configData) {
            runConfigEditor.setValue(JSON.stringify(configData, null, 2), -1);
            document.getElementById("runNo").value = match.config_id;
            document.getElementById("configName").value = match.name;
            document.getElementById("version").value = match.version;
            document.getElementById("configDescription").value = match.description || "";
            selectedConfig = match;
        }
    });
}

function handleDeviceSearchSelection() {
    const selectedText = document.getElementById("deviceSearchBox").value;
    const match = deviceOptionMap.get(selectedText);

    if (!match) {
        deviceEditor.setValue("// No matching device selected", -1);
        return;
    }

    const query = `SELECT data FROM device_config WHERE device='${match.device}' AND version=${match.version} LIMIT 1`;
    dbJson(query).then(result => {
        const configData = result?.[0]?.data;
        if (configData) {
            deviceEditor.setValue(JSON.stringify(configData, null, 2), -1);
        } else {
            deviceEditor.setValue("// No data found for selected device", -1);
        }
    }).catch(err => {
        console.error("Device config fetch error:", err);
        deviceEditor.setValue("// Error loading data", -1);
    });
}

function updateDevicesInDeviceEditor() {
    try {
        const current = JSON.parse(editor.getValue());

        const selectedInputs = Array.from(document.querySelectorAll(".mdl-checkbox__input:checked"));
        const selectedDevices = selectedInputs.map(input => input.getAttribute("data-device"));

        current.devices = selectedDevices;
        deviceEditor.setValue(JSON.stringify(current, null, 2), -1);

        updateDeviceSuggestions(selectedInputs);

    } catch (e) {
        console.warn("Invalid JSON in editor; cannot update devices.");
    }
}

function updateDeviceSuggestions(selectedInputs) {
    const deviceSuggestions = document.getElementById("deviceSuggestions");
    deviceSuggestions.innerHTML = ""; // Clear old options

    selectedInputs.forEach(input => {
        const device = input.getAttribute("data-device");
        const version = input.getAttribute("data-version");
        const displayText = `${device} (v${version})`;

        const option = document.createElement("option");
        option.value = displayText;
        deviceSuggestions.appendChild(option);
    });
}

function updateDevicesInRunConfig() {
    let currentConfig = {};
    try {
        currentConfig = JSON.parse(runConfigEditor.getValue());
    } catch {
        currentConfig = {};
    }

    const checkboxes = document.querySelectorAll(".mdl-checkbox__input");
    const updatedConfig = { ...currentConfig };

    checkboxes.forEach(checkbox => {
        const device = checkbox.getAttribute("data-device");
        const select = checkbox.parentElement.querySelector("select");

        if (checkbox.checked) {
            const version = parseInt(select.value, 10);
            updatedConfig[device] = version;
        } else {
            if (updatedConfig.hasOwnProperty(device)) {
                delete updatedConfig[device];
            }
        }
    });

    runConfigEditor.setValue(JSON.stringify(updatedConfig, null, 2), -1);
}

function saveRunConfig() {
    const name = document.getElementById("configName").value.trim();
    const description = document.getElementById("configDescription").value.trim();
    const author = document.getElementById("user")?.innerText || "anonymous";

    if (!name) {
        alert("Config Name is required.");
        return;
    }

    let newJsonData;
    try {
        newJsonData = JSON.stringify(JSON.parse(runConfigEditor.getValue()));
    } catch (e) {
        alert("Fix the JSON format before saving.");
        return;
    }

    // If existing config loaded, compare to see if changes occurred
    if (selectedConfig) {
        const isSameName = name === selectedConfig.name;
        const query = `SELECT data FROM configurations WHERE name='${selectedConfig.name}' AND version=${selectedConfig.version} LIMIT 1`;
        dbJson(query).then(result => {
            const existingData = result?.[0]?.data;
            const isSameJson = JSON.stringify(existingData, null, 2).trim() === JSON.stringify(JSON.parse(newJsonData), null, 2).trim();
            if (isSameName && isSameJson) {
                alert("No changes detected. Nothing was saved.");
                return;
            }
            saveRunConfigToDb(name, description, author, newJsonData);
        });
    } else {
        saveRunConfigToDb(name, description, author, newJsonData);
    }
}

function saveRunConfigToDb(name, description, author, jsonData) {
    if (!confirm("Save this configuration as a new version?")) return;

    const insertQuery = `
        INSERT INTO configurations (time, name, version, description, author, data)
        VALUES (now(), '${name}', (SELECT COALESCE(MAX(version) + 1, 0) FROM configurations WHERE name='${name}'), '${description}', '${author}', '${jsonData}'::jsonb);
    `;

    GetPSQLTable(insertQuery, "root", "daq", true).then(() => {
        alert(`Configuration '${name}' saved as new version.`);
        clearForm();
        loadConfigOptions();
    }).catch(error => {
        console.error("Save config error:", error);
        alert("Failed to save configuration.");
    });
}

function saveDeviceConfig() {
    const selectedText = document.getElementById("deviceSearchBox").value;
    const match = deviceOptionMap.get(selectedText);

    if (!match) {
        alert("No valid device selected to save.");
        return;
    }

    const { device, version } = match;
    const newContent = deviceEditor.getValue();

    const fetchQuery = `SELECT data FROM device_config WHERE device='${device}' AND version=${version} LIMIT 1`;
    dbJson(fetchQuery).then(result => {
        const savedData = JSON.stringify(result[0].data, null, 2);

        if (savedData.trim() === newContent.trim()) {
            alert("No changes detected. Nothing was saved.");
            return;
        }

        if (!confirm(`Save as a new version of ${device}?`)) return;

        const insertQuery = `
            INSERT INTO device_config (time, device, version, author, description, data)
            VALUES (
                now(),
                '${device}',
                (SELECT COALESCE(MAX(version),0)+1 FROM device_config WHERE device='${device}'),
                'user',
                'New version created by editing',
                '${newContent}'::jsonb
            );
        `;

        GetPSQLTable(insertQuery, "root", "daq", true).then(() => {
            alert(`New version of ${device} saved successfully.`);
            loadDeviceList();
        }).catch(err => {
            console.error("Failed to save device config:", err);
            alert("Error saving device configuration.");
        });
    }).catch(err => {
        console.error("Error fetching original device config:", err);
        alert("Error loading original data for comparison.");
    });
}

function openJsonImportModal(target) {
    const dialog = document.getElementById("jsonImportModal");
    dialog.dataset.target = target;
    modalEditor.setValue("{\n  \"devices\": []\n}", -1);

    if (!dialog.showModal) {
        dialogPolyfill.registerDialog(dialog);
    }
    dialog.showModal();
}

function importJsonFromModal() {
    try {
        const jsonData = JSON.parse(modalEditor.getValue());
        const target = document.getElementById("jsonImportModal").dataset.target;

        if (target === "run") {
            runConfigEditor.setValue(JSON.stringify(jsonData, null, 2), -1);
        } else {
            deviceEditor.setValue(JSON.stringify(jsonData, null, 2), -1);
        }
        document.getElementById("jsonImportModal").close();
    } catch (err) {
        alert("Invalid JSON input.");
    }
}

function showJsonTable() {
    import('/includes/jsontotable.js').then(({ jsonToHtmlTable }) => {
        const rawJson = deviceEditor.getValue();
        const tableHTML = jsonToHtmlTable(rawJson);
        document.getElementById("jsonTableOutput").innerHTML = tableHTML;
    }).catch(error => {
        console.error("Error loading jsontotable:", error);
    });
}

function clearForm() {
    document.getElementById("configName").value = "";
    document.getElementById("version").value = "";
    document.getElementById("configDescription").value = "";
    runConfigEditor.setValue(JSON.stringify({}, null, 2), -1);
}
function GetConfigs() {
    const query = "SELECT * FROM configurations ORDER BY time DESC LIMIT 10";
    dataTable(query, "deviceConfigOutput");
}
