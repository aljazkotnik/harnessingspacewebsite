export var sessionData = {
	
		title: "New session",
		
		plotRows: []
	
		

		
		write: function(){
			
			var contentobj = {
				mergingInfo: dbsliceData.merging,
				sessionInfo: {
					title: dbsliceData.session.title,
					plotRows: dbsliceData.session.plotRows.map(function(plotrow){
						return {
							title: plotrow.title,
							type: plotrow.type,
							plots: plotrow.plots.map(prunePlot)
						}
					}) // map
					
				}
			}
			
			
			function prunePlot(plotCtrl){
				// Only a few things need to be retained: yProperty, xProperty and sliceId
				
				let saveCtrl = {
					plottype: plotCtrl.plotFunc.name,
				}
				
				if(plotCtrl.view.xVarOption){
					saveCtrl.xProperty = plotCtrl.view.xVarOption.val
				} // if
				
				if(plotCtrl.view.yVarOption){
					saveCtrl.yProperty = plotCtrl.view.yVarOption.val
				} // if
				
				if(plotCtrl.view.sliceId){
					saveCtrl.sliceId = plotCtrl.view.sliceId
				} // if
				
				return saveCtrl
			} // prunePlot
			
			
			return JSON.stringify( contentobj )

			
			// Write together.
			
		}, // write
		
		
		
	} // sessionManager
	