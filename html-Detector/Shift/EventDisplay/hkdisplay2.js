
d3.csv('/cgi-bin/get-event.cgi?event=0', function(err2, rows2){
    function unpack2(rows2, key2) {
	return rows2.map(function(row2)
			 { return row2[key2]; });}
    
    
    d3.csv('/cgi-bin/locations.cgi', function(err, rows){
	function unpack(rows, key) {
	    return rows.map(function(row)
			    { return row[key]; });}
	var c = unpack2(rows2, 'c');
	var t = unpack2(rows2, 't');
	for (var i = 0; i < t.length; i++) {
	    if(t[i]<100) t[i]=100;
	    if(t[i]>250) t[i]=250;
	    
	}
	var trace1 = {
	    x:unpack2(rows2, 'x'), y: unpack2(rows2, 'y'), z: unpack2(rows2, 'z'),
	    mode: 'markers',
	    marker: {
		size: 5,
		color: c,
		colorscale: 'Viridis',
		symbol: 'circle',
		line: {
		    width: 1.0},
		opacity: 1.0},
	    type: 'scatter3d',
	    name: 'Hits'
	};
	
	var trace2 = {
	    x:unpack(rows, 'x1'), y: unpack(rows, 'y1'), z: unpack(rows, 'z1'),
	    mode: 'markers',
	    marker: {
		color: 'rgb(127, 127, 127)',
		size: 5,
		symbol: 'circle',
		line: {
		    color: 'rgb(204, 204, 204)',
		    width: 0.0},
		opacity: 0.1},
	    type: 'scatter3d',
	    name: 'Tubes'
	};
	
	var data = [trace2,trace1];
	var layout = {margin: {
	    l: 0,
	    r: 0,
	    b: 0,
	    t: 50
	},
		      //		  width: 500,
		      //height: 100,
		      
		      //plot_bgcolor: '#000',
		      //paper_bgcolor: '#000',
		      updatemenus: [{
			  y: 0.8,
			  yanchor: 'top',
			  buttons: [{
			      method: 'relayout',
			      args: ['paper_bgcolor', '#fff'],
			      //	  args: ['plot_bgcolor', '#111'],
			      label: 'white'
			  },{
			      method: 'relayout',
			      args: ['paper_bgcolor', '#aaa'],
			      //        args: ['plot_bgcolor', '#000'],
			      label: 'grey'
			  },{
			      method: 'relayout',
			      args: ['paper_bgcolor', '#000'],
			      //	  args: ['plot_bgcolor', '#000'],
			      label: 'black'
			      
			  }]
		      },
				    {
					y: 0.6,  
					yanchor: 'top',
					buttons: [{
					    method: 'restyle',
					    args: ['marker.color', ['rgb(127, 127, 127)', unpack2(rows2, 'c')]],
					    label: 'Charge'
					},{
					    method: 'restyle',
					    args: ['marker.color', ['rgb(127, 127, 127)', t]],
					    label: 'Time'
					}]
				    },
				    {
					y: 0.4,  
					yanchor: 'top',
					buttons: [{
					    method: 'restyle',
					    args: ['marker.size', [5, 5]],
					    label: 'Fixed Size'
					},{
					    method: 'restyle',
					    args: ['marker.size', [5, unpack2(rows2, 'c')]],
					    label: 'Dynamic'
					}]
				    },
				    
				    
				    
				    
				    /*
				      {
				      buttons: [
				      {
				      args: [{'contours.showlines':false, 'type':'contour'}],
				      label: 'Hide lines',
				      method: 'restyle'
				      },
				      {
				      args: [{'contours.showlines':true, 'type':'contour'}],
				      label:'Show lines',
				      method:'restyle'
				      }
				      ],
				      direction: 'down',
				      pad: {'r': 10, 't': 10},
				      showactive: true,
				      type: 'dropdown',
				      x: 0.78,
				      xanchor: 'left',
				      y: button_layer_2_height,
				      yanchor: 'top'
				      },*/
				    {
					buttons: [
					    {
						args: ['type', 'scatter3d'],
						label: '3D Surface',
						method: 'restyle'
					    },
					    {
						args: ['type', 'heatmap'],
						label:'Heatmap',
						method:'restyle'
					    },
					    {
						args: ['type', 'contour'],
						label:'Contour',
						method:'restyle'
					    }
					],
				    },
				    
				    {
					buttons: [
					    {
						args: ['marker.colorscale', 'Viridis'],
						label: 'Viridis',
						method: 'restyle'
					    },
					    {
						args: ['marker.colorscale', 'Electric'],
						label:'Electric',
						method:'restyle'
					    },
					    {
						args: ['marker.colorscale', 'Earth'],
						label:'Earth',
						method:'restyle'
					    },
					    {
						args: ['marker.colorscale', 'Hot'],
						label:'Hot',
						method:'restyle'
					    },
					    {
						args: ['marker.colorscale', 'Jet'],
						label:'Jet',
						method:'restyle'
					    },
					    {
						args: ['marker.colorscale', 'Portland'],
						label:'Portland',
						method:'restyle'
					    },
					    {
						args: ['marker.colorscale', 'Rainbow'],
						label:'Rainbow',
						method:'restyle'
					    },
					    {
						args: ['marker.colorscale', 'Blackbody'],
						label:'Blackbody',
						method:'restyle'
					    },
					    
					    {
						args: ['marker.colorscale', 'Cividis'],
						label:'Cividis',
						method:'restyle'
					    }
					],
					direction: 'left',
					pad: {'r': 10, 't': 10},
					showactive: true,
					type: 'buttons',
					x: 0.15,
					xanchor: 'left',
					y: 0,
					yanchor: 'top'
				    }
				   ]
		      
		     };
	Plotly.newPlot('myDiv', data, layout);
    })
});




