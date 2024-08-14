
var selectorOptions = { //plot options definitions
    buttons: [ {
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
        step: 'all',
    }],
};

var layout_timeseries_slider_selector = {
    title: 'Monitor Time series with range slider and selectors',
    xaxis: {
        rangeselector: selectorOptions,
        rangeslider: {}
    }
};
