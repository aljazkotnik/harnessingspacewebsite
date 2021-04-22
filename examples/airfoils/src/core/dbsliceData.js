// `dbsliceData' is the object that contains all the loaded metadata, the loaded on-demand files, and all crossfilter functionality that allows interactive filtering. It can perform all the updates to the metadata that may be initiated by the user.
import * as FILE from "./fileClasses.js"
import { helpers } from "./helpers.js"

export var dbsliceData = {
	
		// Some properties.
		
		metadata: {
			
			categoricalProperties: [],
			ordinalProperties: [],
			line2dProperties: [],
			contour2dProperties: [],
			
			categoricalUniqueValues: [],
			histogramRanges: [],
			
			crossfilter: undefined,
		},
		
		files: [],
		merging: {},
	
		// Functionality for metadata - flatten!
		internal: {
			
			cfData: {
		
				initialise: function initialise(){
			  
					// Adds the crossfilter, it's dimensions, and any associated helper arrays to dbsliceData, if that is necessary.
					
					let cfData = {
						
						cf: crossfilter([]),
						
						categoricalDims: [],
						ordinalDims: [],
						taskDim : undefined,
						fileDim : undefined,
						
						filterSelected: [],
						histogramSelectedRanges: [],
						manuallySelectedTasks: [],
					
					}; // cfData
					

					cfData.fileDim = cfData.cf.dimension(d=>d.filenameId)
					cfData.taskDim = cfData.cf.dimension(d=>d.taskId)
					
					dbsliceData.metadata.crossfilter = cfData
					
				}, // initialise
						

				change: function(metadata){
					// Handle the change to the metadata. Simply exchange all the internal data. But, I may need to retain the filter settings?
					
					// Exchange the data.
					dbsliceData.metadata.crossfilter.cf.remove()
					dbsliceData.metadata.crossfilter.cf.add(metadata.data)
					
					// Resolve the differences between the old variables and the new variables.
					dbsliceData.internal.cfData.resolve.headerChange(metadata.header)
					
				}, // change
				
				
					
				// cfdata
				resolve: {
					
					headerChange: function(newHeader){
						
						let resolve = dbsliceData.internal.cfData.resolve
						let metadata = dbsliceData.metadata
						let cf = dbsliceData.metadata.crossfilter
						
						
						
						// Go through the new header. The changes require also the crossfilter dimensions to be adjusted.
						Object.keys(newHeader).forEach(function(key){
							
							// Find the differences for this category that need to be resolved. 'diff' has items aMinusB (in current, but not in new) and bMinusA ( in new, but not in current)
							let diff = helpers.setDifference(cf[key], newHeader[key])
							
							switch(key){
								case "categoricalProperties":
									// Metadata dimensions have precomputed unique values.
									resolve.dimensions(cf.categoricalDims, diff)
									resolve.uniqueValues(metadata.categoricalUniqueValues, diff)
								  break;
								
								case "ordinalProperties":
									// Data dimensions have corresponding histogram ranges.
									resolve.dimensions(cf.ordinalDims, diff)
									resolve.histogramRanges(metadata.histogramRanges, diff)
								  break;
								  
								case "line2dProperties":
								case "contour2dProperties":
									// Nothing apart from the default change of the options in the header needs to be done.
								  break;
								
							} // switch
							
							// Resolve the property arrays themselves.
							metadata[key] = newHeader[key]
							
						}) // forEach
						
					}, // headerChange
					
					dimensions: function dimensions(dims, diff){
					
						// Those in A, but not in B, must have their cf dimensions removed.
						diff.aMinusB.forEach(function(varName){
							delete dims[varName]
							
						})
					  
						// Those in B, but not in A, must have cf dimensions created.
						diff.bMinusA.forEach(function(varName){
							let newDim = dbsliceData.metadata.crossfilter.cf.dimension(function (d){return d[varName];})
						  
							dims[varName] = newDim
						})
						
					}, // dimensions
					
					uniqueValues: function(vals, diff){
					
						dbsliceData.internal.cfData.resolve.attributes(vals, diff, function (varName){
							// Find all the unique values for a particular variable.
							return helpers.unique( 
								  dbsliceData.metadata.crossfilter.cf.all().map(
									function (d){return d[varName]}
								  )
								);
						})
						
						
					}, // uniqueValues
					
					histogramRanges: function(vals, diff){
						
						dbsliceData.internal.cfData.resolve.attributes(vals, diff, function (varName){
							// Find the max range for the histogram.
							
							let tasks = dbsliceData.metadata.crossfilter.cf.all()
							
							return d3.extent(tasks, d=>d[varName])
						})
						
					}, // histogramRanges
					
					attributes: function (vals, diff, populate){
						// Vals is an object of attributes that  needs to be resolved. The resolution of the attributes is given by diff. Populate is a function that states how that attribute should be populated if it's being created.
						
						// Delete
						diff.aMinusB.forEach(function(varName){
							delete vals[varName]
						})
						
						// Variables that are in 'new', but not in 'old'.
						diff.bMinusA.forEach(function(varName){
							// If a populate function is defined, then create an entry, otherwise create an empty one.
							if(populate){
								vals[varName] = populate(varName)	
							} else {
								vals[varName] = []
							} // if
						})

					}, // attributes
					
				}, // cfData
				
			}, // cf
		
		}, // metadata
		
		
	
		// Handling of on-demand files.
		importing: {
			
			
			// PROMPT SHOULD BE MOVED!!
			prompt: function(requestPromises){
				// Only open the prompt if any of the requested files were metadata files!
				
				Promise.allSettled(requestPromises).then(function(loadresults){
					
					if(loadresults.some(res=>res.value instanceof metadataFile)){
					
						let allMetadataFiles = dbsliceData.library.retrieve(metadataFile)

						// PROMPT THE USER
						if(allMetadataFiles.length > 0){
							// Prompt the user to handle the categorication and merging.
							
							// Make the variable handling
							dbsliceDataCreation.make()
							dbsliceDataCreation.show()
							
						} else {
							// If there is no files the user should be alerted. This should use the reporting to tell the user why not.
							alert("None of the selected files were usable.")
						} // if
						
					} // if
										
				}) // then
				
			}, // prompt
			
			
			dragdropped: function(files){
				// In the beginning only allow the user to load in metadata files.
				
				let requestPromises
				let allMetadataFiles = dbsliceData.library.retrieve(metadataFile)
				if(allMetadataFiles.length > 0){
					// Load in as userFiles, mutate to appropriate file type, and then push forward.
					requestPromises = dbsliceData.importing.batch(userFile, files)
					
				} else {
					// Load in as metadata.
					requestPromises = dbsliceData.importing.batch(metadataFile, files)
				} // if
				
				dbsliceData.importing.prompt(requestPromises)
				
				
			}, // dragdropped
			
			
			single: function(classref, file){
				
				// Construct the appropriate file object.
				let fileobj = new classref(file)
				
				// Check if this file already exists loaded in.
				let libraryEntry = dbsliceData.library.retrieve(undefined, fileobj.filename)
				if(libraryEntry){
					fileobj = libraryEntry
				} else {
					// Initiate loading straight away
					fileobj.load()
					
					// After loading if the file has loaded correctly it has some content and can be added to internal storage.
					dbsliceData.library.store(fileobj)
				} // if
				

				// The files are only stored internally after they are loaded, therefore a reference must be maintained to the file loaders here.
				return fileobj.promise
				
			}, // single
			
			batch: function(classref, files){
				// This is in fact an abstract loader for any set of files given by 'files' that are all of a file class 'classref'.
				
				
				let requestPromises = files.map(function(file){
					return dbsliceData.importing.single(classref, file)
				})
				
				return requestPromises
				
				
			}, // batch
			
		}, // importing
		
		library: {
			
			update: function(urlsToKeep){
				// Actually, just allow the plots to issue orders on hteir own. The library update only removes files that are not explicitly needed.				
				
				let filesForRemoval = dbsliceData.files.filter(function(file){
					// This should only remove on-demand files though - don't let it remove metadata or sessionFiles. All on-demand files are a subclass of 'onDemandFile'.
					let flag = false
					if(file instanceof FILE.onDemandFile){
						flag = !urlsToKeep.includes(file.url)
					} // if
					
					return flag
				}) // filter
				
				filesForRemoval.forEach(function(file){
					let i = dbsliceData.files.indexOf(file)
					dbsliceData.files.splice(i,1)
				}) // forEach
				
			}, // update
			
			store: function(fileobj){
				
				
				

				fileobj.promise.then(function(obj_){
					
					if(obj_ instanceof FILE.sessionFile){				
						// Session files should not be stored internally! If the user loads in another session file it should be applied directly, and not in concert with some other session files.
						sessionManager.onSessionFileLoad(obj_)
						
					} else {
						// Other files should be stored if they have any content.
						if(obj_.content){
							dbsliceData.files.push(fileobj)
						} // if

					} // if
					
				})
					
				

				
			}, // store
			
			retrieve: function(classref, filename){
				// If filename is defined, then try to return that file. Otherwise return all.
				
				let files
				if(filename){
				
					files = dbsliceData.files.filter(function(file){
						return file.filename == filename
					}) // filter
					files = files[0]
					
				} else {
					
					files = dbsliceData.files.filter(function(file){
						return file instanceof classref
					}) // filter
					
				} // if
				
				return files
				
			}, // retrieve
			
			remove: function(classref, filename){
				
				// First get the reference to all hte files to be removed.
				let filesForRemoval = dbsliceData.library.retrieve(classref, filename)
				
				// For each of these find it's index, and splice it.
				filesForRemoval.forEach(function(file){
					let i = dbsliceData.files.indexOf(file)
					dbsliceData.files.splice(i,1)
				})
				
			}, // remove
			
			
		}, // library
			
		// Move to session manager
		exporting : {
				
			session : {
				
				download: function(){
					
					
					
					// Make a blob from a json description of the session.
					var b = dbsliceData.exporting.session.makeTextFile( sessionManager.write() )
					
					
					// Download the file.
					var lnk = document.createElement("a")
					lnk.setAttribute("download", "test_session.json")
					lnk.setAttribute("href", b)
					
					var m = d3.select( document.getElementById("sessionOptions").parentElement ).select(".dropdown-menu").node()
					m.appendChild(lnk)
					lnk.click()	
					
				}, // download
				
				makeTextFile: function makeTextFile(text) {
					var data = new Blob([text], {
						type: 'text/plain'
					}); 
					
					var textFile = null;
					// If we are replacing a previously generated file we need to
					// manually revoke the object URL to avoid memory leaks.
					if (textFile !== null) {
						window.URL.revokeObjectURL(textFile);
					} // if

					textFile = window.URL.createObjectURL(data);
					
				  return textFile;
				}, // makeTextFile
				
				
			}, // session
			
		}, // exporting

		
	} // dbsliceData
	