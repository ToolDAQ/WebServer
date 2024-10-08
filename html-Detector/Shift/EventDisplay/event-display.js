var display = {};

function report_error(message) {
  let div = document.getElementById('event-display-error');
  div.innerText = message;
  div.style.display = 'block';
};

function selected_name(id) {
  let options = document.getElementById(id).options;
  return options[options.selectedIndex].getAttribute('name');
};

function selected_plot_mode() {
  return selected_name('event-display-plot-mode');
};

function selected_plot_data() {
  return selected_name('event-display-plot-data');
};

function update_hits() {
  let data = display[display.mode];
  if (data.hits.event === display.event) return;
  data.hits.event = display.event;

  function hits_coordinate(coordinate) {
    return display.event.data.map(
      hit => data.tubes[coordinate][display.pmts[hit.pmt]]
    );
  };
  data.hits.x = hits_coordinate('x');
  data.hits.y = hits_coordinate('y');
  if ('z' in data.hits) data.hits.z = hits_coordinate('z');

  data.hits.marker.color = display.event.data.map(hit => hit[display.data]);
  display.marker_sizes[1] = data.hits.marker.color;

  data.hits.text = display.event.data.map(
    hit => data.tubes.text[display.pmts[hit.pmt]]
         + `<br>value: ${hit[display.data]}`
  );
  data.hits.hoverinfo = 'text';
};

function load_event(nevent) {
  d3.csv(
    '/cgi-bin/get-event.cgi?event=' + nevent,
    function (error, event) {
      if (error) {
        report_error('Error while loading event ' + nevent + ': ' + error) ;
        return;
      };

      event = event[0];
      event.data = JSON.parse(event.data);

      display.event = event;
      display.number.innerText = nevent;
      display.time.innerText = event.time;

      update_hits();

      let data = display[display.mode];
      if (data.traces.length == 1) {
        display['2d'].traces.push(display['2d'].hits);
        display['3d'].traces.push(display['3d'].hits);
      };
      Plotly.react('event-display', data.traces, display.layout);
    }
  );
};

function update_plot_mode() {
  display.mode = selected_plot_mode();
  update_hits();
  Plotly.newPlot('event-display', display[display.mode].traces, display.layout);
};

function update_plot_data() {
  display.data = selected_plot_data();
  let marker = display[display.mode].hits.marker;
  for (let i = 0; i < display.event.data.length; ++i)
    marker.color[i] = display.event.data[i][display.data];
  Plotly.restyle('event-display', { marker: marker });
};

