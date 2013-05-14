/*
Copyright (C) 2013  Daniel Reid

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
Contains:
	DragWeights
	DragArrow
	CompArrow
	Piston
	Heater
	Stops
	Trigger
in that order
*/
compressorFuncs = {
	getBinPts: function(pos, slant, dims, thickness){
		var pts = []
		var thickness = defaultTo(5, thickness);
		pts.push(P(pos.x - slant*dims.dx/2, pos.y - dims.dy));
		pts.push(P(pos.x - dims.dx/2, pos.y));
		pts.push(P(pos.x + dims.dx/2, pos.y));
		pts.push(P(pos.x + slant*dims.dx/2, pos.y - dims.dy));
		pts.push(P(pos.x + slant*dims.dx/2+thickness, pos.y - dims.dy));
		pts.push(P(pos.x + dims.dx/2 + thickness, pos.y +thickness));
		pts.push(P(pos.x - dims.dx/2 - thickness, pos.y +thickness));
		pts.push(P(pos.x - slant*dims.dx/2 - thickness, pos.y - dims.dy));
		pts.push(P(pos.x - slant*dims.dx/2, pos.y - dims.dy));
		return pts;
	},
}

objectFuncs = {
	setupStd: function() {
		this.enabled = true;
		this.removed = false;
		if (this.handle) this.addToCurLevel();
		this.wrapRemove();
	},
	wrapRemove: function() {
		var removeOld = this.remove;
		this.remove = function() {
			this.removed = true;
			if (this.handle) this.removeFromCurLevel();
			removeOld.apply(this);
		}
	},
	addToCurLevel: function() {
		
		curLevel[curLevel.key(this.type, this.handle)] = this;
	},
	removeFromCurLevel: function() {
		var key = curLevel.key(this.type, this.handle);
		//removing 'safties'.  This will be replaced soon anyway
		// if (curLevel[key] == this) {
			delete curLevel[key];
		// } else {
			// console.log("Trying to remove " + key + " but handle doesn't belong to this object");
		// }
	},
	pickSliderPos: function(){
		var xPos;
		if (this.wall) {
			xPos = (this.wall[0].x + this.wall[1].x)/2;
		} else if (this.pos && this.dims) {
			xPos = this.pos.x + this.dims.dx/2;
		} else if (this.pos) {
			xPos = this.pos.x;
		}
		if (!xPos) {
			return this.checkForMigrateCenter();
			//ooh - maybe make it check if that div is empty.  If not, move contents of center to left/right
		} else {
			var width = $('#main').width();
			var segmentWidth = width/3;
			var divDest = Math.floor(xPos/segmentWidth);
			if (divDest==0) {
				return 'left';
			} else if (divDest==1) {
				return this.checkForMigrateCenter();
			} else if(divDest==2) {
				return 'right';
			}
		}
		return this.checkForMigrateCenter();
	},
	addSlider: function(title, attrs, handlers, position, sliderWrapper, sliderTitleWrapper){
		if (!(sliderWrapper && sliderTitleWrapper)) {
			if (!position) {
				position = this.pickSliderPos();
			}
			
			switch (position) {
				case 'left':
					sliderWrapper = $('.active #sliderHolderLeft');
					$('.active #sliderHolderSingle').hide();
					$('.active #sliderHolderDouble').show();
					break;
				case 'center':
					sliderWrapper = $('.active #sliderHolderCenter');
					$('.active #sliderHolderSingle').show();
					$('.active #sliderHolderDouble').hide();
					break;
				case 'right':
					sliderWrapper = $('.active #sliderHolderRight');
					$('.active #sliderHolderSingle').hide();
					$('.active #sliderHolderDouble').show();
					break;
			}
			sliderTitleWrapper = sliderWrapper;
		}
		var sliderSelector = '.active #slider' + this.handle.toCapitalCamelCase();
		var sliderWrapper = makeSlider(sliderTitleWrapper, sliderWrapper, sliderSelector, title, attrs, handlers)
		if (!this.sliderWrapperSelectors) this.sliderWrapperSelectors = [];
		this.sliderWrapperSelectors.push('.active #' + $(sliderTitleWrapper).attr('id'));
		this.sliderWrapperSelectors.push('.active #' + $(sliderWrapper).attr('id'));
		return sliderSelector;
	},
	//remove this. can't clone sliders.  or make more clever to clone it thyself method
	checkForMigrateCenter: function() {
		if ($('#sliderHolderCenter').html().killWhiteSpace() != '') {
			this.migrateCenterSlider();
			return 'right';
		} else {
			return 'center';
		}
	},
	migrateCenterSlider: function() {
		var centerHTML = $('#sliderHolderCenter').html();
		$('#sliderHolderCenter').html('');
		$('#sliderHolderLeft').html(centerHTML);
	},
	removeSlider: function() {
		//can be seperate wrappers for title, slider
		if (this.sliderWrapperSelectors) {
			for (var wrapperIdx=0; wrapperIdx<this.sliderWrapperSelectors.length; wrapperIdx++) {
				$(this.sliderWrapperSelectors[wrapperIdx]).html('');
			}
		}
		
	},
	hideSliderDivs: function(){
		$('.active #sliderHolderSingle').hide();
		$('.active #sliderHolderDouble').hide();
	},
	valToPercent: function(val) {
		return 100*(val-this.min)/(this.max-this.min);
	},
	percentToVal: function(percent) {
		return (percent*(this.max-this.min)/100+this.min);
	},
	pressureToMass: function(pressure) {
		return pressure*(this.wall[1].x-this.wall[0].x)/(pConst*g);
	},
	massToPressure: function(mass) {
		return mass*pConst*g/(this.wall[1].x-this.wall[0].x);
	},
	toggle: function() {
		if (this.enabled) {
			this.disable();
		} else {
			this.enable();
		}
	}
}
//////////////////////////////////////////////////////////////////////////
//DRAG WEIGHTS
//////////////////////////////////////////////////////////////////////////

function DragWeights(attrs){
	//Can probably remove energy bar stuff
	this.type = 'DragWeights';
	this.handle = 				attrs.handle;
	this.tempWeightDefs = 		attrs.weightDefs;
	this.wallInfo = 			defaultTo(0, attrs.wallInfo);
	this.wall = 				walls[this.wallInfo];
	this.zeroY = 				defaultTo(this.wall[2].y, attrs.min);
	this.pistonPt =				defaultTo(this.wall[0], attrs.pistonPt); //this will not work with just data based levels.  If I want this, will need to store as {wallInfo, ptIdx}
	this.pistonOffset =			defaultTo(undefined, attrs.pistonOffset);
	this.wallHandler = 			defaultTo('cPAdiabaticDamped', attrs.compMode);
	this.binY = 				defaultTo(myCanvas.height-15, attrs.binY);
	this.blockCol = 			defaultTo(Col(224, 165, 75), attrs.blockCol);
	this.binCol = 				defaultTo(Col(150, 150, 150), attrs.binCol);
	
	attrs.pInit !== undefined ? this.massInit = this.pressureToMass(attrs.pInit) : this.massInit = this.pressureToMass(1);

	this.binHeight = 			defaultTo(45, attrs.binHeight);
	this.weightDimRatio = 		defaultTo(.5, attrs.weightDimRatio);
	this.moveSpeed =			defaultTo(20, attrs.moveSpeed);
	this.weightScalar = 		defaultTo(70, attrs.weightScalar);//specific volume
	this.displayText = 			defaultTo(true, attrs.displayText);
	
	this.binSlant = 1.3;
	this.storeBinWidth = 110;
	this.storeBinSpacing = 60;
	this.pistonBinWidth = 150;
	this.pistonBinSpacing = 15;
	this.blockSpacing = 2;
	this.mass = this.massInit;
	this.massChunkName = 'dragWeights';
	this.weightsOnPiston = [];
	this.font = '12pt Calibri';
	this.fontCol = Col(255,255,255);
	this.binThickness = 5;
	
	this.trackingPts = [];
	this.wall.setMass(this.massChunkName, this.massInit);
	this.wall.recordPExt();
	this.wall.recordWork();
	this.wall.recordMass();
	
	this.setupStd();
	return this.init();
}

