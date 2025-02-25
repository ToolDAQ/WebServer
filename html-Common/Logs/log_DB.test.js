/**
 * @jest-environment jsdom
 */
import { ExportLogs, AddExportButton, CheckLogDivs } from "../log_DB.js";

// Mocking document.body to simulate a DOM environment
beforeEach(() => {
    document.body.innerHTML = `
        <div id="logs-container"></div>
        <button id="fetch-logs-button">Fetch Logs</button>
    `;
});

// Test for AddExportButton
test("AddExportButton should add an export button to the log display div", () => {
    const logDiv = document.createElement("div");
    logDiv.id = "log-device123";
    AddExportButton(logDiv, "device123");

    const exportButton = logDiv.querySelector("button");
    expect(exportButton).not.toBeNull();
    expect(exportButton.textContent).toBe("Export Logs");
});

// Test for ExportLogs
test("ExportLogs should create a downloadable log file", () => {
    const logDiv = document.createElement("div");
    logDiv.innerHTML = `<p>Log entry 1</p><p>Log entry 2</p>`;

    // Mock the createObjectURL method
    global.URL.createObjectURL = jest.fn(() => "mock-url");

    // Mock document.createElement to track download link
    document.createElement = jest.fn(() => {
        return { href: "", download: "", click: jest.fn() };
    });

    ExportLogs("device123", logDiv);

    const link = document.createElement.mock.results[0].value;
    expect(link.download).toBe("device123-logs.txt");
    expect(link.href).toBe("mock-url");
    expect(link.click).toHaveBeenCalled();
});

// Test for CheckLogDivs
test("CheckLogDivs should show or hide the refresh-all button based on log presence", () => {
    document.body.innerHTML += `<button id="refresh-all-button" style="display:none;"></button>`;

    const logContainer = document.createElement("div");
    logContainer.id = "log-device123";
    document.body.appendChild(logContainer);

    CheckLogDivs();
    expect(document.getElementById("refresh-all-button").style.display).toBe("inline-block");

    logContainer.remove();
    CheckLogDivs();
    expect(document.getElementById("refresh-all-button").style.display).toBe("none");
});
