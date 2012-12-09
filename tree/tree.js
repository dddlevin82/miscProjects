function Tree(paper, pos) {
	this.paper = paper;
	this.pos = pos; //upper left corner of first section
	this.rectDims = V(100, 40);
	this.innerRectDims = V(30, 40);
	this.circleOffset = V(80, 0);
	this.circleRad = 15;
	this.blockSpacing = 10;
	this.totalBlockHeight = this.rectDims.dy + this.blockSpacing;
	this.buttonPosObjectModeSelected = P(10, 10);
	this.promptIndent = 30;
	this.rectRounding = 3;
	this.innerRectWidth = 25;
	this.arrowDims = V(17, 26);
	this.arrowThickness = 4;
	this.arrowSpacing = 3;
	this.arrowOffset = 5;
	this.numArrows = 2;
	this.snapDist = 5;
	this.bgCol = Col(255, 255, 255);
	this.rectCol = Col(0, 164, 255);//'#64a0c1';
	this.rectColHover = Col(0, 144, 224);//'#5c93b2';
	//this.rectColSelect = Col(82, 108, 122);//'#526c7a';
	//this.rectColStroke = Col(59, 68, 73);//'#3b4449';
	this.arrowCol = Col(255, 255, 255);
	//this.circleCol = Col(59, 68, 73);//Col(120, 180, 213);
	//this.circleColHover = Col(110, 170, 203);
	this.placerButtonPos = P(200, 300);
	this.defineSectionDragFuncs();
	this.definePromptDragFuncs();
	this.defineClickFuncs();
	this.defineBGRectDragFuncs();
	this.definePlacerRectFuncs();
	this.placerButton = this.makePlacerButton();
	this.bgRect = this.makeBGRect();
	this.clickedButton = undefined;
	this.sections = [];
}