_.extend(DragWeights.prototype, objectFuncs, compressorFuncs, {
	init: function(){
		this.weightGroups = this.makeWeights(this.tempWeightDefs);
		this.bins = {};
		this.bins.store = this.makeStoreBins();
		this.bins.piston = this.makePistonBins();
		//this.dropAllstores();
		walls.setSubWallHandler(this.wallInfo, 0, this.wallHandler);
		if (!this.displayText) {
			this.draw = this.drawNoText;
		}
		addListener(curLevel, 'update', 'drawDragWeights' + this.wallInfo, this.draw, this);
		this.enable();
		this.wall.moveInit();
		this.dropAllIntoBins('instant');
		delete this.tempWeightDefs;
		return this;
		
	},
	remove: function(){
		this.wall.moveStop();
		this.trackingPts.map(function(pt) {pt.trackStop();});
		this.trackingPts.splice(0, this.trackingPts.length);
		removeListener(curLevel, 'update', 'drawDragWeights' + this.wallInfo);
		removeListener(curLevel, 'mousedown', 'weights' + this.wallInfo);
	},
	getWeightDims: function(weightDefs){
		var dims = {};
		var adjBinWidth = this.storeBinWidth - this.blockSpacing;
		var maxWidth = 0;
		var maxMass = 0;
		for (var groupIdx=0; groupIdx<weightDefs.length; groupIdx++){
			var weightDef = weightDefs[groupIdx];

			var width = Math.sqrt(weightDef.mass*this.weightScalar/this.weightDimRatio);
			
			if (Math.max(width, maxWidth) > maxWidth) {
				maxMass = weightDef.mass;
				maxWidth = width;
			}
			var height = width*this.weightDimRatio;
			dims[weightDef.name] = V(width, height);
		}
		if (maxWidth > adjBinWidth) {
			this.weightScalar = .99 * adjBinWidth * adjBinWidth * this.weightDimRatio / maxMass;
			return this.getWeightDims(weightDefs);
		}
		return dims;
	},
	
	nameWeights: function(weightDefs) {
		for (var weightIdx=0; weightIdx<weightDefs.length; weightIdx++) {
			weightDefs[weightIdx].name = 'grp' + weightIdx;
		}
	},
	assignMasses: function(weightDefs) {//pressure is the pressure per block
		for (var groupIdx=0; groupIdx<weightDefs.length; groupIdx++){
			weightDef = weightDefs[groupIdx];
			weightDef.mass = this.pressureToMass(weightDef.pressure);
		}
	},
	makeWeights: function(weightDefs){
		this.nameWeights(weightDefs);
		var weightGroups = {};
		this.assignMasses(weightDefs);
		var weightDims = this.getWeightDims(weightDefs)
		var weightId = 0;
		for (var groupIdx=0; groupIdx<weightDefs.length; groupIdx++){
			var weightDef = weightDefs[groupIdx];
			var weightGroup = {}; 
			weightGroup.name = weightDef.name;
			weightGroup.dims = weightDims[weightGroup.name];
			weightGroup.pressure = weightDef.pressure;
			weightGroup.mass = weightDef.mass;
			weightGroup.weights = [];
			for (var weightIdx=0; weightIdx<weightDef.count; weightIdx++){
				var weight = {};
				weight.pos = P(300,500);
				weight.name = weightDef.name;
				weight.status = '';
				weight.id = weightId;
				weightGroup.weights.push(weight)
				weightId++;
			}
			
			weightGroups[weightGroup.name] = weightGroup;
		}
		return weightGroups;
	},
	makeStoreBins: function(){
		var center = (this.wall[0].x + this.wall[1].x)/2;
		var bins = {};
		var numGroups = this.getNumGroups();
		var posX = center - this.storeBinWidth*(numGroups-1)/2 - this.storeBinSpacing*(numGroups-1)/2;
		for (var groupName in this.weightGroups){
			var weightGroup = this.weightGroups[groupName];
			bins[groupName] = this.makeStoreBin(posX, weightGroup);
			posX+=this.storeBinWidth + this.storeBinSpacing;
		}
		return bins;
	},
	makeStoreBin: function(posX, weightGroup){
		var bin = {}
		bin.pts = this.getBinPts(P(posX, this.binY), this.binSlant, V(this.storeBinWidth, this.binHeight), this.binThickness);
		bin.x = posX - this.storeBinWidth/2;
		bin.y = this.binY;
		bin.slots = this.getBinSlots(P(bin.x, bin.y), weightGroup);
		bin.visible = true;
		return bin;
	},
	makePistonBins: function(){

		var center = (this.wall[0].x + this.wall[1].x)/2;
		var bins = {};
		var numGroups = this.getNumGroups();
		var posX = center - this.pistonBinWidth*(numGroups-1)/2 - this.pistonBinSpacing*(numGroups-1)/2;
		for (var groupName in this.weightGroups){
			var weightGroup = this.weightGroups[groupName];
			bins[groupName] = this.makePistonBin(posX, weightGroup);
			posX+=this.pistonBinWidth + this.pistonBinSpacing;
		}
		return bins;	
	},
	makePistonBin: function(posX, weightGroup){
		var bin = {};
		if (this.pistonOffset) {
			var xOffset = this.pistonOffset.dx
			bin.pos = P(posX - this.pistonBinWidth/2, 0).movePt({dx:xOffset}).track({pt:this.pistonPt, noTrack:'x', offset:{dy:this.pistonOffset.dy}});
		} else {
			bin.pos = P(posX - this.pistonBinWidth/2, 0).track({pt:this.pistonPt, noTrack:'x'});
		}
		this.trackingPts.push(bin.pos);
		bin.slots = this.getPistonBinSlots(bin.pos, weightGroup);
		bin.visible = false;
		return bin
	},

	getBinSlots: function(pt, weightGroup){
		var numSlots = weightGroup.weights.length;
		var dims = weightGroup.dims;
		var numCols = Math.floor(this.storeBinWidth/(dims.dx + this.blockSpacing));
		var usedWidth = numCols*(dims.dx+this.blockSpacing);
		var unusedWidth = this.storeBinWidth-usedWidth;
		pt.x+=unusedWidth/2;
		var numRows = Math.ceil(numSlots/numCols);
		var slots = [];
		var y = pt.y - this.blockSpacing - dims.dy;
		for (var rowIdx=0; rowIdx<numRows; rowIdx++){
			var row = [];
			var x = pt.x + this.blockSpacing;
			for (var colIdx=0; colIdx<numCols; colIdx++){
				var pos = P(x, y);
				var isFull = new Boolean();
				var isFull = false;
				row.push(this.newSlot(isFull, pos, weightGroup.name, 'store', rowIdx, colIdx));
				x += dims.dx+this.blockSpacing;
			}
			slots.push(row);
			y -= dims.dy+this.blockSpacing;
		}
		return slots;
		
	},
	//HEY - GENERALIZE THESE TWO
	getPistonBinSlots: function(binPos, weightGroup){
		var numSlots = weightGroup.weights.length;
		var dims = weightGroup.dims;
		var numCols = Math.floor(this.pistonBinWidth/(dims.dx + this.blockSpacing));
		var usedWidth = numCols*(dims.dx+this.blockSpacing);
		var unusedWidth = this.pistonBinWidth-usedWidth;
		startX = binPos.x + unusedWidth/2;
		var numRows = Math.ceil(numSlots/numCols);
		var slots = [];
		var yOffset = this.blockSpacing;
		for (var rowIdx=0; rowIdx<numRows; rowIdx++){
			var row = [];
			var blockX = startX + this.blockSpacing;
			for (var colIdx=0; colIdx<numCols; colIdx++){
				var pos = P(blockX, 0).track({pt:binPos, offset:{dy:-(yOffset+dims.dy)}, noTrack:'x'});
				this.trackingPts.push(pos);
				var isFull = new Boolean();
				var isFull = false;
				row.push(this.newSlot(isFull, pos, weightGroup.name, 'piston', rowIdx, colIdx));
				blockX += dims.dx+this.blockSpacing;
			}
			slots.push(row);
			yOffset += dims.dy+this.blockSpacing;
		}
		return slots;
		
	},
	newSlot: function(isFull, pos, name, type, row, col){
		return {isFull:isFull, pos:pos, name:name, type:type, row:row, col:col};
	},
	binIsFull: function(type, size){
		var bin = this.bins[type][size];
		var rows = bin.slots;
		for (rowIdx=0; rowIdx<rows.length; rowIdx++){
			var row = rows[rowIdx];
			for (var colIdx=0; colIdx<row.length; colIdx++){
				var slot = row[colIdx]
				if(!slot.isFull){
					return false;
				}
			}
			
		}
		return true;
	},
	binIsEmpty: function(type, size){
		var bin = this.bins[type][size];
		var rows = bin.slots;
		for (rowIdx=0; rowIdx<rows.length; rowIdx++){
			var row = rows[rowIdx];
			for (var colIdx=0; colIdx<row.length; colIdx++){
				var slot = row[colIdx]
				if(slot.isFull){
					return false;
				}
			}
			
		}
		return true;			
	},
	allEmpty: function(type){
		var allEmpty = new Boolean();
		allEmpty = true;
		for (var binName in this.bins[type]){
			allEmpty = Math.min(allEmpty, this.binIsEmpty(type, binName));
		}
		return allEmpty;
	},
	weightCount: function(type, size){
		var bin = this.bins[type][size];
		var rows = bin.slots;
		var count = 0;
		for (rowIdx=0; rowIdx<rows.length; rowIdx++){
			var row = rows[rowIdx];
			for (var colIdx=0; colIdx<row.length; colIdx++){
				var slot = row[colIdx]
				count+=slot.isFull;
			}
			
		}
		return count;
	},
	getPistonMass: function(){
		var totalMass=0;
		for (var weightName in this.weightGroups) {
			var weightGroup = this.weightGroups[weightName];
			var weights = weightGroup.weights;
			var mass = weightGroup.mass;
			for (var weightIdx=0; weightIdx<weights.length; weightIdx++) {
				if (weights[weightIdx].status=='piston') totalMass+=mass;
			}
		}
		return totalMass+this.massInit;
	},
	dropAllIntoBins: function(special){
		for (var group in this.weightGroups) {
			var weightGroup = this.weightGroups[group];
			for (var weightIdx=0; weightIdx<weightGroup.weights.length; weightIdx++) {
				var weight = weightGroup.weights[weightIdx];
				if (weight.status=='piston') {
					weight.status = 'inTransit';
					weight.slot.isFull = false;
					this.takeOffPiston(weight);
					this.dropIntoBin(weight, 'store', special);
				} else if(weight.status!='store'/* && weight.status!='inTransit'*/) {
					weight.status = 'inTransit';
					this.dropIntoBin(weight, 'store', special);
				}//NOTE - BLOCKS AREADY MOVING WILL NOT GET DROPPED. SHOULD ADD DESTINATION AND IF DEST==PISTON, DROP TO BIN
				
			}
		}
		return this;
	},
	dropAllOntoPiston: function(special){
		for (var group in this.weightGroups){
			var weightGroup = this.weightGroups[group];
			for (var weightIdx=0; weightIdx<weightGroup.weights.length; weightIdx++){
				var weight = weightGroup.weights[weightIdx];
				if(weight.status=='store'){
					weight.status = 'inTransit';
					weight.slot.isFull = false;
					this.takeOffPiston(weight);
					this.dropIntoBin(weight, 'piston', special);
				}else if(weight.status!='piston'/* && weight.status!='inTransit'*/){
					weight.status = 'inTransit';
					this.dropIntoBin(weight, 'piston', special);
				}//NOTE - BLOCKS AREADY MOVING WILL NOT GET DROPPED. SHOULD ADD DESTINATION AND IF DEST==PISTON, DROP TO BIN
				
			}
		}
		return this;
	},
	dropIntoBin: function(weight, binType, special){
		var self = this;
		weight.status = 'inTransit';
		var dropSlotInfo = this.getDropSlot(weight.name, binType);
		var slot = dropSlotInfo.slot;
		slot.isFull = true;
		weight.slot = slot;
		var slotIdNum = dropSlotInfo.id;
		if (special == 'instant') {
			this.dropInstant(weight, slot);
		} else {

			var uniqueNamePiece = weight.name+weight.id + 'endId' + this.wallInfo;
			var listenerName = 'moveWeight'+ uniqueNamePiece + binType+slotIdNum;
			if (removeListenerByName(curLevel, 'update', uniqueNamePiece)) {
				weight.slot.isFull = false;
				weight.slot = undefined;
			};
			
			addListener(curLevel, 'update', listenerName,
				function(){
					var slotPos = slot.pos;
					var UV = V(slotPos.x-weight.pos.x, slotPos.y-weight.pos.y).UV();
					if (validNumber(UV.dx) !== false && validNumber(UV.dy) !== false) {
						weight.pos.x = stepTowards(weight.pos.x, slotPos.x, UV.dx*this.moveSpeed);
						weight.pos.y = stepTowards(weight.pos.y, slotPos.y, UV.dy*this.moveSpeed);
					}
					if (this.weightArrived(weight, slot)) {
						removeListener(curLevel, 'update', listenerName);
						//weight.slot = slot;
						self.placeWeight(weight, slot);
					}
				},
			this);
		}
	},
	placeWeight: function(weight, slot) {
		weight.status = slot.type;
		if (weight.status=='piston') {
			this.putOnPiston(weight, slot);
		}
	},
	dropInstant: function(weight, slot) {
		weight.pos = slot.pos.copy();
		this.placeWeight(weight, slot);
	},
	weightArrived: function(weight, slot){
		return weight.pos.sameAs(slot.pos);
	},
	getDropSlot: function(weightName, binType){
		var bin = this.bins[binType][weightName];
		for (var rowIdx=0; rowIdx<bin.slots.length; rowIdx++){
			var row = bin.slots[rowIdx];
			for (var colIdx=0; colIdx<row.length; colIdx++){
				var curSlot = bin.slots[rowIdx][colIdx];
				if(!curSlot.isFull){
					return {slot:curSlot, id:String(rowIdx)+String(colIdx)};
				}
			}
		}
		alert('BOX IS FULL!  WHY IS THIS HAPPENING?');
	},
	getNumGroups: function(){
		var count = 0;
		for (idx in this.weightGroups){
			count++;
		}
		return count;
	},
	draw: function() {
		this.drawWeights();
		this.drawBins();
		this.drawBinLabels();
	},
	drawNoText: function() {
		this.drawWeights();
		this.drawBins();	
	},
	drawWeights: function(){
		var drawCanvas = c;
		for (var group in this.weightGroups) {
			var weightGroup = this.weightGroups[group]
			var weights = weightGroup.weights;
			var dims = weightGroup.dims;
			for (var weightIdx=0; weightIdx<weights.length; weightIdx++) {
				draw.fillRect(weights[weightIdx].pos, dims, this.blockCol, drawCanvas);
			}
		}
	},
	drawBins: function(){
		var drawCanvas = c;
		for (var binType in this.bins) {
			var typeBins = this.bins[binType];
			for (var binSize in typeBins) {
				var bin = typeBins[binSize];
				if (bin.visible) {
					draw.fillPts(bin.pts, this.binCol, drawCanvas);
				}
			}
		}
	},
	drawBinLabels: function(){
		for (var binName in this.bins.store) {
			var bin = this.bins.store[binName];
			if (bin.visible) {
				var x = bin.x + this.storeBinWidth/2
				var y = bin.y - this.binHeight;
				var mass = this.weightGroups[binName].pressure;
				var text = mass + ' bar each';
				draw.text(text, P(x, y), this.font, this.fontCol, 'center', 0, c);
			}
		}
	},
	putOnPiston: function(weight, slot){
		this.weightsOnPiston.push(weight);
		weight.pos.track({pt:slot.pos, noTrack:'x'});
		this.trackingPts.push(weight.pos);
		weight.status = 'piston';
		this.mass = this.getPistonMass();
		this.wall.setMass(this.massChunkName, this.mass);
	},	
	takeOffPiston: function(weight){
		for (var idx=0; idx<this.weightsOnPiston.length; idx++) {
			if (weight==this.weightsOnPiston[idx]) {
				this.weightsOnPiston.splice([idx],1);
			}
		}
		weight.pos.trackStop();
		this.trackingPts.splice(this.trackingPts.indexOf(weight.pos), 1);
		this.mass = this.getPistonMass();
		this.wall.setMass(this.massChunkName, this.mass);
	},
	mousedown: function(){
		var clicked = this.getClicked();
		if (clicked) {
			this.pickup(clicked);
			if (this.selected.cameFrom=='piston') {
				this.takeOffPiston(this.selected);
			}
			addListener(curLevel, 'mousemove', 'weights', this.mousemove, this)
			addListener(curLevel, 'mouseup', 'weights', this.mouseup, this)
		}

	},
	mousemove: function(){
		var mousePos = mouseOffset(myCanvas);
		var orig = this.selected.origPos
		var weightOrig = orig.weight;
		var mouseOrig = orig.mouse;
		var dx = mousePos.x - mouseOrig.x;
		var dy = mousePos.y - mouseOrig.y;
		var newX = weightOrig.x + dx;
		var newY = weightOrig.y + dy;
		this.selected.pos.x = newX;
		this.selected.pos.y = newY;
	},
	mouseup: function(){
		removeListener(curLevel, 'mousemove', 'weights');
		removeListener(curLevel, 'mouseup', 'weights');
		var dest = this.getDest();
		var selected = this.selected;
		this.dropIntoBin(this.selected, dest)
		delete this.origPos;
		this.selected = undefined;

	},
	getDest: function(){
		var selected = this.selected;
		var blockHeight = this.weightGroups[selected.name].dims.dy;
		if(selected.cameFrom=='piston' || selected.pos.y+blockHeight>this.zeroY){
			return 'store';
		}else{
			return 'piston';
		}
	},
	pickup: function(weight){
		weight.cameFrom = weight.status;
		weight.status = 'holding';
		var mousePos = mouseOffset(myCanvas);
		if (weight.slot!==undefined){
			weight.slot.isFull = false;
		}
		if(weight.status=='piston'){
			this.takeOffPiston(weight);
		}
		delete weight.slot;
		this.selected = weight;
		this.selected.origPos = {mouse:mousePos.copy(), weight:weight.pos.copy()};
	},
	getClicked: function(){
		for(var group in this.weightGroups){
			var group = this.weightGroups[group];
			for(var weightIdx=0; weightIdx<group.weights.length; weightIdx++){
				var weight = group.weights[weightIdx];
				var clickedOn = inRect(weight.pos, group.dims, myCanvas);
				if(clickedOn){
					if(weight.status=='inTransit'){
						return weight;
					}else{
						if(this.isOnTop(weight)){
							return weight;
						}
					}
				}
			}
		}
		return false
	},
	mouseOnWeight: function(dims, weightPos){
		var mousePos = mouseOffset(myCanvas);
		return mousePos.x>=weightPos.x && mousePos.x<=weightPos.x+dims.dx && mousePos.y<=weightPos.y && mousePos.y>=weightPos.y-dims.dy 
	},
	isOnTop: function(weight){
		var slot = weight.slot;
		var bin = this.bins[slot.type][weight.name]
		var colIdx = slot.col;
		for (var rowIdx=slot.row+1; rowIdx<bin.slots.length; rowIdx++){
			var curSlot = bin.slots[rowIdx][colIdx]
			if(curSlot.isFull==true){
				return false;
			}
		}
		return true;
	},
	mass: function(){
		return this.mass;
	},
	disable: function() {
		removeListener(curLevel, 'mousedown', 'weights' +this.wallInfo);
		this.enabled = false;
	},
	enable: function() {
		addListener(curLevel, 'mousedown', 'weights' + this.wallInfo, this.mousedown, this);
		this.enabled = true;
	},
})



