var plots = {
  div:   document.getElementById('plots'),
  plots: []
};

function plots_dropdown_update(select) {
  if (select.value == '__update')
    GetPlotlyPlots(undefined, undefined, true).then(
      function (db_plots) {
        plots.plots = db_plots;
        select.length = 2;
        for (let i = 0; i < db_plots.length; ++i) {
          let option = document.createElement('option');
          option.text = db_plots[i].name + ' ' + db_plots[i].version;
          select.add(option);
        };
        select.value = '__none';
      }
    );
  else if (select.value == '__none')
    Plotly.purge(plots.div);
  else {
    let plot = plots.plots[select.selectedIndex - 2];
    MakePlotlyPlot(plots.div, plot.name, plot.version);
  };
};

{
  let select = document.getElementById('plots_dropdown');
  select.value = '__update';
  plots_dropdown_update(select);
}