Tree.prototype = {
	addSection: function(mousePos, section) {
		var pos = posOnPaper(mousePos, this.paper);
		var sectionIdx = this.getNewSectionIdx(pos);
		if (!section) {
		/*should make it send rectangle corner positions*/
			section = new TreeSection(this, pos/*GET A POINT FOR THE UPPER LEFT CORNER, NOT FOR MOUSEPOS*/, this.sectionDragFuncs,  this.promptDragFuncs, this.clickFuncs);
		}
		this.sections.splice(sectionIdx, 0, section);
		//for (var idx=sectionIdx+1; idx<this.sections.length; idx++) {
		//	this.sections[idx].idx++;
		//}
		this.moveAllToPositions('fly');
	},
	addPrompt: function(mousePos, prompt) {
		var pos = posOnPaper(mousePos, this.paper);
		var sectionIdx = this.getNewPromptSectionIdx(pos);
		this.sections[sectionIdx].addPrompt(pos, prompt);
		this.moveAllToPositions('fly');
	},
	toObjectMode: function() {
		this.placerButton.hide();
		for (var sectionIdx=0; sectionIdx<this.sections.length; sectionIdx++) {
			var section = this.sections[sectionIdx];
			section.button.toObjectMode();
			var prompts = section.prompts;
			for (var promptIdx=0; promptIdx<prompts.length; promptIdx++) {
				prompts[promptIdx].button.toObjectMode();
			}
		}
	},
//HEY - FOR PLACING, ABUSE THE totalHeight FUNCTION
	toTreeMode: function() {
		this.placerButton.show();
		this.unclickButton();
		for (var sectionIdx=0; sectionIdx<this.sections.length; sectionIdx++) {
			var section = this.sections[sectionIdx];
			section.button.toTreeMode();
			var prompts = section.prompts;
			for (var promptIdx=0; promptIdx<prompts.length; promptIdx++) {
				prompts[promptIdx].button.toTreeMode();
			}
		//to object mode moves each button.  to tree mode gets moved by the moveAllToPositions function.  This is an acceptable inconsistancy because the buttons don't individually know where to go in to tree mode
		}
		
		this.moveAllToPositions('fly');
	},
	removeSection: function(sectionIdx) {
		if (this.sections[sectionIdx]) {
			this.sections[sectionIdx].remove();
			this.sections.splice(sectionIdx, 1);
			this.moveAllToPositions('fly');
		} else {
			console.log('tried to remove section idx ' + sectionIdx + '.  Does not exist.');
			console.trace();
		}
	},
	removePrompt: function(sectionIdx, promptIdx) {
		this.sections[sectionIdx].removePrompt(promptIdx);
		this.moveAllToPositions('fly');
	},
	unclickButton: function() {
		this.clickedButton = undefined;
	},
	getNewSectionIdx: function(pos) {
		var y = this.pos.y;
		for (var sectionIdx=0; sectionIdx<this.sections.length; sectionIdx++) {
			var sectionHeight = this.sections[sectionIdx].totalHeight();
			if (y + sectionHeight/2 > pos.y) {
				return sectionIdx;
			}
			y += sectionHeight;
		}
		return this.sections.length;
	},
	getNewPromptSectionIdx: function(pos) {
		var y = this.pos.y;
		for (var sectionIdx=0; sectionIdx<this.sections.length; sectionIdx++) {
			var sectionHeight = this.sections[sectionIdx].totalHeight();
			if (y + sectionHeight>pos.y) {
				return sectionIdx;
			}
			y += sectionHeight;
		}
		return this.sections.length-1;
	},
	makePlacerButton: function() {
		var pos = this.placerButtonPos;
		var placer = new TreeSection(this, pos, this.placerRectDragFuncs, undefined, undefined, true);
		return placer;
	},
	makeBGRect: function() {
		var bgRect = this.paper.rect(0, 0, this.paper.width, this.paper.height);
		bgRect.attr({
			'stroke-width': 0,
			fill: this.bgCol.hex
		})
		bgRect.parent = this;
		bgRect.drag(this.bgRectDragFuncs.onMove, this.bgRectDragFuncs.onStart, this.bgRectDragFuncs.onEnd);
		bgRect.toBack();
		return bgRect;
	},
	getSectionIdx: function(section) {
		return this.sections.indexOf(section);
	},
	totalHeight: function() {
		var totalHeight = 0;
		for (var sectionIdx=0; sectionIdx<this.sections.length; sectionIdx++) {
			totalHeight += this.sections[sectionIdx].totalHeight();
		}
		return totalHeight;
	},
	//drag and click functions are in context of the rect or circle.  this.parent will reference the button object.
	//yeah dawg, but pass the click functions down
	sectionDragStartTreeMode: function() {
		this.parent.posO = posOnPaper(globalMousePos, this.parent.tree.paper);
		this.parent.released = false;
		this.parent.tree.clickedButton = this.parent;
		this.parent.sectionIdx = this.parent.tree.getSectionIdx(this.parent.parent);
		this.parent.mousePos = posOnPaper(globalMousePos, this.parent.tree.paper);
		this.parent.sectionYs = this.parent.tree.getSectionYs();
	},
	sectionDragMoveTreeMode: function() {
		var mousePos = posOnPaper(globalMousePos, this.parent.tree.paper);
		var dPos = this.parent.mousePos.VTo(mousePos);
		var distFromOSqr = this.parent.posO.VTo(mousePos).magSqr();
		if (distFromOSqr > this.parent.tree.snapDist*this.parent.tree.snapDist || this.parent.released) {
			this.parent.released = true;
			var sections = this.parent.tree.sections;
			var curSectionIdx = this.parent.sectionIdx;
			this.parent.parent.move(dPos);
			var pos = this.parent.pos;
			var sectionHeight = this.parent.parent.totalHeight();
			this.parent.mousePos.set(mousePos);
			var sectionYs = this.parent.sectionYs;
			for (var sectionIdx=0; sectionIdx<sectionYs.length; sectionIdx++) {
				var midPtY = sectionYs[sectionIdx] + sections[sectionIdx].totalHeight()/2;
				if (sectionIdx < curSectionIdx) {
					if (pos.y <= midPtY) {
						var newIdx= sectionIdx;
						break;
					}
				} else if (sectionIdx > curSectionIdx) {
					if (pos.y + sectionHeight >= midPtY) {
						var newIdx = sectionIdx;
						break;
					}
				}
			}
			
			if (newIdx !== undefined) {
				var oldIdx = this.parent.sectionIdx;
				var movingSection = sections[oldIdx];
				sections.splice(oldIdx, 1);
				sections.splice(newIdx, 0, movingSection);
				this.parent.sectionYs = this.parent.tree.getSectionYs();
				this.parent.tree.sections = sections;
				this.parent.sectionIdx = newIdx;
				this.parent.tree.moveAllToPositions('fly');
			}
		}
		
	},
	sectionDragEndTreeMode: function() {
		var didClickFunc = false;
		if (!this.parent.released && this.parent.clickFuncs) {
			didClickFunc = true;
			this.parent.clickFuncs[this.type][this.parent.mode].apply(this.parent);
		}
		this.parent.tree.clickedButton = undefined;
		this.parent.sectionIdx = undefined;
		this.parent.released = false;
		this.parent.posO = P(0, 0);
		this.parent.mousePos = P(0, 0);
		this.parent.sectionYs = [];
		if (!didClickFunc) {
			this.parent.tree.moveAllToPositions('fly');
		}
	},
	defineSectionDragFuncs: function() {
		this.sectionDragFuncs = {
			tree: {
				onStart: this.sectionDragStartTreeMode,
				onMove: this.sectionDragMoveTreeMode,
				onEnd: this.sectionDragEndTreeMode
			},
			object: {
				onStart: undefined,
				onMove: undefined,
				onEnd: undefined
			}
		}
		
	},
	//click functions go in here, dawg
	promptDragStartTreeMode: function() {
		this.parent.posO = posOnPaper(globalMousePos, this.parent.tree.paper);
		this.parent.released = false;
		this.parent.tree.clickedButton = this.parent;
		this.parent.promptIdx = this.parent.parent.section.getPromptIdx(this.parent.parent);
		this.parent.mousePos = posOnPaper(globalMousePos, this.parent.tree.paper);
		this.parent.sectionYs = this.parent.tree.getSectionYs();
		this.parent.sectionTop = this.parent.parent.section.pos.y;
		this.parent.sectionBottom = this.parent.sectionTop + this.parent.parent.section.totalHeight();
	},
	promptDragMoveTreeMode: function() {
		var mousePos = posOnPaper(globalMousePos, this.parent.tree.paper);
		var dPos = V(mousePos.x - this.parent.mousePos.x, mousePos.y- this.parent.mousePos.y);
		var distFromOSqr = this.parent.posO.VTo(mousePos).magSqr();
		if (distFromOSqr > this.parent.tree.snapDist*this.parent.tree.snapDist || this.parent.released) {
			this.parent.released = true;
			this.parent.mousePos.set(mousePos);
			this.parent.parent.move(dPos);
			var prompts = this.parent.parent.section.prompts;
			var totalBlockHeight = this.parent.tree.totalBlockHeight;
			var pos = this.parent.pos;
			var topOfPrompts = this.parent.sectionTop + totalBlockHeight;
			var newIdx = Math.floor(((pos.y + totalBlockHeight/2 - topOfPrompts)/totalBlockHeight));
			var boundedIdx = Math.min(prompts.length-1, Math.max(-1, newIdx));
			var switchingBlock = newIdx != boundedIdx;
			if (newIdx != this.parent.promptIdx && !switchingBlock) {
				var movingPrompt = prompts[this.parent.promptIdx];
				newIdx = Math.max(0, newIdx); //because it can be -1, which is on the section button, but still in the section
				prompts.splice(this.parent.promptIdx, 1);
				prompts.splice(newIdx, 0, movingPrompt);
				this.parent.promptIdx = newIdx;
				this.parent.tree.moveAllToPositions('fly');
			} else if (switchingBlock) {
				
			}
		}
	},
	promptDragEndTreeMode: function() {
		var didClickFunc = false;
		if (!this.parent.released && this.parent.clickFuncs) {
			didClickFunc = true;
			this.parent.clickFuncs[this.type][this.parent.mode].apply(this.parent);
		}//might want to save these variables for use in the click function
		//also, if we're doing the click function, it means we didn't move any blocks, so we don't have to rearrange
		this.parent.tree.clickedButton = undefined;
		this.parent.promptIdx = undefined;
		this.parent.released = false;
		this.parent.mousePos = P(0, 0);
		this.parent.sectionYs = undefined;
		this.parent.sectionTop = undefined;
		this.parent.sectionBottom = undefined;	
		if (!didClickFunc) {
			this.parent.tree.moveAllToPositions('fly');
		}
	},
	definePromptDragFuncs: function() {
		this.promptDragFuncs = {
			tree: {
				onStart: this.promptDragStartTreeMode,
				onMove: this.promptDragMoveTreeMode,
				onEnd: this.promptDragEndTreeMode	
			},
			object: {
				onStart: undefined,
				onMove: undefined,
				onEnd: undefined
			}
		}
	},
	bgRectDragStart: function() {
		this.totalHeight = this.parent.totalHeight();
		this.mousePos = posOnPaper(globalMousePos, this.parent.paper);
	},
	bgRectDragMove: function() {
		var curMousePos = posOnPaper(globalMousePos, this.parent.paper);
		var dPos = this.mousePos.VTo(curMousePos);
		this.mousePos.set(curMousePos);
		var maxY = 50;
		var minY = this.parent.paper.height - this.totalHeight;
		this.parent.pos.y = Math.min(maxY, Math.max(minY, this.parent.pos.y + dPos.dy));
		this.parent.moveAllToPositions('snap');
		
	},
	bgRectDragEnd: function() {
		this.totalHeight = undefined;
		this.mousePos = P(0, 0);
	},
	defineBGRectDragFuncs: function() {
		this.bgRectDragFuncs = {
			onStart: this.bgRectDragStart,
			onMove: this.bgRectDragMove,
			onEnd: this.bgRectDragEnd
		}
	},
	placerRectDragStart: function() {
		this.parent.mousePos = posOnPaper(globalMousePos, this.parent.tree.paper);
	},
	placerRectDragMove: function() {
		var curMousePos = posOnPaper(globalMousePos, this.parent.tree.paper);
		var dPos = this.parent.mousePos.VTo(curMousePos);
		this.parent.mousePos.set(curMousePos);
		this.parent.parent.move(dPos);
		
	},
	placerRectDragEnd: function() {
	
	},
	definePlacerRectFuncs: function() {
		this.placerRectDragFuncs = {
			tree: {
				onStart: this.placerRectDragStart,
				onMove: this.placerRectDragMove,
				onEnd: this.placerRectDragEnd
			}, 
			object: {
				onStart: undefined,
				onMove: undefined,
				onEnd: undefined
			}
		}
	},
	defineClickFuncs: function() {
		this.clickFuncs = {
			rect: {
				tree: this.onClickRectTreeMode,
				object: this.onClickRectObjectMode
			},
			arrows: {
				tree: this.onClickArrowsTreeMode,
				object: this.onClickArrowsObjectMode
			}
		}
	},
	onClickRectTreeMode: function() {
		console.log("I'm a rectangle!");
	},
	onClickRectObjectMode: function() {
		console.log("I'm a rectangle!");
	},
	onClickArrowsObjectMode: function() {
		this.parent.tree.toTreeMode();
	},
	onClickArrowsTreeMode: function() {
		this.parent.tree.toObjectMode();
	},
	getSectionYs: function() {
		var y = this.pos.y;
		var ys = [];
		for (var sectionIdx=0; sectionIdx<this.sections.length; sectionIdx++) {
			ys.push(y);
			y += this.totalBlockHeight * (1 + this.sections[sectionIdx].prompts.length);
		}
		return ys;
	},
	
	moveAllToPositions: function(moveStyle) {
		var x = this.pos.x;
		var y = this.pos.y;
		for (var sectionIdx=0; sectionIdx<this.sections.length; sectionIdx++) {
			var section = this.sections[sectionIdx];
			if (section.button != this.clickedButton) {
				section.button.move(P(x, y), moveStyle);
				section.pos.set(P(x,y));
				y += this.totalBlockHeight;
				for (var promptIdx=0; promptIdx<section.prompts.length; promptIdx++) {
					var prompt = section.prompts[promptIdx];
					if (prompt.button != this.clickedButton) {
						prompt.button.move(P(x+this.promptIndent, y), moveStyle);
					}
					y += this.totalBlockHeight;
				}
			} else {
				y += this.sections[sectionIdx].totalHeight();
			}
		}
		if (this.clickedButton) {
			this.clickedButton.groupToFront();
		}
	},

}