//////////////////////////////////////////////////////////////////////////
//DRAG ARROW
	//This is meant to be used internally so I'm not adding 'setupStd' right now
//////////////////////////////////////////////////////////////////////////
function DragArrow(pos, rotation, cols, dims, name, drawCanvas, canvasElement, listeners, bounds){
	this.type = 'DragArrow';
	this.pos = pos;
	this.rotation = rotation;
	this.posInit = this.pos.copy()
	this.cols = cols;
	this.dims = dims
	this.name = name;
	this.listeners = listeners;
	this.drawCanvas = drawCanvas;
	this.canvasElement = canvasElement;
	this.bounds = bounds;
	if(this.bounds.x){
		if(!this.bounds.x.max){this.bounds.x.max = canvasElement.width - dims.dx;}
		if(!this.bounds.x.min){this.bounds.x.min = 0;}
	} else{
		this.bounds.x = {min:0, max:canvasElement.width - dims.dx};
	}
	if(this.bounds.y){
		if(!this.bounds.y.max){this.bounds.y.max = canvasElement.height - dims.dy;}
		if(!this.bounds.y.min){this.bounds.y.min = 0;}
	} else{
		this.bounds.y = {min:0, max:canvasElement.height - dims.dy};
	}
	this.pts = {};
	this.pts.outer = [];
	this.pts.inner = [];
	var width = this.dims.dx;
	var height = this.dims.dy;
	this.pts.outer.push(P(0,0));
	this.pts.outer.push(P(.9*width, -height/2));
	this.pts.outer.push(P(width, 0));
	this.pts.outer.push(P(.9*width, height/2));
	this.pts.outer.push(P(0,0));
	this.makeDrawFunc();
	this.clickListeners = this.makeListenerFuncs();
	return this;
}
DragArrow.prototype = {

	makeDrawFunc: function(){
		this.dirUV = V(Math.cos(this.rotation+Math.PI/2), Math.sin(this.rotation+Math.PI/2));
		this.draw = function(){};
		var self = this;
		var init = function(){
			self.drawCanvas.save();
			self.drawCanvas.translate(self.pos.x, self.pos.y);
			self.drawCanvas.rotate(self.rotation);
		}
		this.draw = extend(this.draw, init);
		if (this.cols.stroke) {
			var strokeFill = function(){draw.fillPtsStroke(self.pts.outer, self.cols.outer, self.cols.stroke, self.drawCanvas)};
			this.draw = extend(this.draw, strokeFill);
		} else {
			var fill = function(){draw.fillPts(self.pts.outer, self.cols.outer, self.drawCanvas)};
			this.draw = extend(this.draw, fill);
		}
		if (this.cols.inner || this.cols.onClick) {
			for (var ptIdx=0; ptIdx<this.pts.outer.length; ptIdx++) {
				var newPt = this.pts.outer[ptIdx].copy().movePt({dx:-this.dims.dx/2}).scale(P(0,0),.6).movePt({dx:this.dims.dx/2});
				this.pts.inner.push(newPt)
			}
			if( this.cols.inner) {
				this.cols.curInner = this.cols.inner;
			} else {
				this.cols.curInner = this.cols.outer;
			}
			
			var fill = function(){draw.fillPts(self.pts.inner, self.cols.curInner, self.drawCanvas)};
			this.draw = extend(this.draw, fill);
		}
		var restore = function(){self.drawCanvas.restore()};
		this.draw = extend(this.draw, restore);
	},
	
	makeListenerFuncs: function(){
		var listeners = this.listeners;
		var self = this;
		self.amSelected = new Boolean();
		if(listeners.onDown||listeners.onMove||listeners.onUp){
			var onClick = function(){}
			var onDown = function(){
				self.amSelected = self.checkSelected();
				if(self.amSelected){
					self.posInit = self.pos.copy();
					self.mouseInit = mouseOffset(self.canvasElement);
					onClick();
				}
			}
			if(self.cols.onClick){
				var changeInnerCol = function(){
					self.cols.curInner = self.cols.onClick
				}
				onClick = extend(onClick, changeInnerCol);
			}
			
			onClick = extend(onClick, function(){listeners.onDown.apply(self)});
			var onMove = this.makeMoveListenerFunc(self);
			onClick = extend(onClick, onMove)

			if(listeners.onUp){
				var onUp = this.makeUpListenerFunc(self);
				onClick = extend(onClick, onUp)
			}
			return onDown;
		}

	},
	makeMoveListenerFunc: function(self){
		var listeners = self.listeners;
		var moveFunc = function(){
			var mousePos = mouseOffset(self.canvasElement);
			var dMouseX = mousePos.x - self.mouseInit.x;
			var dMouseY = mousePos.y - self.mouseInit.y;
			var mouseDist = V(dMouseX, dMouseY);
			var arrowDist = mouseDist.dotProd(self.dirUV);
			var unBoundedX = self.posInit.x + (arrowDist*Math.cos(self.rotation+Math.PI/2));
			var unBoundedY = self.posInit.y + (arrowDist*Math.sin(self.rotation+Math.PI/2));
			self.pos.x = Math.max(self.bounds.x.min, Math.min(unBoundedX, self.bounds.x.max));
			self.pos.y = Math.max(self.bounds.y.min, Math.min(unBoundedY, self.bounds.y.max));
		}
		if(listeners.onMove){
			moveFunc = extend(moveFunc, function(){listeners.onMove.apply(self)});
		}
		var addMoveListeners = function(){addListener(curLevel, 'mousemove', 'dragArrow'+self.name, moveFunc, '')};
		
		var removeMoveListeners = function(){
			addListener(curLevel, 'mouseup', 'dragArrow'+self.name+'RemoveMove',
				function(){
					removeListener(curLevel, 'mousemove', 'dragArrow'+self.name);
					removeListener(curLevel, 'mouseup', 'dragArrow'+self.name+'RemoveMove');
				},
			'');
		}

		var toReturn = function(){
			addMoveListeners();
			
			removeMoveListeners();
		}
		
		return toReturn;
	},
	makeUpListenerFunc: function(self){
		var upFunc = function(){
			addListener(curLevel, 'mouseup', 'mouseup'+self.name, function(){self.listeners.onUp.apply(self)}, '');
			addListener(curLevel, 'mouseup', 'mouseup'+self.name+'remove', 
				function(){
					removeListener(curLevel, 'mouseup', 'mouseup'+self.name);
					removeListener(curLevel, 'mouseup', 'mouseup'+self.name+'remove');
				},
			'');
		}

		if(self.cols.onClick){
			var revertCols = function(){};
			if(self.cols.inner){
				revertCols = extend(revertCols, function(){self.cols.curInner = self.cols.inner;});
			}else{
				revertCols = extend(revertCols, function(){self.cols.curInner = self.cols.outer;});
			}
			var revertColsListener = function(){
				addListener(curLevel, 'mouseup', 'revertCols'+self.name,
					function(){
						revertCols();
						removeListener(curLevel, 'mouseup', 'revertCols'+self.name);
					},
				'');
			}
			upFunc = extend(upFunc, revertColsListener)
		}
	
		
		return upFunc;
	},
	setPos: function(pos) {
		if (typeof pos.x == 'number') this.pos.x = pos.x;
		if (typeof pos.y == 'number') this.pos.y = pos.y;
	},
	show: function(){
		addListener(curLevel, 'mousedown', 'dragArrow'+this.name, this.clickListeners, '');
		addListener(curLevel, 'update', 'drawDragArrow'+this.name, this.draw, '');
		return this;
	},
	hide: function(){
		removeListener(curLevel, 'mousedown', 'dragArrow'+this.name);
		removeListener(curLevel, 'update', 'drawDragArrow'+this.name);	
		return this;
	},
	reset: function(){
		this.pos = this.posInit.copy();
		removeListener(curLevel, 'update', 'moveWall');
		return this;
	},
	remove: function(){
		removeListener(curLevel, 'mousedown', 'dragArrow'+this.name);
		removeListener(curLevel, 'update', 'drawDragArrow'+this.name);
	},
	checkSelected: function(){
		var mousePos = mouseOffset(this.canvasElement);
		var unRotated = mousePos.rotate(this.pos, -this.rotation);
		var ULCorner = this.pos.copy().movePt({dy:-this.dims.dy/2});
		return ptInRect(ULCorner, this.dims, unRotated);
	},
}
//////////////////////////////////////////////////////////////////////////
//COMP ARROW
//////////////////////////////////////////////////////////////////////////
function CompArrow(attrs){
	this.type = 'CompArrow';
	var wallInfo = defaultTo(0, attrs.wallInfo);
	var speed = defaultTo(1.5, attrs.speed);
	var compMode = defaultTo('adiabatic', attrs.compMode);
	var makeStops = defaultTo(true, attrs.stops);
	var bounds = defaultTo({y:{min:30, max:350}}, attrs.bounds);
	this.wall = walls[wallInfo];
	var rotation = 0;
	var cols = {};
	cols.outer = Col(44, 118, 172);
	cols.onClick = Col(44, 118, 172);
	cols.inner = curLevel.bgCol.copy();
	var dims = V(25, 15);
	var handle = 'volDragger' + defaultTo('', attrs.handle);
	var drawCanvas = c;
	var canvasElement = canvas;
	var listeners = {};
	if (makeStops) {
		this.stops = new Stops({stopPt:{height:bounds.y.max}, wallInfo:wallInfo});
	}
	var wall = this.wall;
	listeners.onDown = function(){};
	listeners.onMove = function(){wall.changeSetPt(this.pos.y, compMode, speed)};
	listeners.onUp = function(){};
	this.dragArrowFunc = this.makeDragArrowFunc(this.wall, rotation, cols, dims, handle, drawCanvas, canvasElement, listeners, bounds);
	this.dragArrow = this.dragArrowFunc();
	this.setupStd();
	
	return this;
}
_.extend(CompArrow.prototype, objectFuncs, {
	remove: function(){
		this.dragArrow.remove();
		if(this.stop){
			this.stops.remove();
		}
	},
	makeDragArrowFunc: function(wall, rotation, cols, dims, handle, drawCanvas, canvasElement, listeners, bounds) {
		return function () {
			var pos = wall[1].copy();
			return new DragArrow(pos, rotation, cols, dims, handle, drawCanvas, canvasElement, listeners, bounds).show();
		}
	},
	enable: function() {
		this.dragArrow.setPos(this.wall[1].copy());
		this.dragArrow.show();
		this.enabled = true;
	},
	disable: function() {
		this.dragArrow.hide();
		this.enabled = false;
	}
}
)

