// html/runConfig/runConfig.js
// Description: JavaScript for the configuration page.

import { GetPSQLTable } from '/includes/functions.js';
import { dbJson } from '/includes/tooldaq.js';

let editor;
let viewerEditor;
let currentViewedDevice = null;
let currentViewedVersion = null;

if (document.readyState !== 'loading') {
    Init();
} else {
    document.addEventListener("DOMContentLoaded", function () {
        Init();
    });
}

function Init() {
    GetConfigs();
    GetDeviceConfigs();

    editor = ace.edit("jsonEditor");
    editor.setTheme("ace/theme/github");
    editor.session.setMode("ace/mode/json");
    editor.setValue(JSON.stringify({
        "devices": ["device_a", "device_b"]
    }, null, 2), -1);

    setupSearch();

    document.querySelectorAll("button").forEach(btn => {
        // if (btn.innerText === "Save DeviceConfig") btn.addEventListener("click", saveDeviceConfig);
        if (btn.innerText === "View") btn.addEventListener("click", showJsonTable);
    });

    const dialog = document.getElementById("jsonImportModal");

    document.querySelector("#importPasteBtn").addEventListener("click", () => {
        try {
            const jsonData = JSON.parse(modalEditor.getValue());
            let editor = ace.edit("deviceJsonViewer");
            editor.setValue(JSON.stringify(jsonData, null, 2), -1);
            // syncDeviceCheckboxes(jsonData.devices || []);
            dialog.close();
        } catch (err) {
            alert("Invalid JSON input.");
        }
    });

    document.querySelector("#jsonImportModal .close").addEventListener("click", () => {
        dialog.close();
    });
    document.getElementById("addConfigBtn").addEventListener("click", saveConfig);
    document.getElementById("showJsonTableBtn").addEventListener("click", showJsonTable);
    document.getElementById("jsonImportBtn").addEventListener("click", openJsonImportModal);
    document.getElementById("saveDeviceConfigBtn").addEventListener("click", saveDeviceConfig);


    setupDeviceSearchViewer();
}

function GetDeviceConfigs() {
    import('/includes/tooldaq.js').then(({ dbJson }) => {
        const query = "SELECT device, version FROM device_config ORDER BY time DESC LIMIT 100";
        dbJson(query)
            .then(result => {
                const deviceListContainer = document.getElementById("deviceList");
                deviceListContainer.innerHTML = ""; // Clear old content

                result.forEach((row, index) => {
                    const deviceId = `device_${index}`;
                    const label = document.createElement("label");
                    label.className = "mdl-checkbox mdl-js-checkbox";
                    label.setAttribute("for", deviceId);

                    const input = document.createElement("input");
                    input.type = "checkbox";
                    input.id = deviceId;
                    input.className = "mdl-checkbox__input";
                    input.setAttribute("data-device", row.device);
                    input.setAttribute("data-version", row.version);

                    // input.addEventListener("change", updateDevicesInJsonEditor);
                    input.addEventListener("change", () => {
                        // updateDevicesInJsonEditor();
                        updateDeviceConfigInJsonEditor();
                        updateDeviceSearchBox();
                    });

                    const span = document.createElement("span");
                    span.className = "mdl-checkbox__label";
                    span.innerText = `${row.device} (v${row.version})`;

                    label.appendChild(input);
                    label.appendChild(span);

                    deviceListContainer.appendChild(label);
                    deviceListContainer.appendChild(document.createElement("br"));
                });

                if (window.componentHandler) {
                    componentHandler.upgradeDom();
                }
            })
            .catch(error => {
                console.error("Error fetching device configurations:", error);
            });
    });
}

function GetConfigs() {
    const query = "SELECT * FROM configurations ORDER BY time DESC LIMIT 10";
    GetPSQLTable(query, "root", "daq", true).then(function (result) {
        const deviceConfigOutput = document.getElementById("deviceConfigOutput");
        deviceConfigOutput.innerHTML = result;
    }).catch(function (error) {
        console.error("Error fetching device configurations:", error);
    });
}

