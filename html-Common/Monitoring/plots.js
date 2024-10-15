"use strict;"

import { GetPlotlyPlots, MakePlotlyPlot } from "/includes/functions.js";

var div    = document.getElementById('plots');
var select = document.getElementById('plots_dropdown');
var plots  = [];

function plots_dropdown_update() {
  if (select.selectedIndex > 1) {
    let plot = plots[select.selectedIndex - 2];
    MakePlotlyPlot(div, plot.name, plot.version);
  } else if (select.selectedIndex == 1) {
    Plotly.purge(div);
  } else if (select.selectedIndex == 0) {
    GetPlotlyPlots(undefined, undefined, true).then(
      function (db_plots) {
        plots = db_plots;
        select.length = 2;
        for (let i = 0; i < db_plots.length; ++i) {
          let option = document.createElement('option');
          option.text = db_plots[i].name + ' ' + db_plots[i].version;
          select.add(option);
        };
        select.selectedIndex = 1;
      }
    );
  };
};

select.addEventListener('change', plots_dropdown_update);
select.selectedIndex = 0;
plots_dropdown_update();