//////////////////////////////////////////////////////////////////////////
//PISTON
//////////////////////////////////////////////////////////////////////////

function Piston(attrs){
	this.type = 'Piston';
	this.handle = attrs.handle;
	this.wallInfo = defaultTo(0, attrs.wallInfo);
	this.wall = walls[this.wallInfo];
	this.min = defaultTo(2, attrs.min);
	this.max = defaultTo(15, attrs.max);
	this.makeSlider = defaultTo(false, attrs.makeSlider);

	this.drawCanvas = defaultTo(c, attrs.drawCanvas);
	this.slant = .07;
	
	//must send neither or both of these.
	this.sliderWrapper = attrs.sliderWrapper;
	this.sliderTitleWrapper = attrs.sliderTitleWrapper;
	
	this.left = this.wall[0].x;
	this.width = this.wall[1].x-this.left;
	this.pistonPt = this.wall[0];
	var pInit = defaultTo(2, attrs.init)
	this.setPressure(pInit);

	this.height = 500;
	this.draw = this.makeDrawFunc(this.height, this.left, this.width);
	this.dataSlotFont = '12pt Calibri';
	this.dataSlotFontCol = Col(255,255,255);
	this.pStep = .05;
	var readoutLeft = this.left + this.width*this.slant;
	var readoutRight = this.left + this.width - this.width*this.slant;
	var readoutY = this.pistonBottom.pos.y-2+this.pistonPt.y;
	var readoutFont = '12pt calibri';
	var readoutFontCol = Col(255, 255, 255);
	this.readout = new Readout('pistonReadout' + this.handle.toCapitalCamelCase(), readoutLeft, readoutRight, readoutY, readoutFont, readoutFontCol, 'center', curLevel);
	this.wall.moveInit();
	
	this.wall.recordPExt();
	this.wall.recordWork();
	this.wallHandler = defaultTo('cPAdiabaticDamped', attrs.compMode);
	walls.setSubWallHandler(this.wallInfo, 0, this.wallHandler);		
	//this.wall.setDefaultReadout(this.readout);
	if (this.makeSlider) {
		this.sliderSelector = this.addSlider('Pressure', {value: this.pToPercent(pInit)}, [{eventType:'slide', obj:this, func:this.parseSlider}], this.sliderWrapper, this.sliderTitleWrapper);
		this.slider = $(this.sliderSelector);
	}
	
	this.setupStd();
	
	return this.show();
}

