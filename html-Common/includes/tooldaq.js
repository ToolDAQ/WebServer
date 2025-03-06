// request(url, args, options)     -> Response
// requestText(url, args, options) -> string
// requestJson(url, args, options) -> JSON
// requestCSV(url, args, options)  -> Array of Array
// requestHTML(url, args, options) -> HTMLDocument
//
// dbJson(query)           -> JSON [ { column: value } ]
// dbTable(query, header)  -> Array of Array, first row may be column names
// dbPlot(query, template) -> Array of plots (Plotly objects) for each column
//
// getMonitoringPlot(device, options) -> Array of plots extracted from the monitoring table
// makeMonitoringPlot(div, device, options, layout) -> div - cals getMonitoringPlot and fills the div
//
// getPlotlyPlot(name, version) -> plot from plotlyplots table
// makePlotlyPlot(div, name, version) -> div - calls getPlotlyPlot and fills the div
//
// makeTable(table, data, header, filter) -> table - builds and HTML table from data
//
// getServices(filter) -> [ { id, ip, port, name, status } ]
// getService(name)    ->   { id, ip, port, name, status }
//
// sendCommand(service, command, ...args) -> string reply
//
// getControls(service) -> sendCommand(service, '?', 'JSON')
// makeControls(div, service) -> <div> with controls

'use strict';

class RequestError extends Error {
  constructor(message, response, responseText) {
    super(message);
    this.response     = response;
    this.responseText = responseText;
  }
};

class DBError extends Error {};

class CSVParseError extends Error {};

async function parseCSV(stream) {
  let result = [];
  if (stream == null) return result;
  let row    = [];
  let cell   = [];

  let decoder = new TextDecoder();

  let start   = true;
  let quoted  = false;
  let escaped = false;

  function commit_cell(and_row) {
    row.push(decoder.decode(Uint8Array.from(cell)));
    cell.length = 0;
    if (and_row) {
      result.push(row);
      row = [];
    };
    start   = true;
    quoted  = false;
    escaped = false;
  };

  function fail(message) {
    commit_cell(true);
    if (result.length > 0)
      row = result[result.length - 1];
    if ((row.length == 0 || row.length == 1 && row[0] == '')
        && result.length > 1)
      row = result[result.length - 2];
    if (row.length > 1 || row.length == 1 && row[0] != '')
      message += '; last row was (unquoted) `' + row.join(',') + "'";
    throw new CSVParseError(message);
  };

  let reader = stream.getReader();
  while (true) {
      let chunk = (await reader.read()).value;
      if (chunk === undefined) break;
    for (let byte of chunk) {
      if (byte == 0x22 /* " */) {
        if (start) {
          start  = false;
          quoted = true;
          continue;
        };

        if (quoted) {
          if (escaped) {
            cell.push(byte);
            escaped = false;
          } else
            escaped = true;
          continue;
        };

        fail('Unexpected quote');
      };
      start = false;

      switch (byte) {
        case 0x2C: // ,
          if (!quoted || escaped)
            commit_cell(false);
          else
            cell.push(byte);
          break;
        case 0x0A: // \n
          if (!quoted || escaped)
            commit_cell(true);
          else
            cell.push(byte);
          break;
        default:
          if (quoted && escaped)
            fail(
              'Unexpected byte 0x'
              + byte.toString(16)
              + " ('"
              + String.fromCharCode(byte)
              + "') between quote and delimiter"
            );
          cell.push(byte);
      };
    }
  };
  return result;
};

export function request(url, args, options) {
  const encode_url
    = url => url
          +  (url.indexOf('?') >= 0 ? '&' : '?')
          +  Object.entries(args).map(
               ([ arg, value ]) => encodeURIComponent(arg)
                                +  '='
                                +  encodeURIComponent(value)
             ).join('&');

  if (args != null) {
    if (typeof url == 'string')
      url = encode_url(url);
    else if (url instanceof URL) {
      url = new URL(url); // avoid changing the argument
      for (let [ arg, value ] of Object.entries(args))
        url.searchParams.append(arg, value);
    } else if (url instanceof Request) {
      url = new Request(encode_url(url.url), url);
    } else
      throw TypeError('request: invalid url type: ' + url);
  };

  if (options
      && (typeof(options) == 'string'
          || Object.getPrototypeOf(options) !== Object.prototype))
    options = { method: 'POST', body: options };

  return fetch(url, options).then(
    async function (response) {
      if (!response.ok) {
        let text = await response.text();
        let message = text;
        if (message != null && message != '') message = ': ' + message;
        throw new RequestError(
          `Request ${response.url} failed with status ${response.status} ${response.statusText}${message}`,
          response,
          text
        );
      };
      return response;
    }
  );
};

