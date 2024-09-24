
d3.csv('./event1', function (err2, rows2) {
	function unpack2(rows2, key2) {
		return rows2.map(function (row2) { return row2[key2]; });
	}


	d3.csv('./locations', function (err, rows) {
		function unpack(rows, key) {
			return rows.map(function (row) { return row[key]; });
		}
		var c = unpack2(rows2, 'c');
		var t = unpack2(rows2, 't');
		for (var i = 0; i < t.length; i++) {
			if (t[i] < 100) t[i] = 100;
			if (t[i] > 250) t[i] = 250;

		}
		console.log(c);
		var trace1 = {
			x: unpack2(rows2, 'x'), y: unpack2(rows2, 'y'), z: unpack2(rows2, 'z'),
			mode: 'markers',
			marker: {
				size: 5,
				color: c,
				colorscale: 'Viridis',
				symbol: 'circle',
				line: {
					width: 1.0
				},
				opacity: 1.0
			},
			type: 'scatter3d',
			name: 'Hits'
		};

		var trace2 = {
			x: unpack(rows, 'x1'), y: unpack(rows, 'y1'), z: unpack(rows, 'z1'),
			mode: 'markers',
			marker: {
				color: 'rgb(127, 127, 127)',
				size: 5,
				symbol: 'circle',
				line: {
					color: 'rgb(204, 204, 204)',
					width: 0.0
				},
				opacity: 0.1
			},
			type: 'scatter3d',
			name: 'Tubes'
		};

		var data = [trace2, trace1];
		var layout = {
			margin: {
				l: 100,
				r: 100,
				b: 150,
				t: 50
			},
			legend: {
				x: 0.7, // Move legend closer to the left
				y: 1,
				xanchor: 'left',
				yanchor: 'top',
			},
			annotations: [
				{
					x: 0.0,
					y: 1.0,
					xref: 'paper',
					yref: 'paper',
					text: 'Appearance options:',
					showarrow: false,
					align: 'left'
				}
			],
			updatemenus: [
				{
					y: 0.9,
					yanchor: 'top',
					x: 0.0,
					xanchor: 'left',
					direction: 'right',
					buttons: [{
						method: 'relayout',
						args: ['paper_bgcolor', '#fff'],
						label: 'White'
					}, {
						method: 'relayout',
						args: ['paper_bgcolor', '#aaa'],
						label: 'Grey'
					}, {
						method: 'relayout',
						args: ['paper_bgcolor', '#000'],
						label: 'Black'
					}]
				},
				{
					y: 0.75,
					yanchor: 'top',
					x: 0.0,
					xanchor: 'left',
					direction: 'right',
					buttons: [{
						method: 'restyle',
						args: ['marker.color', ['rgb(127, 127, 127)', unpack2(rows2, 'c')]],
						label: 'Charge'
					}, {
						method: 'restyle',
						args: ['marker.color', ['rgb(127, 127, 127)', t]],
						label: 'Time'
					}]
				},
				{
					y: 0.6,
					yanchor: 'top',
					x: 0.0,
					xanchor: 'left',
					direction: 'right',
					buttons: [{
						method: 'restyle',
						args: ['marker.size', [5, 5]],
						label: 'Fixed Size'
					}, {
						method: 'restyle',
						args: ['marker.size', [5, unpack2(rows2, 'c')]],
						label: 'Dynamic'
					}]
				},
				{
					y: 0.45,
					yanchor: 'top',
					x: 0.0,
					xanchor: 'left',
					direction: 'right',
					buttons: [
						{
							args: ['type', 'surface'],
							label: '3D Surface',
							method: 'restyle'
						},
						{
							args: ['type', 'heatmap'],
							label: 'Heatmap',
							method: 'restyle'
						},
						{
							args: ['type', 'contour'],
							label: 'Contour',
							method: 'restyle'
						}
					],
				},
				{
					y: 0.3,
					yanchor: 'top',
					x: 0.0,
					xanchor: 'left',
					direction: 'right',
					buttons: [
						{
							args: ['marker.colorscale', 'Viridis'],
							label: 'Viridis',
							method: 'restyle'
						},
						{
							args: ['marker.colorscale', 'Electric'],
							label: 'Electric',
							method: 'restyle'
						},
						{
							args: ['marker.colorscale', 'Earth'],
							label: 'Earth',
							method: 'restyle'
						},
						{
							args: ['marker.colorscale', 'Hot'],
							label: 'Hot',
							method: 'restyle'
						},
						{
							args: ['marker.colorscale', 'Jet'],
							label: 'Jet',
							method: 'restyle'
						},
						{
							args: ['marker.colorscale', 'Portland'],
							label: 'Portland',
							method: 'restyle'
						},
						{
							args: ['marker.colorscale', 'Rainbow'],
							label: 'Rainbow',
							method: 'restyle'
						},
						{
							args: ['marker.colorscale', 'Blackbody'],
							label: 'Blackbody',
							method: 'restyle'
						},
						{
							args: ['marker.colorscale', 'Cividis'],
							label: 'Cividis',
							method: 'restyle'
						}
					]
				}
			]
		};
		
		Plotly.newPlot('myDiv', data, layout);
	})
});