_.extend(Piston.prototype, objectFuncs, compressorFuncs, {
	makeDrawFunc: function(height, left, pistonWidth){
		var shaftThickness = 30;
		var shaftLength = height - 45;
		var plateTopHeight = 35;
		var plateThickness = 10;

		this.pistonTop = this.makeTop(left, pistonWidth, shaftThickness, shaftLength, height, plateTopHeight, plateThickness);
		
		var plateTopY = -height + shaftLength
		
		var plateBottomY = plateTopY + plateTopHeight;
		
		this.pistonBottom = this.makePlateBottom(P(left, plateBottomY), V(pistonWidth, plateThickness));
		

		
		
		
		var self = this;
		var drawFunc = function(){
			if(self.readout){
				self.setReadoutY();
			}
			self.drawCanvas.save();
			self.drawCanvas.translate(0, self.pistonPt.y);
			draw.fillPts(self.pistonTop.pts, self.pistonTop.col, self.drawCanvas);
			draw.fillRect(self.pistonBottom.pos, self.pistonBottom.dims, self.pistonBottom.col, self.drawCanvas);
			self.drawCanvas.restore();
		}
		return drawFunc;
	},
	makeTop: function(left, pistonWidth, shaftThickness, length, yInit, plateHeight, plateThickness){
		var slant = this.slant;
		var slantLeft = slant;
		var slantRight = 1-slant;
		var pts = new Array(14);
		var shaftX = left + pistonWidth/2 - shaftThickness/2;
		var shaftY = -yInit;
		var shaftPos = P(shaftX, shaftY);
		var col = Col(150, 150, 150);
		var dims = V(pistonWidth, plateHeight)
		var platePos = shaftPos.copy().movePt({dy:length}).position({x:left});;
		pts[0] = P(platePos.x,							platePos.y+dims.dy+1);
		pts[1] = P(platePos.x+dims.dx*slantLeft, 		platePos.y);
		pts[2] = P(shaftPos.x-dims.dx*slantLeft,		platePos.y);
		pts[3] = P(shaftPos.x,							platePos.y-5*dims.dy*slantLeft);
		pts[4] = P(shaftPos.x,							shaftPos.y);
		pts[5] = P(shaftPos.x + shaftThickness,			shaftPos.y);
		pts[6] = P(shaftPos.x + shaftThickness,			platePos.y-5*dims.dy*slantLeft);
		pts[7] = P(shaftPos.x + shaftThickness+dims.dx*slantLeft,			platePos.y);
		pts[8] = P(platePos.x+dims.dx*slantRight, 		platePos.y);
		pts[9] = P(platePos.x+dims.dx, 					platePos.y+dims.dy+1);
		pts[10] = P(platePos.x+dims.dx-plateThickness,			platePos.y+dims.dy+1);
		pts[11] = P(platePos.x+dims.dx*slantRight-plateThickness, platePos.y+plateThickness);
		pts[12] = P(platePos.x+dims.dx*slantLeft+plateThickness, 	platePos.y+plateThickness);
		pts[13] = P(platePos.x+plateThickness,					platePos.y+dims.dy+1);
		var col = Col(150, 150, 150);
		return {pts:pts, col:col};
	},
	makePlateBottom: function(pos, dims){
		var col = Col(100, 100, 100);
		dims.adjust(0,1);
		return {pos:pos, dims:dims, col:col};
	},
	enable: function() {
		if (this.slider) {
			this.slider.slider('option', 'disabled', false);
		}
		this.setMass(this.massStore);
		delete this.massStore;
		this.enabled = true;
	},
	disable: function() {
		if (this.slider) {
			this.slider.slider('option', 'disabled', true);
		}
		this.massStore = this.mass;
		this.setMass(0);
		this.enabled = false;
	},
	show: function(){
		addListener(curLevel, 'update', 'drawPiston'+this.handle, this.draw, '');
		this.readout.show();
		return this;
	},
	pToPercent: function(p) {
		return 100 * (p - this.min)/(this.max - this.min);
	},
	hide: function(){
		removeListener(curLevel, 'update', 'drawPiston'+this.handle);
		this.readout.hide();
	},
	parseSlider: function(event, ui){
	
		this.setPressure(this.percentToVal(ui.value));
	},
	setPressure: function(pressure){
		this.setMass(this.pressureToMass(pressure));
	},
	setMass: function(mass){
		this.mass = mass;
		this.wall.setMass('piston' + this.handle, this.mass);
	},
	setReadoutY: function(){
		this.readout.position({y:this.pistonBottom.pos.y-2+this.pistonPt.y});
	},
	remove: function(){
		this.wall.moveStop();
		this.wall.unsetMass('piston' + this.handle);
		this.hide();
		if (this.sliderId) {
			this.removeSlider();
		}
		this.hideSliderDivs();
		removeListener(curLevel, 'update', 'moveWalls');
	}
}
)