export function requestText(url, args, options) {
  return request(url, args, options).then(response => response.text());
};

export function requestJson(url, args, options) {
  return request(url, args, options).then(response => response.json());
};

export function requestCSV(url, args, options) {
  return request(url, args, options).then(response => parseCSV(response.body));
};

export function requestHTML(url, args, options, mimeType) {
  if (arguments.length == 2 && typeof args == 'string') {
    mimeType = args;
    args = null;
  };

  return request(url, args, options).then(
    async function (response) {
      let text = await response.text();
      if (mimeType == null) {
        mimeType = response.headers.get('Content-type').replace(/;.*/, '');
      };
      return new DOMParser().parseFromString(text, mimeType);
    }
  );
};

function db(query, format, header) {
  let args = { query, format };
  if (header) args.header = 1;
  return request('/cgi-bin/db-query.cgi', args).catch(
    async function (error) {
      if (error instanceof RequestError && error.response.status == 400) {
        throw new DBError(`Bad query ${query}: ${error.responseText}`, { cause: error });
      } else
        throw error;
    }
  );
};

export function dbJson(query) {
  return db(query, 'json').then(response => response.json());
};

export function dbTable(query, header) {
  return db(query, 'csv', header).then(response => parseCSV(response.body));
};

export function dbPlot(query, template) {
  return dbTable(query, true).then(
    function (table) {
      function column(index) {
        let result = new Array(table.length - 1);
        for (let i = 0; i < result.length; ++i) result[i] = table[i+1][index];
        return result;
      };

      let x = column(0);
      let plots = new Array(table[0].length - 1);
      for (let i = 0; i < plots.length; ++i)
        plots[i] = Object.assign(
          { name: table[0][i+1], x: x, y: column(i+1) },
          template
        );

      return plots;
    }
  );
};

export function getMonitoringPlot(device, options) {
  if (typeof(device) != 'string' || device == '')
    throw Error('getMonitoringPlot: device must be a non-empty string');

  let columns  = options?.columns;
  let template = options?.template;

  function encodeDate(date) {
    if (date instanceof Date)
      return date.toISOString() + date.getTimezoneOffset();
    return date;
  };

  if (options) {
    var from = encodeDate(options.from);
    var to   = encodeDate(options.to);
  };

  let query = `select time, data from monitoring where device = '${device}'`;
  if (from != null)
    query += ` and time >= '${from}'`;
  if (to != null)
    query += ` and time <= '${to}'`;
  query += ' order by time';

  if (columns != null) {
    if (!(columns instanceof Array)) columns = [ columns ];
    var fixed = [];
    var tests = [];
    for (let i = 0; i < columns.length; ++i) {
      let column = columns[i];
      let name;
      if (column instanceof Array) {
        name = column[1];
        column = column[0];
      };
      if (typeof column == 'string')
        fixed.push({ index: i, key: column, name: name ?? column });
      else if (column instanceof RegExp)
        tests.push({
          index: i,
          fn:    name == null
                 ? c => column.test(c)
                 : c => column.test(c) && c.replace(column, name)
        });
      else if (column instanceof Function)
        tests.push({
          index: i,
          fn:    name == null ? column : c => column(c) && name
        });
      else
        throw Error('Invalid column specification: ' + columns[i].toString());
    };
  };

  return dbTable(query).then(
    function (table) {
      let y = {};
      if (columns == null) {
        for (let i = 0; i < table.length; ++i) {
          let row = JSON.parse(table[i][1]);
          for (let column in row) {
            y[column] ??= {
              index: 0,
              name:  column,
              data:  new Array(table.length)
            };
            y[column].data[i] = row[column];
          };
        };
      } else {
        for (let column of fixed)
          y[column.key] = {
            index: column.index,
            name:  column.name,
            data:  new Array(table.length)
          };
        for (let i = 0; i < table.length; ++i) {
          let row = JSON.parse(table[i][1]);
          for (let column in row) {
            let exists = column in y;
            if (!exists)
              for (let test of tests) {
                let name = test.fn(column);
                if (name != null && name != false) {
                  exists = true;
                  y[column] = {
                    index: test.index,
                    name:  name === true ? column : name,
                    data:  new Array(table.length)
                  };
                  break;
                };
              };
            if (exists) y[column].data[i] = row[column];
          };
        };
      };

      let x = table.map(row => row[0] ? new Date(row[0]) : null);

      return Object.values(y).sort(
        function (a, b) {
          let i = a.index - b.index;
          if (i) return i;
          if (a.name < b.name) return -1;
          if (a.name > b.name) return  1;
          return 0;
        }
      ).map(
        y => Object.assign({ name: y.name, x: x, y: y.data }, template)
      );
    }
  );
}

