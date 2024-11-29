// Initialize global variables
let last;
let updateinterval;
let data = [];
let updating = false;

const output = document.getElementById("output");
const tableselect = document.getElementById("tableselect");
const select = document.querySelector('select');
const graphDiv = document.getElementById("graph");

// Update dropdown called on startup
updatedropdown();

// Function to update dropdown with monitoring sources
async function updatedropdown() {
  try {
    const command = "SELECT DISTINCT(device) FROM monitoring";
    const result = await getTable(command);
    output.innerHTML = result;

    const table = document.getElementById("table");
    for (let i = 1; i < table.rows.length; i++) {
      const optionText = table.rows[i].innerText;
      tableselect.options.add(new Option(optionText, optionText));
    }

    tableselect.selectedIndex = -1;
    output.innerHTML = "";
    tableselect.dispatchEvent(new Event("change"));
  } catch (error) {
    console.error('Error updating dropdown:', error);
    output.innerHTML = 'Error loading data.';
  }
}

// Generic function to return SQL table data
async function getTable(command) {
  const xhr = new XMLHttpRequest();
  const url = "/cgi-bin/sqlquery.cgi";
  const user = "root";
  const db = "daq";
  const dataString = `user=${user}&db=${db}&command=${command}`;

  return new Promise((resolve, reject) => {
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(xhr.responseText);
        } else {
          reject(new Error('Failed to load data'));
        }
      }
    };
    xhr.send(dataString);
  });
}

// Event listener for select dropdown change
select.addEventListener('change', function () {
  if (tableselect.selectedIndex === -1) return;
  makePlot();
  updateinterval = setInterval(updatePlot, 2000);
});

// Function to generate the Plotly plot
async function makePlot() {
  clearInterval(updateinterval);

  if (select.options.length > 0) {
    const selectedOption = select.options[select.selectedIndex];
    const command = `SELECT * FROM monitoring WHERE device='${selectedOption.value}' ORDER BY time ASC`;

    try {
      const result = await getTable(command);
      output.innerHTML = result;

      const table = document.getElementById("table");
      table.style.display = "none";

      const xdata = new Map();
      const ydata = new Map();

      for (let i = 1; i < table.rows.length; i++) {
        const jsonData = JSON.parse(table.rows[i].cells[2].innerText);

        for (let key in jsonData) {
          if (!xdata.has(key)) {
            xdata.set(key, [table.rows[i].cells[0].innerText.slice(0, -3)]);
            ydata.set(key, [jsonData[key]]);
          } else {
            xdata.get(key).push(table.rows[i].cells[0].innerText.slice(0, -3));
            ydata.get(key).push(jsonData[key]);
          }
        }
      }

      data = [];
      for (let [key, value] of xdata) {
        data.push({
          name: `${selectedOption.value}:${key}`,
          mode: 'lines',
          x: value,
          y: ydata.get(key)
        });
      }

      const layout = {
        title: 'Monitor Time Series with Range Slider and Selectors',
        xaxis: {
          rangeselector: selectorOptions,
          rangeslider: {}
        }
      };

      // Clear previous plot traces if necessary
      if (graphDiv.data && graphDiv.data.length > 0) {
        Plotly.deleteTraces(graphDiv, 0);
      }

      Plotly.plot(graphDiv, data, layout);
    } catch (error) {
      console.error('Error generating plot:', error);
      output.innerHTML = 'Error generating plot.';
    }
  }
}

// Function to update the plot periodically
async function updatePlot() {
  if (updating) return;
  updating = true;

  if (select.options.length > 0) {
    const selectedOption = select.options[select.selectedIndex];
    last = data[0].x[data[0].x.length - 1];

    const command = `SELECT * FROM monitoring WHERE device='${selectedOption.value}' AND time>'${last.valueOf()}' ORDER BY time ASC`;

    try {
      const result = await getTable(command);
      output.innerHTML = result;

      const table = document.getElementById("table");
      table.style.display = "none";

      const xdata = new Map();
      const ydata = new Map();

      for (let i = 1; i < table.rows.length; i++) {
        const jsonData = JSON.parse(table.rows[i].cells[2].innerText);

        for (let key in jsonData) {
          if (!xdata.has(key)) {
            xdata.set(key, [table.rows[i].cells[0].innerText.slice(0, -3)]);
            ydata.set(key, [jsonData[key]]);
          } else {
            xdata.get(key).push(table.rows[i].cells[0].innerText.slice(0, -3));
            ydata.get(key).push(jsonData[key]);
          }
        }
      }

      // Update the data
      for (let [key, value] of xdata) {
        for (let i = 0; i < data.length; i++) {
          if (data[i].name === `${selectedOption.value}:${key}`) {
            data[i].x = data[i].x.concat(value);
            data[i].y = data[i].y.concat(ydata.get(key));
          }
        }
      }

      const layout = {
        title: 'Monitor Time Series with Range Slider and Selectors',
        xaxis: {
          rangeselector: selectorOptions,
          rangeslider: {}
        }
      };

      Plotly.redraw(graphDiv, data, layout);
      updating = false;
    } catch (error) {
      console.error('Error updating plot:', error);
      output.innerHTML = 'Error updating plot.';
      updating = false;
    }
  }
}

// Plot options definitions
const selectorOptions = {
  buttons: [{
    step: 'hour',
    stepmode: 'backward',
    count: 1,
    label: '1hr'
  }, {
    step: 'hour',
    stepmode: 'backward',
    count: 3,
    label: '3hr'
  }, {
    step: 'hour',
    stepmode: 'backward',
    count: 6,
    label: '6hr'
  }, {
    step: 'hour',
    stepmode: 'backward',
    count: 12,
    label: '12hr'
  }, {
    step: 'day',
    stepmode: 'backward',
    count: 1,
    label: '1d'
  }, {
    step: 'day',
    stepmode: 'backward',
    count: 3,
    label: '3d'
  }, {
    step: 'week',
    stepmode: 'backward',
    count: 1,
    label: '1w'
  }, {
    step: 'week',
    stepmode: 'backward',
    count: 2,
    label: '2w'
  }, {
    step: 'month',
    stepmode: 'backward',
    count: 1,
    label: '1m'
  }, {
    step: 'month',
    stepmode: 'backward',
    count: 6,
    label: '6m'
  }, {
    step: 'year',
    stepmode: 'todate',
    count: 1,
    label: 'YTD'
  }, {
    step: 'year',
    stepmode: 'backward',
    count: 1,
    label: '1y'
  }, {
    step: 'all'
  }]
};