//////////////////////////////////////////////////////////////////////////
//HEATER
//////////////////////////////////////////////////////////////////////////
/*
If you give it wallInfo, heater will add its energy flow to wall.q
Still records its energy flow
*/
function Heater(attrs){
	this.type = 'Heater';
	/*
	dims.dx corresponds to long side w/ wires
	dims.dy corresponds to short side
	*/
	this.dims = defaultTo(V(100,40), attrs.dims);
	
	this.sliderWrapper = attrs.sliderWrapper;
	this.sliderTitleWrapper = attrs.sliderTitleWrapper;
	
	this.wall = walls[attrs.wallInfo];
	this.pos = attrs.pos ? attrs.pos : this.centerOnWall(attrs.wallInfo, this.dims);

	if (attrs.offset) this.pos.movePt(attrs.offset);
	this.wall.recordQ();
	this.makeSlider = defaultTo(true, attrs.makeSlider);
	this.handle = attrs.handle;
	this.drawCanvas = defaultTo(c, attrs.drawCanvas);
	this.cornerRound = .2;
	this.qRate = defaultTo(0, attrs.init);
	this.qRateMax = defaultTo(1, attrs.max);
	this.qRateMin = -this.qRateMax;
	this.rot = defaultTo(0, attrs.rotation);

	this.center = this.pos.copy().movePt(this.dims.copy().mult(.5));
	var colMax = defaultTo(Col(200,0,0), attrs.colMax);
	var colMin = defaultTo(Col(0,0,200), attrs.colMin);
	var colDefault = defaultTo(Col(100, 100, 100), attrs.colDefault);
	this.draw = this.makeDrawFunc(colMin, colDefault, colMax);
	this.wallPts = this.pos.roundedRect(this.dims, .3, 'ccw');
	this.addWallHump(this.wallPts);
	this.eAdded=0;
	if (attrs.liquidHandle) { //liquid invoked using liquid handle
		this.setupLiquidHeat(attrs.liquidHandle);
	}
	this.wallHandleHeater = 'heater' + this.handle.toCapitalCamelCase();
	this.setupStd();
	if (this.makeSlider) {

		this.sliderSelector = this.addSlider('Heater', {value:50}, 
			[{eventType:'slide', obj:this, func:this.parseSlider},
			{eventType:'slidestop', obj:this, func:function(event, ui){
												$(this.sliderSelector).slider('option', {value:50});
												ui.value=50;
												this.parseSlider(event, ui)
											}
			},		
			], this.sliderWrapper, this.sliderTitleWrapper);
	}
	this.init(this.wallHandleHeater);
}