d3.csv(
  '/cgi-bin/pmt-locations.cgi',
  function (error, pmts) {
    if (error) {
      report_error('Error while getting PMT locations: ' + error);
      return;
    };

    for (let pmt of pmts)
      for (let i of [ 'id', 'x', 'y', 'z' ])
        pmt[i] = Number(pmt[i]);

    let ymin = pmts[0].y;
    let ymax = ymin;
    let r    = pmts[0].z;
    let pmt_map = {};
    for (let i = 0; i < pmts.length; ++i) {
      if (pmts[i].y > ymax)
        ymax = pmts[i].y;
      else if (pmts[i].y < ymin)
        ymin = pmts[i].y;
      if (pmts[i].z > r) r = pmts[i].z;
      pmt_map[pmts[i].id] = i;
    };

    let locations2d = pmts.map(
      function (t) {
        if (t.location == 'top')    return { x: t.x, y: ymax + r - t.z };
        if (t.location == 'bottom') return { x: t.x, y: ymin - r + t.z };
        return { x: r * Math.atan2(t.x, t.z), y: t.y };
      }
    );

    let tubes2d = {
      name: 'Tubes',
      x:    locations2d.map(l => l.x),
      y:    locations2d.map(l => l.y),
      type: 'scatter',
      mode: 'markers',
      marker: {
        size:  5,
        color: 'rgb(127, 127, 127)'
      },
      text: pmts.map(t => `id: ${t.id}<br>x: ${t.x}<br>y: ${t.y}<br>z: ${t.z}`),
      hoverinfo: 'text'
    };

    let tubes3d = {
      name:      'Tubes',
      x:         pmts.map(t => t.x),
      y:         pmts.map(t => t.y),
      z:         pmts.map(t => t.z),
      type:      'scatter3d',
      mode:      'markers',
      marker:    tubes2d.marker,
      text:      tubes2d.text,
      hoverinfo: 'text'
    };

    let hits2d = {
      name: 'Hits',
      x:    [],
      y:    [],
      type: 'scatter',
      mode: 'markers',
      marker: {
        size:  5,
        color: [],
        colorscale: 'Viridis'
      },
      event: null
    };

    let hits3d = {
      name:   'Hits',
      x:      [],
      y:      [],
      z:      [],
      type:   'scatter3d',
      mode:   'markers',
      marker: hits2d.marker,
      event:  null
    };

    display['2d']  = { tubes: tubes2d, hits: hits2d, traces: [ tubes2d ] };
    display['3d']  = { tubes: tubes3d, hits: hits3d, traces: [ tubes3d ] };
    display.pmts   = pmt_map;
    display.mode   = selected_plot_mode();
    display.data   = selected_plot_data();
    display.event  = null;

    display.number = document.getElementById('event-display-number');
    display.time   = document.getElementById('event-display-time');

    // A hack to tie marker color and marker size arrays when the "Dynamic"
    // button below is clicked. See update_hits(). How to bind to
    // plotly_buttonclicked for this button? I cannot find the documentation on
    // this event.
    display.marker_sizes = [ 5, 5 ];
    
    display.layout = {
      margin: { t: 0, b: 0 },
      legend: { y: 0.5, yanchor: 'top' },
      updatemenus: [
        {
          y:       0.8,
          yanchor: 'top',
          buttons: [
            {
              method: 'relayout',
              args:   [ 'paper_bgcolor', '#fff' ],
              label:  'white'
            },
            {
              method: 'relayout',
              args:   [ 'paper_bgcolor', '#aaa' ],
              label:  'gray'
            },
            {
              method: 'relayout',
              args:   [ 'paper_bgcolor', '#000' ],
              label:  'black'
            }
          ]
        },
        {
          y:       0.4,
          yanchor: 'top',
          buttons: [
            {
              method: 'restyle',
              args:   [ 'marker.size', [ 5, 5 ] ],
              label:  'Fixed size'
            },
            {
              method: 'restyle',
              args:   [ 'marker.size', display.marker_sizes ],
              label:  'Dynamic'
            }
          ]
        },
        {
          buttons: [
            {
              args:   [ 'marker.colorscale', 'Viridis' ],
              label:  'Viridis',
              method: 'restyle'
            },
            {
              args:   [ 'marker.colorscale', 'Electric' ],
              label:  'Electric',
              method: 'restyle'
            },
            {
              args:   [ 'marker.colorscale', 'Earth' ],
              label:  'Earth',
              method: 'restyle'
            },
            {
              args:   [ 'marker.colorscale', 'Hot' ],
              label:  'Hot',
              method: 'restyle'
            },
            {
              args:   [ 'marker.colorscale', 'Jet' ],
              label:  'Jet',
              method: 'restyle'
            },
            {
              args:   [ 'marker.colorscale', 'Portland' ],
              label:  'Portland',
              method: 'restyle'
            },
            {
              args:   [ 'marker.colorscale', 'Rainbow' ],
              label:  'Rainbow',
              method: 'restyle'
            },
            {
              args:   [ 'marker.colorscale', 'Blackbody' ],
              label:  'Blackbody',
              method: 'restyle'
            },
            {
              args:   [ 'marker.colorscale', 'Cividis' ],
              label:  'Cividis',
              method: 'restyle'
            }
          ],
          direction:  'left',
          pad:        { r: 10, t: 20 },
          showactive: true,
          type:       'buttons',
          x:          0.15,
          xanchor:    'left',
          y:          0,
          yanchor:    'top'
        }
      ]
    };

    Plotly.newPlot(
      'event-display',
      display[display.mode].traces,
      display.layout
    );

    load_event(0);
  }
);