export function makeMonitoringPlot(div, device, options, layout) {
  options ??= {};
  options.template ??= { mode: 'lines' };
  getMonitoringPlot(device, options).then(
    function (plots) {
      if (div == null) div = document.createElement('div');
      if (!plots) Plotly.purge(div);
      Plotly.newPlot(div, plots, layout);
      return div;
    }
  );
};

export function getPlotlyPlot(name, version) {
  if (typeof(name) != 'string' || name == '')
    throw Error('dbPlotlyPlot: name must be a non-empty string');

  if (version == null)
    version = 'order by time desc limit 1';
  else if (typeof(version) == 'number')
    version = `and version = ${version}`

  return dbJson(
    `select * from plotlyplots where name = '${name}' ${version}`
  ).then(
    function (table) {
      let plot = table[0];
      plot.time = new Date(plot.time);
      return plot;
    }
  );
};

export function makePlotlyPlot(div, name, version) {
  getPlotlyPlot(name, version).then(
    function (plot) {
      if (div == null) div = document.createElement('div');
      if (!plot) Plotly.purge(div);
      Plotly.newPlot(div, plot.traces, plot.layout);
      return div;
    }
  );
};

// header:
//   data[0] is an array:
//     null or undefined --- no header, use all columns
//     true:
//       data[0] is the header, use all columns
//     false:
//       skip data[0], use all columns
//     Function:
//       (data[0]) => header
//       header should be an array that will be processed as below.
//     Array:
//       [ 'a', 'b', null, 'c' ]
//       (array of strings or nulls):
//         strings provide column names, null columns are skipped
//       [ 3, 2 ]
//       (array of numbers):
//         use specified columns in this order
//       [ [ 3, 'A' ], [ 2, 'B' ] ]
//       (array of arrays with numbers as first elements):
//         numbers specify columns indices, strings specify column names
//       [ true, 'a', 'b', 'c' ]
//       (true followed by strings):
//         data[0] is assumed to contain header names, strings specify which
//         columns are used and in what order.
//       [ false, 'a', 'b', 'c' ]
//       (false followed by strings):
//         same as above, but do not insert the header in the table
//       [ true, 3, 2 ]
//       (true followed by numbers):
//         data[0] is the header, use specified columns in this order
//       [ true, [ 3, 'A' ], 1, [ 2, 'B' ] ]
//       (true followed by array of numbers or arrays with numbers as first elements):
//         data[0] is the header, numbers specify columns indices, strings
//         specify column names
//       [ true, 'a', [ 'b', 'B' ], [ 'c', 'C' ] ]
//       (array of strings or arrays with strings as first elements):
//         data[0] is assumed to contain header names. First elements specify
//         which columns are used and in what order, second elements map column
//         names to titles.
//   data[0] is an object:
//     null or undefined --- no header, use all columns sorted by name
//     true:
//       add header, use all columns sorted by name
//     Function:
//       (Object.keys(data[0])) => header
//       header should be an array that will be processed as below.
//     Array:
//       [ 'a', 'b', [ 'c', 'C' ] ]
//       (array of strings or arrays with strings as first elements):
//         specifies columns to be used and mapping to column titles
//       [ false, 'a', 'b', 'c' ]
//       (false followed by strings)
//         specifies which columns to use, but the header won't be inserted in
//         the table
// filter:
//   (row, index) => new_row
//   index is the row index in the table (can be used to reset filter state)
//   row can be modified and returned
//   If new_row == null, the row is skipped
//   row with index 0 is passed through filter before possibly treating it as a
//   header. If filter filters out this row, the table will have no columns.
export function makeTable(table, data, header, filter = (row, index) => row) {
  if (table == null)
    table = document.createElement('table');
  else if (typeof table == 'string') {
    let t = document.getElementById(table);
    if (t == null)
      throw Error(`No DOM element with id '${table}' exists on the page`);
    table = t;
  };

  if (!table) table = document.createElement('table');

  table.innerHTML = '';

  function bad_header() {
    throw Error('makeTable: invalid header specification: ' + JSON.stringify(header));
  };

  let index = 0;
  let row;
  if (data && data.length) row = filter(data[index++], 0);

  let columns;
  if (row == null) {
    // See if we can add a header to an empty table. It is possible only if the
    // caller specified both column names and their indices.
    if (!(header instanceof Array) || !header.length) return table;
    let titles = [];
    let i = 0;
    if (header[i] === true) ++i;
    for (; i < header.length; ++i) {
      let h = header[i];
      if (h instanceof Array) {
        if (typeof h[0] == 'string')
          titles.push(h[1]);
        else
          return table;
      } else if (h == null) {
        continue;
      } else if (typeof h == 'string') {
        titles.push(h);
      } else
        return table;
    };
    header = titles;
  } else if (row instanceof Array) {
    if (header instanceof Function)
      header = header(row);

    if (header instanceof Array) {
      if (!header.length) return table; // no columns

      // Check header specification. It may begin with true
      let use_row     = false;
      let emit_header = true;
      let hstart      = 0;
      if (header[0] === true || header[0] === false) {
        use_row     = true;
        emit_header = header[0];
        ++hstart;
      };
      // Followed by either (strings or nulls) or numbers or arrays where all
      // first elements are a string or a number
      let strings = false;
      let numbers = false;
      let renames = 0;
      for (let i = hstart; i < header.length; ++i) {
        if (header[i] == null || typeof header[i] == 'string')
          strings = true;
        else if (typeof header[i] == 'number')
          numbers = true;
        else if (header[i] instanceof Array) {
          ++renames;
          if (typeof header[i][0] == 'string')
            strings = true;
          else if (typeof header[i][1] == 'number')
            numbers = true;
        };
      };
      if (strings == numbers
          // [ [ 3, 'A' ], 1 ] or [ [ 'a', 'A' ], 'b' ] are invalid unless use_row
          || !use_row && renames && (strings || renames != header.length))
        bad_header();

      let titles  = [];
      columns = [];
      if (use_row) {
        if (strings) {
          // [ 'a', [ 'b', 'B' ], [ 'c', 'C' ] ]
          let map = {};
          for (let i = 0; i < row.length; ++i)
            map[row[i]] = i;
          for (let i = hstart; i < header.length; ++i) {
            let h = header[i];
            if (h instanceof Array) {
              columns.push(map[h[0]]);
              titles.push(h[1]);
            } else {
              columns.push(map[h]);
              titles.push(h);
            };
          };
        } else {
          // [ 3, [ 2, 'B' ] ]
          for (let i = hstart; i < header.length; ++i) {
            let h = header[i];
            if (h instanceof Array) {
              columns.push(h[0]);
              titles.push(h[1]);
            } else {
              columns.push(h);
              titles.push(row[h]);
            };
          };
        };
        row = null;
      } else if (strings) {
        // [ 'a', 'b', null, 'c' ]
        for (let i = 0; i < header.length; ++i)
          if (header[i] != null) {
            columns.push(i);
            titles.push(header[i]);
          };
      } else {
        // [ 3, [ 2, 'B' ] ]
        for (let i = 0; i < header.length; ++i) {
          let h = header[i];
          if (h instanceof Array) {
            columns.push(h[0]);
            titles.push(h[1]);
          } else
            columns.push(h);
        };
      };
      header = emit_header && titles.length ? titles : null;
    } else {
      columns = Array.from(row.keys());
      if (header === true) {
        header = row;
        row    = null;
      } else if (header === false) {
        header = null;
        row    = null;
      } else if (header != null)
        bad_header();
    };
  } else { // row is an object
    if (header instanceof Function)
      header = header(Object.keys(row));

    if (header instanceof Array) {
      if (!header.length) return table; // no columns

      let emit_header = true;
      let i = 0;
      if (header[0] === false || header[0] === true) {
        emit_header = header[0];
        ++i;
      };

      // [ 'a', 'b', [ 'c', 'C' ] ]
      columns = [];
      let titles = [];
      for (; i < header.length; ++i ) {
        let h = header[i];
        if (h instanceof Array) {
          columns.push(h[0]);
          titles.push(h[1]);
        } else {
          columns.push(h);
          titles.push(h);
        };
      };
      header = emit_header ? titles : null;
    } else {
      columns = Object.keys(row).sort();
      if (header === true)
        header = columns;
      else if (header != null)
        bad_header();
    };
  };

  if (header) {
    let tr = table.createTHead().insertRow();
    for (let h of header) {
      let th = document.createElement('th');
      th.textContent = h;
      tr.append(th);
    };
  };

  if (!data || index >= data.length) return table;

  let tbody = table.createTBody();
  function add_row(row) {
    let tr = tbody.insertRow();
    for (let column of columns) {
      let cell = row[column];
      if (cell instanceof Object) cell = JSON.stringify(cell);
      tr.insertCell().textContent = cell;
    };
  };

  if (row != null) add_row(row);
  for (; index < data.length; ++index) {
    let row = filter(data[index], index);
    if (row != null) add_row(row);
  };

  return table;
};