function saveConfig() {
    const name = document.getElementById("configName").value.trim();
    const version = parseInt(document.getElementById("version").value) || 0;
    const description = document.getElementById("configDescription").value.trim();
    const author = document.getElementById("configAuthor")?.value || "anonymous";
    const editorContent = ace.edit("jsonEditor").getValue();

    let data;
    try {
        data = JSON.stringify(JSON.parse(editorContent));
    } catch (e) {
        alert("Please fix the JSON before saving.");
        return;
    }

    const queryInsert = `
        INSERT INTO configurations (time, name, version, description, author, data)
        VALUES (now(), '${name}', (SELECT COALESCE(MAX(version)+1,0) FROM configurations WHERE name='${name}'),
                '${description}', '${author}', '${data}'::jsonb);
      `;

    GetPSQLTable(queryInsert, "root", "daq", true).then(() => {
        alert("Configuration saved successfully.");
        clearForm();
        document.querySelectorAll(".mdl-checkbox__input").forEach(cb => cb.checked = false);
        // GetConfigurations?.();
    }).catch(error => {
        console.error("Error adding configuration:", error);
        alert("Failed to save configuration.");
    });
};

function clearForm() {
    document.getElementById("configName").value = "";
    document.getElementById("version").value = "";
    document.getElementById("configDescription").value = "";
    ace.edit("jsonEditor").setValue(JSON.stringify({ devices: [] }, null, 2), -1);
    document.querySelectorAll(".mdl-checkbox__input").forEach(cb => cb.checked = false);
}

export function setupSearch() {
    const searchBox = document.getElementById("searchBox");
    searchBox.addEventListener("input", () => {
        const term = searchBox.value;
        editor.find(term, {
            backwards: false,
            wrap: true,
            caseSensitive: false,
            wholeWord: false,
            regExp: false
        });
    });
}

let modalEditor;

// Open the import modal
export function openJsonImportModal() {
    const dialog = document.getElementById("jsonImportModal");

    if (!modalEditor) {
        modalEditor = ace.edit("modalEditor");
        modalEditor.setTheme("ace/theme/github");
        modalEditor.session.setMode("ace/mode/json");
        modalEditor.setValue("{\n  \"devices\": []\n}", -1);
    }

    if (!dialog.showModal) {
        dialogPolyfill.registerDialog(dialog); // for browsers without native <dialog>
    }

    dialog.showModal();
}

function saveDeviceConfig() {
    if (!currentViewedDevice || currentViewedVersion == null) {
        alert("Please select a device first.");
        return;
    }

    let updatedJson;
    try {
        updatedJson = JSON.stringify(JSON.parse(viewerEditor.getValue()));
    } catch (e) {
        alert("Invalid JSON. Please fix the errors before saving.");
        return;
    }

    const query = `
        UPDATE device_config
        SET data = '${updatedJson}'::jsonb,
            time = now()
        WHERE device = '${currentViewedDevice}' AND version = ${currentViewedVersion};
    `;

    import('/includes/tooldaq.js').then(({ dbJson }) => {
        dbJson(query).then(() => {
            alert(`Device config for ${currentViewedDevice} v${currentViewedVersion} saved successfully.`);
        }).catch(err => {
            console.error("Error saving device config:", err);
            alert("Failed to save device configuration.");
        });
    });
}

function updateDevicesInJsonEditor() {
    try {
        const current = JSON.parse(editor.getValue());
        const selected = Array.from(document.querySelectorAll(".mdl-checkbox__input:checked"))
            .map(input => input.getAttribute("data-device"));
        current.devices = selected;
        editor.setValue(JSON.stringify(current, null, 2), -1);
    } catch (e) {
        console.warn("Invalid JSON in editor; cannot update devices.");
    }
}