function TreeSection(tree, posInit, sectionDragFuncs, promptDragFuncs, clickFuncs, isPlacer) {
	this.tree = tree;
	this.prompts = [];
	this.pos = posInit.copy();
	this.initSectionIdx = undefined; //for dragging
	this.mousePosInit = P(0, 0); //for dragging
	this.sectionYs = []; //for dragging
	this.sectionDragFuncs = sectionDragFuncs;
	this.promptDragFuncs = promptDragFuncs;
	this.clickFuncs = clickFuncs;
	this.isPlacer = isPlacer;
	this.button = new TreeButton(this.tree, this, this.pos, this.sectionDragFuncs, this.clickFuncs, isPlacer);
 
}

TreeSection.prototype = {
	addPrompt: function(releasePos, prompt) {
		var newIdx = this.getNewPromptIdx(releasePos);
		if (!prompt) {
			prompt = new TreePrompt(this.tree, this, releasePos, this.promptDragFuncs, this.clickFuncs)
		}
		this.prompts.splice(newIdx, 0, prompt);
	},
	hide: function() {
		this.button.hide();
		for (var promptIdx=0; promptIdx<this.prompts.length; promptIdx++) {
			this.prompts[promptIdx].hide();
		}
	},
	show: function() {
		this.button.show();
		for (var promptIdx=0; promptIdx<this.prompts.length; promptIdx++) {
			this.prompts[promptIdx].show();
		}
	},
	toFront: function() {
		this.button.toFront();
		for (var promptIdx=0; promptIdx<this.prompts.length; promptIdx++) {
			this.prompts[promptIdx].toFront();
		}
	},
	move: function(v) {
		this.pos.movePt(v);
		this.button.move(v);
		for (var promptIdx=0; promptIdx<this.prompts.length; promptIdx++) {
			this.prompts[promptIdx].move(v);
		}
	},
	getNewPromptIdx: function(releasePos) {
		var y = this.pos.y + this.tree.totalBlockHeight;
		for (var promptIdx=0; promptIdx<this.prompts.length; promptIdx++) {
			if (y + this.tree.totalBlockHeight/2 > releasePos.y) {
				return promptIdx;
			}
			y += this.tree.totalBlockHeight;
		}		
		return this.prompts.length;
	},
	getPromptIdx: function(prompt) {
		return this.prompts.indexOf(prompt);
	},
	remove: function() {
		this.button.remove();
		for (var promptIdx=0; promptIdx<this.prompts.length; promptIdx++) {
			this.prompts[promptIdx].remove();
		}
		this.prompts = [];
	},
	removePrompt: function(promptIdx) {
		if (this.prompts[promptIdx]) {
			this.prompts[promptIdx].remove();
			this.prompts.splice(promptIdx, 1);
		} else {
			console.log('tried to remove prompt idx ' + promptIdx + ' from some section, which is not helpful at all.  It does not exist.');
			console.trace();
		}
	},
	totalHeight: function() {
		return this.tree.totalBlockHeight*(1+this.prompts.length);
	}
}

