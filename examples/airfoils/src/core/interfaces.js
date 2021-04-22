export var correlations = {
	
	build: function(scores){
		
		// Use blue or red to encode whether it's negative or positive?
		let div = d3.select("#correlation-container")
		let svg = div.select("svg")
		let svgrect = svg.node().getBoundingClientRect()
		
		// Get a palette
		
		let score2px = {
			clr: d3.scaleLinear()
				.domain([0,1])
				.range([0, 0.75]),
			x: d3.scaleLinear()
				.domain([-1, 1])
				.range([0.1*svgrect.width, 0.9*svgrect.width]),
			y: d3.scaleLinear()
				.domain([-1, 1])
				.range([0.1*svgrect.height, 0.9*svgrect.height])
		} // score2px
		
			
		// The same variable can have different scores in two directions. How to color code that?
		// var color = d=>d3.interpolateGreens(score2clr(Math.abs(d.score[axis])))

		// Draw the full correlations on the screen.
		
		
		correlations.drawscores(div, "metadata", scores.full, score2px, "gainsboro")
		correlations.drawscores(div, "tagged", scores.partial, score2px, "yellow")
		
		
		// Draw the axis.
		correlations.drawaxis(svg, score2px)

		
		// Position hte 
		div.select(".btn-danger")
		  .style("left", window.innerWidth - 80 + "px")
		  .style("top", 20 + "px")
	
    }, // build
	
	
	drawaxis: function(svg, score2px){
		
		svg.selectAll("g.axis").remove()
		let svgrect = svg.node().getBoundingClientRect()
		
		let xaxis = d3.axisBottom(score2px.x);
		let yaxis = d3.axisLeft(score2px.y);
		
		svg.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0," + svgrect.height/2 +")")
			.call(xaxis);
			
		svg.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(" + svgrect.width/2 +",0)")
			.call(yaxis);
		
		
		
		
	}, // drawaxis
	
	drawscores: function(div, gclass, scores, score2px, color){
		
		div.selectAll("g." + gclass).remove()
		
		let variables = div.selectAll("g." + gclass)
		  .data(scores)
		  .enter()
			.append("g")
			  .attr("class", gclass)
		
		variables
		  .append("button")
			.attr("class", "btn-small")
			.style("position", "absolute")
			.style("background-color", color)
			.style("left", d=>score2px.x(d.score.x)+"px")
			.style("top", d=>score2px.y(d.score.y)+"px")
			.html(d=>d.name)
		
	}, // drawscores

} // correlations