export function getServices(filter) {
  if (filter == null)
    filter = service => true;
  else if (typeof filter == 'string') {
    let name = filter;
    filter = row => row.name == name;
  } else if (filter instanceof RegExp) {
    let regex = filter;
    filter = row => regex.test(row.name);
  } else if (!(filter instanceof Function))
    throw Error(
      'getServices: invalid filter: '
      + (filter instanceof Object ? JSON.stringify(filter) : filter)
    );

  return requestCSV('/services.txt').then(
    function (table) {
      let keys = [ 'id', 'ip', 'port', 'name', 'status' ];
      let out = 0;
      for (let i = 0; i < table.length; ++i) {
        let row = table[i];
        let service = {};
        for (let j = 0; j < keys.length; ++j) service[keys[j]] = row[j];
        if (filter(service)) table[out++] = service;
      };
      table.length = out;
      return table;
    }
  );
};

export function getService(name) {
  return getServices(name).then(
    function (services) {
      if (services.length > 1)
        throw Error(
          `getService(${name}): multiple services found (${services.length})`
        );
      if (services.length == 0) return null;
      return services[0];
    }
  );
};

export function sendCommand(service, command, ...args) {
  if (service == null) throw Error('sendCommand: service is null');

  if (!(service instanceof Object)
      || service instanceof Function
      || service instanceof RegExp)
    return getService(service).then(
      function (s) {
        if (s == null)
          throw Error(`sendCommand: service ${service} not found`);
        return sendCommand(s, command, ...args);
      }
    );

  return requestText(
    '/cgi-bin/command.cgi',
    { ip: service.ip, port: service.port },
    command + (args.length > 0 ? ' ' : '') + args.join(' ')
  );
};