function TreePrompt(tree, section, posInit, dragFuncs, clickFuncs) {
	this.tree = tree;
	this.section = section;
	this.dragFuncs = dragFuncs;
	this.clickFuncs = clickFuncs;
	this.button = new TreeButton(this.tree, this, posInit, this.dragFuncs, this.clickFuncs);
}

TreePrompt.prototype = {
	getSection: function() {
		return this.section;
	},
	setSection: function(section) {
		this.section = section;
	},
	hide: function() {
		this.button.hide();
	},
	show: function() {
		this.button.show();
	},
	toFront: function() {
		this.button.toFront();
	},
	remove: function() {
		this.button.remove();
	},
	move: function(v) {
		this.button.move(v);
	}
}

function TreeButton(tree, parent, posInit, dragFuncs, clickFuncs, isPlacerButton) {
	this.tree = tree;
	this.mode = 'tree';
	this.pos = posInit.copy();
	this.dragFuncs = dragFuncs;
	this.clickFuncs = clickFuncs;
	this.released = false;
	this.posO = P(0,0);
	this.sectionIdx = Number();
	this.mousePos = P(0,0);
	this.sectionYs = [];
	this.parent = parent;
	this.isPlacerButton = defaultTo(isPlacerButton, false);
	this.rect = this.makeRect();
	this.innerRect = this.makeInnerRect();
	this.arrows = this.makeArrows();
	this.arrowAngle = 0;//sorry about right/left, 0/180 use.  right -> 0, left -> 180.  Tossing angle around is nice for getting position without a bunch of ifs
}

