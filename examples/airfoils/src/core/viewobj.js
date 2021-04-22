export default class viewobj {
  static spritewidth = 64
	
  constructor(div, v2p){
	this.div = div
	this.spritewidth = viewobj.spritewidth
	
	this.scales = {
	  x: d3.scaleLinear()
		.domain( [0, div.offsetWidth*v2p ] )
		.range(  [0, div.offsetWidth     ] ),
	  y: d3.scaleLinear()
		.domain( [0, div.offsetHeight*v2p ] )
		.range(  [0, div.offsetHeight     ] )
	} // scales
	
	this.current = {
	  x: [0, div.offsetWidth*v2p ],
	  y: [0, div.offsetHeight*v2p],
	  v2p: v2p
	} // current
		
  } // constructor
  
  transform(){
	
	// d3/event.transform keeps track of the zoom based on the initial state. Therefore if the scale domain is actually changed, the changes compound later on!! Either reset the event tracker, or keep the domain unchanged, and just update separate view coordinates.
	let view = this.current
	view.x = d3.event.transform.rescaleX( this.scales.x ).domain()
	view.y = d3.event.transform.rescaleY( this.scales.y ).domain()
	
	let v2p_new = (view.x[1] - view.x[0]) / this.div.offsetWidth
	let k = v2p_new / view.v2p
	view.v2p = v2p_new
	
	this.spritewidth = this.spritewidth / k;
	
  } // transform
	
  pixel2data(pixelpoint){
	// Transform into the data values. B
	let view = this.current
	let dom = {
		x: [0, this.div.offsetWidth ], 
		y: [0, this.div.offsetHeight]
	}
	
	return canvasobj.domA2domB(pixelpoint, dom, view)
  } // pixel2data
	
  data2pixel(datapoint){
	// Transform into the data values. B
	let view = this.current
	let dom = {
		x: [0, this.div.offsetWidth], 
		y: [0, this.div.offsetHeight]
	}
	  
	return canvasobj.domA2domB(datapoint, view, dom)
  } // pixel2data
	
  static domA2domB(point, A, B){
	// Convert a single point `point' from a domain defined by `A' to a domain defined by `B'. `A' and `B' both require to have `x' and `y' attributes, which are arrays of length 2.
	
	let x = d3.scaleLinear()
	  .domain( A.x )
	  .range( B.x )
		
	let y = d3.scaleLinear()
	  .domain( A.y )
	  .range( B.y )
		  
	return [ x( point[0] ), y( point[1] )]
  } // dom2view
	
} // canvasobj