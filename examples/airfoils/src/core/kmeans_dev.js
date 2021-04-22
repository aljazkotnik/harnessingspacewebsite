class kgroup {
  constructor(members, refobj){
	this.pos = undefined
	this.refobj = refobj
	this.previous = []
	this.members = members;
	this.changed = true;
	this.id = 0;
	
	this.update()
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
  
  reviewmembership(allpoints){
	var obj = this
	  
	// Make review of membership.
	obj.members = allpoints.filter(function(point){
		return point.groupid == obj.id
	})
	
	// See if it changed from before.
	let isMembershipSame = aContainsB(obj.previous, obj.members) 
						&& aContainsB(obj.members , obj.previous)
	obj.changed = !isMembershipSame;
	  
  } // reviewmembership
  
} // kgroup


class kpoint {
  constructor(spriteobj){
	
	this.refobj = spriteobj,
	this.pos = spriteobj.midpoint,
	this.cp = spriteobj.file.content[0].data.Cp
	  
  } // constructor
	
  findclosestgroup(groups, accessor){
	let obj = this
	
	return groups.reduce(function(current, group){
		
		// Debugging
		if(accessor(group) == undefined){
			console.log(current, group)
		} // if
		
		let dist = kmeans.euclidean(accessor(group), accessor(obj))
		if(dist < current.dist){
			current.group = group
			current.dist = dist
		} // if
		return current
	}, {group: undefined, dist: Number.POSITIVE_INFINITY})
	
  } // findclosestgroup
  
  joinclosestgroup(groups, accessor){
	let obj = this
	
	let closest = obj.findclosestgroup(groups, accessor)
	obj.groupid = closest.group.id
	  
  } // joinclosestgroup
	 
} // kpoint
	
	
export class kmeans {
  constructor(spriteobjs, groupobjs){
	// The incoming points can be complicated objects. Wrap them appropriately for internal use. The k-means object will require an accessor to hte on-screen position of the incoming objects, as well as to the array that should be used in the k-means.
	this.groups = []
	this.i = 0
	this.points = spriteobjs.map(function(spriteobj){
		return new kpoint(spriteobj)
	}) // map
	
	
	let obj = this
	groupobjs.forEach(function(spritegroup){
		let initmembers = obj.points.filter(function(point){
			return spritegroup.sprites.includes(point.refobj)
		})
		obj.groups.push(new kgroup(initmembers, spritegroup))
	}) // forEach
	
  } // constructor

  groupinit(){
	// Initialisation of groups based on existing piles.
	  
	let obj = this
	
	// Update group ids.
	obj.groups.forEach(function(group, i){
		group.id = i
	}) // forEach

	// Distribute the points between the groups.
	obj.points.forEach(function(point, i){
		point.joinclosestgroup(obj.groups, d=>d.cp)
	}) // forEach
	
	
	// Make the groups review their memberships.
	obj.groups.forEach(function(group){
		group.reviewmembership(obj.points)
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
			
			
			// Emergency break.
			if(obj.i > 100){
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
		group.members = []
	}) // forEach
	
	// Redistribute sprites
	obj.points.forEach(function(point){
		// Find the closest group.
		point.joinclosestgroup(obj.groups, d=>d.cp)
	}) // forEach
	
	
	// Collect the members for all individual groups.
	obj.groups.forEach(function(group){
		group.reviewmembership(obj.points)
	}) // forEach

	obj.i += 1
	
  } // step
	
  
  static euclidean(centroid, sprite){
	// centroid and the sprite should already be the data: `spriteobj.file.content[0].data.Cp'. They are n-dimensional vectors of the same length.
	
	let s = 0
	for(let i=0; i<centroid.length; i++){
		s += (centroid[i] - sprite[i])**2
	} // for
	
	// Note that s is not square-rooted. Since we're just comparing the distances it doesn't need to be.
	return s
  } // euclidean
	
} // kmeans


function aContainsB(A, B){
	// A.some(...) => is any element of A not present in B?
	// Returns true if some elements are missing, and false if not. Therefore !A.some(...) => are all elements of A in B?
	return !A.some(function(a){
		// !B.includes(a) => is B missing a?
		return !B.includes(a)
	})
} // aContainsB