_.extend(Heater.prototype, objectFuncs, {
	parseSlider: function(event, ui){
		this.setQRate(ui.value);
	},
	setQRate: function(val){		
		this.qRate = .02*(val-50)*this.qRateMax;
		if (this.liquid) {
			if (val != 50) {
				addListener(curLevel, 'update', 'heatLiquid' + this.handle, this.heatLiq, this);
			} else {
				removeListener(curLevel, 'update', 'heatLiquid' + this.handle);
			}
		}
		
	},
	heatLiq: function() {
		this.liquid.addQ(.15 * this.qRate * updateInterval);
	},
	addWallHump: function(wallPts) {
		var horizontalStarts = [];
		for (var i=0; i<wallPts.length - 1; i++) {
			if (wallPts[i].y == wallPts[i + 1].y) {
				horizontalStarts.push(i)
			}
		}
		if (wallPts[wallPts.length - 1].y == wallPts[0].y) {
			horizontalStarts.push(wallPts.length - 1);
		}
		var maxIdx = horizontalStarts[0];
		for (var i=0; i<horizontalStarts.length; i++) {
			maxIdx = wallPts[horizontalStarts[i]].y < wallPts[maxIdx].y ? horizontalStarts[i] : maxIdx;
		}
		var avgX = maxIdx == wallPts.length - 1 ? (wallPts[maxIdx].x + wallPts[0].x) / 2 : (wallPts[maxIdx].x + wallPts[maxIdx + 1].x) / 2;
		wallPts.splice(maxIdx + 1, 0, P(avgX, wallPts[maxIdx].y - 5));
	},
	disable: function() {
		var slider = $(this.sliderSelector);
		if (slider.length) $(slider).slider('disable');
		this.enabled = false;
	},
	enable: function() {
		var slider = $(this.sliderSelector);
		if (slider.length) $(slider).slider('enable');
		this.enabled = true;
	},
	makeDrawFunc: function(colMin, colDefault, colMax){
		var pos = this.pos;
		var dims = this.dims;
		var rnd = this.cornerRound;
		this.pts = this.getPts(pos, dims);
		rotatePts(this.pts, this.center, this.rot);
		var colorSteps = this.getColorSteps(colMin, colDefault, colMax)
		var self = this;
		var pts = this.pts;
		var drawFunc = function(){
			var sign = getSign(self.qRate);
			var steps = colorSteps[String(sign)];
			var fracToEnd = sign*self.qRate/self.qRateMax;
			
			var curCol = colDefault.copy().adjust(steps[0]*fracToEnd, steps[1]*fracToEnd, steps[2]*fracToEnd);
			draw.path(pts, curCol, self.drawCanvas);
		}
		return drawFunc;
	},
	centerOnWall: function(wallInfo, dims){
		var wall = walls[wallInfo];
		var center = (wall[3].x + wall[2].x)/2;
		var floor = wall[2].y;
		var floorSpacing = 30;
		var x = center - dims.dx/2;
		var y = floor - floorSpacing - dims.dy;
		return P(x, y);
	},
	getPts: function(pos, dims, rnd){
		var pts = new Array();
		var circlePos = pos.copy().movePt({dy:dims.dy/2});
		
		var forwardDx = dims.dy/2+2.5;
		var backwardDx = dims.dy/2-2.5;
		var numElipses = Math.floor((dims.dx-2*forwardDx)/(2*(forwardDx - backwardDx)));
		pts.push(circlePos.copy().movePt({dy:200}));
		pts.push(circlePos.copy());
		pts = pts.concat(this.halfElipse(circlePos, forwardDx, dims.dy/2, 0, 5));
		circlePos.movePt({dx:2*forwardDx});
	
		for (var elipseIdx=0; elipseIdx<numElipses; elipseIdx++){
			pts = pts.concat(this.halfElipse(circlePos, backwardDx, dims.dy/2, Math.PI, 5));
			circlePos.movePt({dx:-2*backwardDx});
			pts = pts.concat(this.halfElipse(circlePos, forwardDx, dims.dy/2, 0, 5));
			circlePos.movePt({dx:2*forwardDx});
		}
		
		pts.push(circlePos.copy());
		pts.push(circlePos.copy().movePt({dy:200}));
		this.endX = pts[pts.length-1].x;
		this.dims = V(this.endX-this.pos.x, dims.dy);
		this.center = this.pos.copy().movePt(this.dims.copy().mult(.5));
		return pts;
	},
	halfElipse: function(start, rx, ry, rot, numPts){
		//hey - this goes UP TO the point to complete the half circle
		var numPts = defaultTo(5, numPts);
		var pts = new Array(numPts);
		var rotPerPt = Math.PI/(numPts);
		var center = start.x + rx;
		var arcRot = Math.PI;
		for (var ptIdx=0; ptIdx<numPts; ptIdx++){
			var x = center + rx*Math.cos(arcRot);
			var y = start.y + ry*Math.sin(arcRot);
			pts[ptIdx] = P(x, y);
			arcRot += rotPerPt;
		}
		rotatePts(pts, start, rot);
		return pts;
	},
	getColorSteps: function(min, def, max){
		var steps = {};
		var down = [min.r-def.r, min.g-def.g, min.b-def.b];
		var up = [max.r-def.r, max.g-def.g, max.b-def.b];
		steps['-1']=down;
		steps['1']=up;
		return steps;
	},
	init: function(wallHandleHeater){
		addListener(curLevel, 'update', 'drawHeater'+this.handle, this.draw, '');
		this.setupWalls(wallHandleHeater)
		this.eAdded=0;
	},
	setupWalls: function(wallHandleHeater){
		if (this.wall) {
			var handler = {func:this.hitAddQToWall, obj:this};
		} else {
			var handler = {func:this.hit, obj:this};
		}
		walls.addWall({pts:this.wallPts, handler:handler, handle: wallHandleHeater, record:false, show:false});
		walls[wallHandleHeater].createSingleValDataObj('vol', function() {
			return walls.wallVolume(wallHandleHeater);
		})
	},
	hit: function(dot, wallIdx, subWallIdx, wallUV, vPerp, perpUV){
		walls.reflect(dot, wallUV, vPerp);
		if (this.qRate) {
			var dE = dot.addEnergy(this.qRate) * .001;
			this.eAdded += dE;
		}
	},
	hitAddQToWall: function(dot, wallIdx, subWallIdx, wallUV, vPerp, perpUV){
		walls.reflect(dot, wallUV, vPerp);
		if (this.qRate) {
			var dE = dot.addEnergy(this.qRate) * .001;
			this.eAdded += dE;
			this.wall.q += dE;
		}
	},
	setupLiquidHeat: function(liquidHandle) {
		var self = this;
		timeline.curSection().addCmmdPoint('now', 'setup', function() {
			var type = 'Liquid';
			var liquid = curLevel.selectObj(type, liquidHandle);
			liquid.heater = self;
			if (!liquid) console.log('Bad liquid handle for heater ' + this.handle + '.  Handle ' + handle);
			var liqWall = liquid.getWallLiq();
			liqWall.recordQ();
			self.liquid = liquid;		
		}, true, true) //once is fine, will be readded each time
	},
	removeLiquid: function() {
		this.liquid = undefined;
	},
	remove: function(){
		this.removeSlider();
		removeListener(curLevel, 'update', 'drawHeater'+this.handle);
		if (window.walls && !walls.removed) {
			walls.removeWall(this.wallHandleHeater);
		}
	}
}
)
//////////////////////////////////////////////////////////////////////////
//STOPS
//////////////////////////////////////////////////////////////////////////
function Stops(attrs){
	this.type = 'Stops';
	//assumes canvas of c.  I mean, where else would they be?
	this.handle = attrs.handle;
	this.stopWidth = 20;
	this.stopHeight = 5;
	this.boundToSet = undefined;
	var stopPt = attrs.stopPt;
	this.wallInfo = defaultTo(0, attrs.wallInfo);
	this.wall = walls[this.wallInfo];
	this.pts = this.wall;
	
	if(stopPt.vol){
		var width = this.pts[0].distTo(this.pts[1]);
		var length = stopPt.vol/(vConst*width);
		this.height = this.pts[2].y-length;
	}else if (stopPt.y){
		this.height = stopPt.height;
	}
	this.willDraw = defaultTo(true, attrs.draw);
	
	if (this.willDraw) {
		this.draw = this.makeDrawFunc(this.height);
	}
	this.setupStd();	
	
	return this.init();
}
_.extend(Stops.prototype, objectFuncs, {
	makeDrawFunc: function(height){
		var pLeft = this.pts[3].copy().position({y:height});
		var pRight = this.pts[2].copy().position({y:height}).movePt({dx:-this.stopWidth});
		var stopWidth = this.stopWidth;
		var stopHeight = this.stopHeight;
		var dims = V(stopWidth, stopHeight);
		var borderColLocal = borderCol;
		return function(){
			draw.fillRect(pLeft, dims, borderColLocal, c);
			draw.fillRect(pRight, dims, borderColLocal, c);
		}
	},
	init: function(){
		if (this.height>this.wall[0].y) {
			this.boundToSet = 'max';
		} else {
			this.boundToSet = 'min'
		}
		this.yBoundSave = this.wall.bounds[this.boundToSet];
		var settingObj = {};
		if (this.boundToSet == 'max') {
			walls[this.wallInfo].setBounds(undefined, this.height);
		} else if (this.boundToSet == 'min') {
			walls[this.wallInfo].setBounds(this.height, undefined);
		}
		if (this.willDraw) {
			addListener(curLevel, 'update', 'drawStops' + this.wallInfo, this.draw, '');
		}
		return this;
	},
	remove: function(){
		if (window.walls && !walls.removed) {
			if (this.boundToSet == 'max') {
				walls[this.wallInfo].setBounds(undefined, this.yBoundSave);
			} else if (this.boundToSet == 'min') {
				walls[this.wallInfo].setBounds(this.yBoundSave, undefined);
			}
		}
		if (this.willDraw) {
			removeListener(curLevel, 'update', 'drawStops' + this.wallInfo);
		}
		return this;
	},
}
)
//////////////////////////////////////////////////////////////////////////
//Trigger
//////////////////////////////////////////////////////////////////////////
function Trigger(attrs) {
	this.type = 'Trigger';
	this.handle = attrs.handle;
	this.conditionFunc = this.wrapExpr(attrs.expr);
	this.checkOn = attrs.checkOn;
	this.requiredFor = attrs.requiredFor === false ? undefined : (attrs.requiredFor || 'now');
	this.message = attrs.message;
	this.priority = defaultTo(0, attrs.priorityUnsatisfied || attrs.priority);
	this.satisfyStore = defaultTo(undefined, attrs.satisfyStore);
	this.satisfyCmmds = defaultTo(undefined, attrs.satisfyCmmds);
	this.amSatisfied = false;
	this.setupStd();
	this.init();
}
_.extend(Trigger.prototype, objectFuncs, {
	init: function(){
		if (this.checkOn == 'conditions') {
			this.initCheckOnConditions(); //check if condition is met when curLevel goes to see if its conditions are met
		} else {
			this.initCheckOnInterval(); // check if condition is met at update interval, once true, is done and condition is met
		}
		
	},
	wrapExpr: function(expr) {
		with (DataGetFuncs) {
			var func = eval('(function() {return ' + expr + '})')
		}
		return func;
	},
	initCheckOnConditions: function() {
		if (this.requiredFor) {
			conditionManager.add(this);
		}
	},
	initCheckOnInterval: function() {
		addListener(curLevel, 'update', this.handle,
			function(){
				if (this.conditionFunc()) {
					this.amSatisfied = true;
					this.recordVals();
					if (this.satisfyCmmds) {
						for (var cmmdIdx=0; cmmdIdx<this.satisfyCmmds.length; cmmdIdx++) {
							eval(this.satisfyCmmds[cmmdIdx]);
						}
					}
					removeListener(curLevel, 'update', this.handle);
				}
			},
		this);
		if (this.requiredFor) {
			conditionManager.add(this);
		}
	},
	recordVals: function(){
		with (DataGetFuncs) {
			if (this.satisfyStore) {
				for (var storeIdx=0; storeIdx<this.satisfyStore.length; storeIdx++) {
					var storeObj = this.satisfyStore[storeIdx];
					var storeAs = storeObj.storeAs;
					var expr = storeObj.expr;
					var value = eval(expr);
					store(storeAs, value);
				}
			}
		}
	},
	isSatisfied: function(){
		return this.amSatisfied;
	},
	remove: function(){
		removeListener(curLevel, 'update', this.handle);
	},
})