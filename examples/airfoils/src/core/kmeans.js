/*
kmeans_dev: the groups are determined as points on the screen. Therefore on group initialisation first points must be assigned based on their on-screen position.

kmeans: the groups are built by the user. The on-screen positions are not required anymore.

*/


export class kgroup {
  constructor(refobj, pos){
	this.refobj = refobj
	this.pos = pos;
	this.previous = []
	this.members = [];
	this.changed = true;
	this.id = 0;
  } // constructor

  average(accessor){
	let obj = this

	let n = obj.members.length
	return obj.members.reduce(function(acc, member){
		let vals = accessor(member)
		if(acc){
			acc = acc.map(function(v,i){return v + vals[i]/n})
		} else {
			acc = vals.map(function(v){return v/n})
		} // if
		return acc
	}, undefined) // reduce

  } // average
  
  update(){
	let obj = this
	obj.cp = obj.average(d=>d.cp)
	obj.pos = obj.average(d=>d.pos)
  } // update
} // kgroup
	
	
export class kmeans {
  constructor(points){
	// The incoming points can be complicated objects. Wrap them appropriately for internal use. The k-means object will require an accessor to hte on-screen position of the incoming objects, as well as to the array that should be used in the k-means. 
	  
	this.groups = []
	this.points = points
	this.i = 0
  } // constructor
	
  addgroup(group){
	let obj = this
	
	// Must have less groups than points!
	if((obj.groups.length < obj.points.length) 
	&& (group instanceof kgroup)){
	
		// When a new group is added the groups should be reinitialised.
		obj.groups.push( group )
	
	} // if
	
  } // addgroup

  groupinit(){
	let obj = this
	
	// Update group ids.
	obj.groups.forEach(function(group, i){
		group.id = i
		group.members = obj.points.filter(function(point){
			point.group = group
			return group.refobj.sprites.includes(point.refobj)
		}) // filter
		
		// Calculate the centroid as well.
		group.cp = group.average(d=>d.cp)
	})
	
	
	// Find unassigned points
	let unassigned = obj.points.filter(function(point){
		return !obj.groups.some(function(group){
			return group.members.includes(point)
		})
	}) // filter
	

	// Distribute the points between the groups. But only those that are not yet assigned!!
	unassigned.forEach(function(point, i){
		let closest = kmeans.findclosestgroup(point, obj.groups, d=>d.cp)
		closest.group.members.push(point)
		point.group = closest.group
		
	})
	
	
	// FORCE THE GROUPS TO HAVE MEMBERS!!
	obj.groups.forEach(function(group){
		if(group.members.length < 1){
			// Find the group with the maximum amount of points.
			let largest = obj.groups.reduce(function(acc, group){
				return acc.members.length > group.members.length ? acc : group
			}, {members: []}) // reduce
			
			let donated = largest.members.splice(0,1)[0]
			
			group.members.push(donated)
			donated.group = group
		} // if
	})

  } // groupinit
	
  clear(){
	let obj = this
	obj.groups = []
  } // clear
  
	
  cluster(){
	let obj = this
	
	obj.groupinit()
	if(obj.groups.length > 1){
	
		// Calculate the centroids.
		obj.i = 0
		while( obj.groups.some(function(group){return group.changed}) ){
			
			
			
			let t0 = performance.now()
			obj.step()
			let t1 = performance.now()
			
			console.log("step:", obj.i, " dt: ", t1 - t0, "ms")
			
			
			if(obj.i > 50){
				console.log("Iteration limit exceeded")
				break;
			} // if
			
		} // while
	
	} // if

  } // cluster
  
  step(){
	
	let obj = this
	
	// Recalculate centroids, purge the membership, but keep a log.
	obj.groups.forEach(function(group){
		group.update()
		group.previous = group.members
	}) // forEach
	
	// Not all hte sprites should move at once!! Just move one at a time - the one with the largest distance to its group centre.
	let move = obj.points.reduce(function(acc, point){
		let closest = kmeans.findclosestgroup(point, obj.groups, d=>d.cp)
		
		if(acc.point == undefined){
			acc.point = point
			acc.dist = closest.dist
		} else {
			if(acc.dist < closest.dist){
				acc.point = point
				acc.dist = closest.dist
			} // if
		} // if
		
		return acc
		
	}, {point: undefined, dist: undefined})
	
	// Try one more thing - minimise the global distances between clusters by trading. So the difference between current group and closest group
	
	let closest = kmeans.findclosestgroup(move.point, obj.groups, d=>d.cp)
	closest.group.members.push(move.point)
	move.point.group = closest.group
		
	
	// Recalculate membership.
	obj.groups.forEach(function(group){
		group.members = obj.points.filter(function(point){return group == point.group})
	}) // forEach
	
	
	// Check if there is a difference between the previous and current group membership.
	obj.groups.forEach(function(group){
		
		let isMembershipSame = aContainsB(group.previous, group.members) 
		                    && aContainsB(group.members , group.previous)
		
		group.changed = !isMembershipSame;
		
	}) // forEach
	
	
	obj.i += 1
	
  } // step
	
	
  static findclosestgroup(point, groups, accessor){
	
	return groups.reduce(function(current, group){
		let dist = kmeans.euclidean(accessor(group), accessor(point))
		// let dist = kmeans.correlation(accessor(group), accessor(point))
		if(dist < current.dist){
			current.group = group
			current.dist = dist
		} // if
		return current
	}, {group: undefined, dist: Number.POSITIVE_INFINITY})
	
  } // findclosestgroup
  
  static euclidean(centroid, sprite){
	// centroid and the sprite should already be the data: `spriteobj.file.content[0].data.Cp'. They are n-dimensional vectors of the same length.
	
	let s = 0
	for(let i=0; i<centroid.length; i++){
		s += (centroid[i] - sprite[i])**2
	} // for
	
	// Note that s is not square-rooted. Since we're just comparing the distances it doesn't need to be.
	return s
  } // euclidean
  
  static correlation(centroid, sprite){
	// centroid and the sprite should already be the data: `spriteobj.file.content[0].data.Cp'. They are n-dimensional vectors of the same length.
	
	let s = 0
	for(let i=0; i<centroid.length; i++){
		s += 1/centroid[i]*sprite[i]
	} // for
	
	// Note that s is not square-rooted. Since we're just comparing the distances it doesn't need to be.
	return s
  } // correlation
	
} // kmeans


function aContainsB(A, B){
	// A.some(...) => is any element of A not present in B?
	// Returns true if some elements are missing, and false if not. Therefore !A.some(...) => are all elements of A in B?
	return !A.some(function(a){
		// !B.includes(a) => is B missing a?
		return !B.includes(a)
	})
} // aContainsB