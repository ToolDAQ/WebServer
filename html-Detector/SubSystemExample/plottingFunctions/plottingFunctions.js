import { dbJson, makeMonitoringPlot, getMonitoringPlot } from '/includes/tooldaq.js';

if (document.readyState !== 'loading') {
    initializePage();
} else {
    document.addEventListener("DOMContentLoaded", initializePage);
}

function initializePage() {
    initializeMakePlotSection();
    initializeGetPlotSection();
}

function initializeMakePlotSection() {
    const deviceSelect = document.getElementById('deviceSelect');
    const loadPlotButton = document.getElementById('loadPlotButton');
    const plotContainer = document.getElementById('plotContainer');
    plotContainer.style.height = '600px';

    if (!deviceSelect || !loadPlotButton || !plotContainer) {
        console.error('Required elements for makeMonitoringPlot section are not present in the DOM.');
        return;
    }

    // Fetch devices and populate the dropdown
    loadDevices(deviceSelect);

    // Add event listener to the "Load Plot" button
    loadPlotButton.addEventListener('click', () => {
        const selectedDevice = deviceSelect.value;

        if (!selectedDevice) {
            alert('Please select a device.');
            return;
        }

        plotContainer.innerHTML = '<p>Loading plot...</p>';

        // Call makeMonitoringPlot to display the plot
        makeMonitoringPlot(plotContainer, selectedDevice, { from: '2025-01-01T00:00:00Z' }, { title: 'Monitoring Plot' })
            .catch((error) => {
                console.error('Error in makeMonitoringPlot:', error);
                plotContainer.innerHTML = '<p>Error loading plot. Please try again later.</p>';
            });
    });
}

function initializeGetPlotSection() {
    const deviceSelect = document.getElementById('deviceSelectForData');
    const fetchDataButton = document.getElementById('fetchDataButton');
    const dataContainer = document.getElementById('dataContainer');
    const plotDataContainer = document.getElementById('plotDataContainer');
    plotDataContainer.style.height = '600px';

    if (!deviceSelect || !fetchDataButton || !dataContainer) {
        console.error('Required elements for getMonitoringPlot section are not present in the DOM.');
        return;
    }

    // Fetch devices and populate the dropdown
    loadDevices(deviceSelect);

    // Add event listener to the "Fetch Data" button
    fetchDataButton.addEventListener('click', () => {
        const selectedDevice = deviceSelect.value;

        if (!selectedDevice) {
            alert('Please select a device.');
            return;
        }

        dataContainer.innerHTML = '<p>Fetching data...</p>';
        plotDataContainer.innerHTML = '<p>Loading visualization...</p>';

        // Call getMonitoringPlot to fetch and display monitoring data
        getMonitoringPlot(selectedDevice, { from: '2025-01-01T00:00:00Z' })
            .then((plotData) => {
                // Display raw data
                renderPlotData(dataContainer, plotData);
                // Display plot
                renderPlotVisualization(plotDataContainer, plotData);
            })
            .catch((error) => {
              dataContainer.innerHTML = '<p>Error fetching data. Please try again later.</p>';
              plotDataContainer.innerHTML = '<p>Error loading visualization. Please try again later.</p>';
          });
    });
}

function loadDevices(dropdown) {
    const query = "SELECT DISTINCT(device) FROM monitoring"; // Query to fetch unique devices

    dbJson(query)
        .then((devices) => {
            console.log('Fetched devices:', devices);

            if (!Array.isArray(devices) || devices.length === 0) {
                dropdown.innerHTML = '<option value="">No devices available</option>';
                return;
            }

            // Populate dropdown with device options
            dropdown.innerHTML = devices.map(
                (device) => `<option value="${device.device}">${device.device}</option>`
            ).join('');
        })
        .catch((error) => {
            console.error('Error fetching devices:', error);
            dropdown.innerHTML = '<option value="">Error loading devices</option>';
        });
}

function renderPlotData(container, plotData) {
    // Render fetched data in the container as a JSON string
    container.innerHTML = `<pre>${JSON.stringify(plotData, null, 2)}</pre>`;
}

function renderPlotVisualization(container, plotData) {
  if (!Array.isArray(plotData)) {
      console.error('Invalid plot data:', plotData);
      container.innerHTML = '<p>Invalid plot data. Unable to visualize.</p>';
      return;
  }

  // Transform `plotData` into Plotly traces
  const traces = plotData.map(item => ({
      x: item.x,
      y: item.y,
      name: item.name,
      type: 'scatter', // Assuming a scatter plot; adjust as needed
      mode: 'lines+markers' // Adjust mode as needed (e.g., 'lines', 'markers')
  }));

  // Default layout configuration
  const layout = {
      title: 'Monitoring Plot',
      xaxis: { title: 'Time' },
      yaxis: { title: 'Value' },
      height: 600,
      margin: { t: 50, r: 50, b: 50, l: 50 }
  };

  // Render the plot using Plotly
  Plotly.newPlot(container, traces, layout)
      .catch((error) => {
          console.error("Error rendering plot:", error);
          container.innerHTML = '<p>Error rendering plot. Please try again later.</p>';
      });
}
