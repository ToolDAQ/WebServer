var plots_div = document.getElementById('plots');

function plots_dropdown_update(select) {
  if (select.value == '__update')
    GetPlot().then(
      function (plots) {
        select.length = 2;
        for (let plot of plots) {
          let option = document.createElement('option');
          option.value = plot.name;
          option.text  = plot.name;
          select.add(option);
        };
        select.value = '__none';
      }
    );
  else if (select.value == '__none')
    Plotly.purge(plots_div);
  else
    GetPlot(select.value).then(
      function (plot) {
        if (!plot) return;
        Plotly.newPlot(
          plots_div,
          [ { x: plot.x, y: plot.y } ],
          {
            title: plot.title,
            xaxis: { title: plot.xlabel },
            yaxis: { title: plot.ylabel }
          }
        );
      }
    );
};

{
  let select = document.getElementById('plots_dropdown');
  select.value = '__update';
  plots_dropdown_update(select);
}