function updateDeviceConfigInJsonEditor() {
    try {
        const editor = ace.edit("deviceJsonViewer");
        const current = JSON.parse(editor.getValue());
        // const selected = Array.from(document.querySelectorAll(".mdl-checkbox__input:checked"))
        //     .map(input => input.getAttribute("data-device"));
        // current.devices = selected;
        editor.setValue(JSON.stringify(current, null, 2), -1);
    } catch (e) {
        console.warn("Invalid JSON in editor; cannot update devices.");
    }
}


function showJsonTable() {
    import('/includes/jsontotable.js').then(({ jsonToHtmlTable }) => {
        const editor = ace.edit("deviceJsonViewer");
        const rawJson = editor.getValue();
        const tableHTML = jsonToHtmlTable(rawJson);
        document.getElementById("jsonTableOutput").innerHTML = tableHTML;
    }
    ).catch((error) => {
        console.error("Error loading jsontotable.js:", error);
    });
}

const deviceOptionMap = new Map();
// Populate search box with selected devices
function updateDeviceSearchBox() {
    const selectedDevices = Array.from(document.querySelectorAll(".mdl-checkbox__input:checked"))
        .map(input => ({
            device: input.getAttribute("data-device"),
            version: input.getAttribute("data-version")
        }));

    const datalist = document.getElementById("deviceSuggestions");
    datalist.innerHTML = "";
    deviceOptionMap.clear();

    selectedDevices.forEach(({ device, version }) => {
        const displayText = `${device} (v${version})`;

        const option = document.createElement("option");
        option.value = displayText;
        datalist.appendChild(option);

        // Store mapping
        deviceOptionMap.set(displayText, { device, version });
    });
}

function setupDeviceSearchViewer() {
    let viewerEditor = ace.edit("deviceJsonViewer");
    // viewerEditor = ace.edit("deviceJsonViewer");
    viewerEditor.setTheme("ace/theme/chrome");
    viewerEditor.session.setMode("ace/mode/json");
    viewerEditor.setReadOnly(true);
    viewerEditor.setValue("// Select a device above to view its config", -1);

    const searchBox = document.getElementById("deviceSearchBox");
    searchBox.addEventListener("change", () => {
        const selectedText = searchBox.value;
        const match = deviceOptionMap.get(selectedText);

        if (!match) {
            viewerEditor.setValue("// No matching device selected", -1);
            return;
        }

        const { device, version } = match;

        const query = `SELECT data FROM device_config WHERE device='${device}' AND version=${version} LIMIT 1`;

        dbJson(query).then(result => {
            const configData = result?.[0]?.data;
            if (configData) {
                viewerEditor.setValue(JSON.stringify(configData, null, 2), -1);
            } else {
                viewerEditor.setValue("// No data found for selected device", -1);
            }
        }).catch(err => {
            console.error("Device config fetch error:", err);
            viewerEditor.setValue("// Error loading data", -1);
        });
    });

    currentViewedDevice = device;
    currentViewedVersion = version;
}

function addConfiguration() {
    const name = document.getElementById("name").value;
    const description = document.getElementById("description").value;
    const author = document.getElementById("author").value;
    const data = document.getElementById("data").value;

    // Ensure data is in JSON format
    try {
        JSON.parse(data);
    } catch (e) {
        alert("Invalid JSON format in data field.");
        return;
    }

    const queryInsert = `
        INSERT INTO configurations (time, name, version, description, author, data)
        VALUES ( now(), '${name}', (select COALESCE(MAX(version)+1,0) FROM configurations WHERE name='${name}'),
                 '${description}', '${author}', '${data}'::jsonb)
    `;

    GetPSQLTable(queryInsert, "root", "daq", true).then(() => {
        // Clear the form after successful submission
        document.getElementById("configForm").reset();

        // Refresh the table to display the new configuration
        GetConfigurations();
    }).catch(function (error) {
        console.error("Error adding configuration:", error);
    });


}