TreeButton.prototype = {
	toTreeMode: function() {
		this.mode = 'tree';
		if (this.arrowAngle = 180) {
			this.pointArrows('right')
		}
	},
	hide: function() {
		this.rect.hide();
		this.innerRect.hide();
		for (var arrowIdx=0; arrowIdx<this.arrows.length; arrowIdx++) {
			this.arrows[arrowIdx].hide();
		}
	},
	show: function() {
		this.rect.show().toFront();
		this.innerRect.show().toFront();
		for (var arrowIdx=0; arrowIdx<this.arrows.length; arrowIdx++) {
			this.arrows[arrowIdx].show().toFront();;
		}		
	},
	toObjectMode: function() {
		this.mode = 'object';
		if (this == this.tree.clickedButton) {
			this.pointArrows('left');
			this.flyToPos(this.tree.buttonPosObjectModeSelected, 200);
			//this.flyToPos(P(0, 75));
		} else {
			//this.flyToPos(P(0, 75));
			this.flyToPos(P(-this.tree.rectDims.dx-50, this.pos.y), 150);
		}
	},
	makeRect: function() {
		var rect = this.tree.paper.rect(0, 0, this.tree.rectDims.dx, this.tree.rectDims.dy, this.tree.rectRounding);
		rect.attr({
			fill: this.tree.rectCol.hex,
			//stroke: this.tree.rectColStroke.hex,
			'stroke-width': 0,
			//'stroke-linejoin': 'round',
		});
		if (this.dragFuncs) {
			rect.drag(this.dragFuncs.tree.onMove, this.dragFuncs.tree.onStart, this.dragFuncs.tree.onEnd);
		}
		this.assignHover(rect, 'rect', this.tree.rectColHover, this.tree.rectCol)

		var pos = this.rectPos();
		rect.transform('t' + pos.x + ',' + pos.y);
		rect.parent = this;
		rect.type = 'rect';
		return rect;
	},
	makeInnerRect: function() {
		var rect = this.tree.paper.rect(0, 0, this.tree.innerRectDims.dx, this.tree.innerRectDims.dy, this.tree.rectRounding);
		rect.attr({
			fill: this.tree.rectCol.hex,
			'stroke-width': 0
			
		});
		if (this.dragFuncs) {
			rect.drag(this.dragFuncs.tree.onMove, this.dragFuncs.tree.onStart, this.dragFuncs.tree.onEnd);
		}
		this.assignHover(rect, 'innerRect', this.tree.rectColHover, this.tree.rectCol);

		var pos = this.innerRectPos();
		rect.transform('t' + pos.x + ',' + pos.y);
		rect.parent = this;
		rect.type = 'arrows';
		return rect;
	},

	makeArrows: function() {
		var tree = this.tree;
		var path = this.makeArrowPath();
		var arrows = [];
		for (var arrowIdx=0; arrowIdx<this.tree.numArrows; arrowIdx++) {
			var pos = this.arrowPos(arrowIdx);
			var arrow = this.tree.paper.path(path);
			arrow.transform('t' + pos.x + ',' + pos.y);
			arrow.attr({
				fill: this.tree.arrowCol.hex,
				'stroke-width': 0
			})
			this.assignHover(arrow, 'innerRect', this.tree.rectColHover, this.tree.rectCol);

			if (this.dragFuncs) {
				arrow.drag(this.dragFuncs.tree.onMove, this.dragFuncs.tree.onStart, this.dragFuncs.tree.onEnd);
			}
			arrow.parent = this;
			arrow.type = 'arrows';
			arrows.push(arrow);
		}
		return arrows;
		
	},
	assignHover: function(raphaelShape, toChange, hoverOnCol, hoverOffCol) {
		if (this.isPlacerButton) {
			raphaelShape.hover(this.hoverOnChangeAll, this.hoverOffChangeAll);
		} else {
			raphaelShape.hover(
				function() {
					this.parent[toChange].attr({fill:hoverOnCol.hex});
				},
				function() {
					this.parent[toChange].attr({fill:hoverOffCol.hex});
				}
			)
		}
	},
	hoverOnChangeAll: function() {
		this.parent.innerRect.attr({fill:this.parent.tree.rectColHover.hex});
		this.parent.rect.attr({fill:this.parent.tree.rectColHover.hex})
	},
	hoverOffChangeAll: function() {
		this.parent.innerRect.attr({fill:this.parent.tree.rectCol.hex});
		this.parent.rect.attr({fill:this.parent.tree.rectCol.hex})
	},
	pointArrows: function(dir) {// 'left', 'right'
		if (dir == 'left') {
			this.arrowAngle = 180;
		} else if (dir == 'right') {
			this.arrowAngle = 0;
		}
		
		for (var arrowIdx=0; arrowIdx<this.arrows.length; arrowIdx++) {
			var arrow = this.arrows[arrowIdx];
			var pos = this.arrowPos(arrowIdx);
			arrow.transform('t' + pos.x + ',' + pos.y + 'r' + this.arrowAngle + ',0,0');
			
		}
	},
	setParent: function(parent) {
		this.parent = parent;
	},
	move: function(moveOrder, type, time) {
		if (moveOrder instanceof Vector) {
			var pos = P(this.pos.x + moveOrder.dx, this.pos.y + moveOrder.dy);
		} else { //is point
			var pos = moveOrder;
		}
		if (type == 'fly') {
			this.flyToPos(pos, time);
		} else {
			this.snapToPos(pos);
		}
	},
	groupToFront: function() {
		this.parent.toFront();
	},
	toFront: function() {
		this.rect.toFront();
		this.innerRect.toFront();
		for (var arrowIdx=0; arrowIdx<this.arrows.length; arrowIdx++) {
			this.arrows[arrowIdx].toFront();
		}
	},
	snapToPos: function(pos) {
		if (!pos.sameAs(this.pos)) {
			this.pos.set(pos);
			var rectPos = this.rectPos();
			var innerRectPos = this.innerRectPos();
			this.rect.toFront();
			this.innerRect.toFront();
			this.rect.transform('t' + rectPos.x + ',' + rectPos.y);
			this.innerRect.transform('t' + innerRectPos.x + ',' + innerRectPos.y);
			for (var arrowIdx=0; arrowIdx<this.arrows.length; arrowIdx++) {
				var arrowPos = this.arrowPos(arrowIdx);
				this.arrows[arrowIdx].transform('t' + arrowPos.x + ',' + arrowPos.y + 'r' + this.arrowAngle + ',0,0');
				this.arrows[arrowIdx].toFront();
			}
		}
			
	},
	flyToPos: function(pos, time) {
		time = defaultTo(time, 250);
		if (!pos.sameAs(this.pos)) {
			this.pos.set(pos);
			var rectPos = this.rectPos();
			var innerRectPos = this.innerRectPos();
			this.rect.toFront();
			this.innerRect.toFront();
			this.rect.animate({transform:'t' + rectPos.x + ',' + rectPos.y}, time, 'ease-in-out');
			this.innerRect.animate({transform:'t' + innerRectPos.x + ',' + innerRectPos.y}, time, 'ease-in-out');
			for (var arrowIdx=0; arrowIdx<this.arrows.length; arrowIdx++) {
				var arrowPos = this.arrowPos(arrowIdx);
				this.arrows[arrowIdx].animate({transform:'t' + arrowPos.x + ',' + arrowPos.y + 'r' + this.arrowAngle + ',0,0'}, time, 'ease-in-out');
				this.arrows[arrowIdx].toFront();
			}
		}
	},
	rectPos: function() {
		return this.pos.copy();
	},
	innerRectPos: function() {
		return P(this.pos.x + this.tree.rectDims.dx - this.tree.innerRectDims.dx, this.pos.y);
	},
	arrowPos: function(arrowIdx) {//dirPointed assumes right
		var x = this.pos.x + this.tree.rectDims.dx - this.tree.innerRectDims.dx + this.tree.arrowOffset + arrowIdx*(this.tree.arrowSpacing + this.tree.arrowThickness);
		var y = this.pos.y + (this.tree.rectDims.dy - this.tree.arrowDims.dy)/2;
		if (this.arrowAngle == 180) {
			x += this.tree.arrowDims.dx;
			y += this.tree.arrowDims.dy;
		}
		return P(x, y);
	},
	makeArrowPath: function() {
		var pts = [];
		var width = this.tree.arrowDims.dx;
		var height = this.tree.arrowDims.dy;
		var thickness = this.tree.arrowThickness;
		pts.push(P(0, 0));
		pts.push(P(thickness, 0));
		pts.push(P(width, height/2));
		pts.push(P(thickness, height));
		pts.push(P(0, height));
		pts.push(P(width-thickness, height/2));
		return makePath(pts, true);
	},
	remove: function() {
		this.rect.remove();
	},
}

function makePath(pts, closePath) {//closePath defaults to true
	var path = 'M' + pts[0].x + ',' + pts[0].y;
	for (var ptIdx=1; ptIdx<pts.length; ptIdx++) {
		path += 'L' + pts[ptIdx].x + ',' + pts[ptIdx].y;
	}
	if (closePath || closePath===undefined) {
		path += 'Z';
	}
	return path;
}

function defaultTo(val, defaultVal) {
	if (val === undefined) {
		return defaultVal;
	}
	return val;
}

function posOnPaper(mousePos, paper) {
	return P(mousePos.x-paper._left, mousePos.y-paper._top);
}