export function getControls(service) {
  return sendCommand(service, '?', 'JSON').then(JSON.parse);
};

export function makeControls(div, service) {
  if (service == null) return;

  return getControls(service).then(
    function (commands) {
      function make(tag, className) {
        let element = document.createElement(tag);
        element.className = className;
        return element;
      };

      function make_name(name) {
        let span = make('span', 'control-name');
        span.textContent = name + ': ';
        return span;
      };

      if (div == null)
        div = make('div', 'controls');
      else if (typeof div == 'string') {
        let d = document.getElementById(div);
        if (d == null)
          throw Error(`No DOM element with id '${div}' exists on the page`);
        div = d;
      } else {
        // If the div already has controls, stop the timer
        let stop = div.dataset.controls_stop;
        if (stop != null) stop();
        div.innerHTML = '';
      };

      let output = make('div', 'control-output');

      async function send_command(command, ...args) {
        output.textContent = await sendCommand(service, command, ...args);
      };

      let controls = {};
      for (let command of commands) {
        let row = make('div', 'control');
        if (command.type == 'INFO') {
          row.append(make_name(command.name));

          let span = make('span', 'control');
          span.textContent = command.value;
          row.append(span);

          controls[command.name] = cmd => span.textContent = cmd.value;
        } else if (command.type == 'BUTTON') {
          let button = make('button', 'control');
          button.textContent = command.name;
          button.addEventListener(
            'click',
            command.value
            ? () => void send_command(command.name, command.value)
            : () => void send_command(command.name)
          );
          row.append(button);
          controls[command.name] = cmd => void(command.value = cmd.value);
        } else if (command.type == 'OPTIONS') {
          row.append(make_name(command.name));

          let update = make('button', 'control-update');
          update.textContent = 'Update';
          update.disabled    = true;
          update.addEventListener(
            'click',
            function () {
              for (let input of row.childNodes)
                if (input instanceof HTMLInputElement && input.checked) {
                  send_command(command.name, input.value);
                  command.value = input.value;
                  update.disabled = true;
                  return;
                }
            }
          );

          let inputs = {};
          for (let option of command.options) {
            let input = make('input', 'control');
            input.type     = 'radio';
            input.id       = command.name + '-' + option;
            input.name     = command.name;
            input.value    = option;
            input.checked  = command.value == option;
            input.onchange = () => void(update.disabled = input.value == command.value);
            row.append(input);

            let label = document.createElement('label');
            label.htmlFor     = input.id;
            label.textContent = option;
            row.append(label);
            inputs[option] = input;
          };

          row.append(update);

          controls[command.name] = function (cmd) {
            command.value = cmd.value;
            if (update.disabled)
              for (let option of cmd.options)
                inputs[option].checked = inputs[option].value == cmd.value;
            else
              update.disabled = inputs[cmd.value].checked;
          };
        } else if (command.type == 'VARIABLE') {
          row.append(make_name(command.name));

          let slider = make('input', 'control');
          slider.type = 'range';
          let number = make('input', 'control');
          number.type = 'number';
          for (let input of [ slider, number ]) {
            input.min   = command.min;
            input.max   = command.max;
            input.step  = command.step;
            input.value = command.value;
            row.append(input);
          };

          let update = make('button', 'control-update');

          function oninput(one, another) {
            another.value   = one.value;
            update.disabled = one.value == command.value;
          };

          slider.addEventListener('input', () => void oninput(slider, number));
          number.addEventListener('input', () => void oninput(number, slider));

          update.textContent = 'Update';
          update.disabled = true;
          update.addEventListener(
            'click',
            function () {
              send_command(command.name, number.value);
              command.value   = number.value;
              update.disabled = true;
            }
          );

          row.append(update);

          controls[command.name] = function (cmd) {
            command.value = cmd.value;
            if (update.disabled)
              number.value = slider.value = cmd.value;
            else
              update.disabled = number.value == cmd.value;
          };
        };
        div.append(row);
      };
      div.append(output);

      // TODO: how to stop the timeout if the div is destroyed?
      let delay = 5000;
      let timeout;
      function update() {
        getControls(service).then(
          function (commands) {
            for (let command of commands) {
              let control = controls[command.name];
              if (control) control(command);
            };
            timeout = setTimeout(update, delay);
          }
        )
      };
      timeout = setTimeout(update, delay);

      // We could use a global Symbol for controls_stop to avoid clashes.
      div.dataset.controls_stop = () => void cancelTimeout(timeout);
      return div;
    }
  );
};

// This is to allow developers to play with the functions in the browser console.
window.modules ??= {};
window.modules.tooldaq = {
  db,
  dbJson,
  dbPlot,
  dbTable,
  request,
  requestCSV,
  requestHTML,
  requestJson,
  requestText,
  getControls,
  getMonitoringPlot,
  getPlotlyPlot,
  getService,
  getServices,
  makeControls,
  makeMonitoringPlot,
  makePlotlyPlot,
  makeTable,
  parseCSV,
  sendCommand,
};
