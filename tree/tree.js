function Tree(paper, pos) {
	this.paper = paper;
	this.pos = pos; //upper left corner of first section
	this.rectDims = V(100, 40);
	this.innerRectDims = V(30, 40);
	this.circleOffset = V(80, 0);
	this.circleRad = 15;
	this.blockSpacing = 10;
	this.totalBlockHeight = this.rectDims.dy + this.blockSpacing;
	this.promptIndent = 30;
	this.rectRounding = 3;
	this.innerRectWidth = 25;
	this.arrowDims = V(17, 26);
	this.arrowThickness = 4;
	this.arrowSpacing = 3;
	this.arrowOffset = 5;
	this.numArrows = 2;
	this.rectCol = Col(0, 164, 255);//'#64a0c1';
	this.rectColHover = Col(0, 144, 224);//'#5c93b2';
	//this.rectColSelect = Col(82, 108, 122);//'#526c7a';
	//this.rectColStroke = Col(59, 68, 73);//'#3b4449';
	this.arrowCol = Col(0, 255, 255);
	//this.circleCol = Col(59, 68, 73);//Col(120, 180, 213);
	//this.circleColHover = Col(110, 170, 203);
	this.placerButtonPos = P(200, 300);
	this.defineSectionDragFuncs();
	this.definePromptDragFuncs();
	this.placerButton = this.makePlacerButton();
	this.clickedButton = undefined;
	this.sections = [];
	//be like inner = paper.rect(70% over in main rect, round 3,) fill with circleCol.  Put arrows like >> or << of big rect color on it
}

Tree.prototype = {
	addSection: function(mousePos, section) {
		var pos = posOnPaper(mousePos, this.paper);
		var sectionIdx = this.getNewSectionIdx(pos);
		if (!section) {
		/*should make it send rectangle corner positions*/
			section = new TreeSection(this, pos/*GET A POINT FOR THE UPPER LEFT CORNER, NOT FOR MOUSEPOS*/, this.sectionDragFuncs,  this.promptDragFuncs, undefined);
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
	toObjectEditorMode: function() {
		for (var sectionIdx=0; sectionIdx<this.sections.length; sectionIdx++) {
			var section = this.sections[sectionIdx];
			section.button.toObjectMode();
			var prompts = section.prompts;
			for (var promptIdx=0; promptIdx<prompts.length; promptIdx++) {
				prompt.buttom.toObjectMode();
			}
			
		//check if button is selected in toObjectMode
		}
	},

	toTreeMode: function() {
		this.moveAllToPositions('fly');
		for (var sectionIdx=0; sectionIdx<this.sections.length; sectionIdx++) {
			var section = this.sections[sectionIdx];
			section.button.toTreeMode();
			var prompts = section.prompts;
			for (var promptIdx=0; promptIdx<prompts.length; promptIdx++) {
				prompt.buttom.toTreeMode();
			}
			
		//to object mode moves each button.  to tree mode gets moved by the moveAllToPositions function.  This is an acceptable inconsistancy because the buttons don't individually know where to go in to tree mode
		}
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
		var placer = new TreeSection(this, pos, undefined, undefined);
		return placer;
	},
	getSectionIdx: function(section) {
		return this.sections.indexOf(section);
	},
	//drag and click functions are in context of the rect or circle.  this.parent will reference the button object.
	sectionDragStartTreeMode: function() {
		this.parent.tree.clickedButton = this.parent;
		this.parent.sectionIdx = this.parent.tree.getSectionIdx(this.parent.parent);
		this.parent.mousePos = posOnPaper(globalMousePos, this.parent.tree.paper);
		this.parent.sectionYs = this.parent.tree.getSectionYs();
	},
	sectionDragMoveTreeMode: function() {
		var sections = this.parent.tree.sections;
		var curSectionIdx = this.parent.sectionIdx;
		var mousePos = posOnPaper(globalMousePos, this.parent.tree.paper);
		var dPos = V(mousePos.x - this.parent.mousePos.x, mousePos.y- this.parent.mousePos.y);
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
		
	},
	sectionDragEndTreeMode: function() {
		this.parent.tree.clickedButton = undefined;
		this.parent.sectionIdx = undefined;
		this.parent.mousePos = P(0, 0);
		this.parent.sectionYs = [];
		this.parent.tree.moveAllToPositions('fly');
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
	promptDragStartTreeMode: function() {
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
	},
	promptDragEndTreeMode: function() {
		this.parent.tree.clickedButton = undefined;
		this.parent.promptIdx = undefined;
		this.parent.mousePos = P(0, 0);
		this.parent.sectionYs = undefined;
		this.parent.sectionTop = undefined;
		this.parent.sectionBottom = undefined;	
		this.parent.tree.moveAllToPositions('fly');
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
	onClickRectTreeMode: function() {
		console.log("I'm a rectangle!");
	},
	onClickRectObjectMode: function() {
		console.log("I'm a rectangle!");
	},
	onClickCircleTreeMode: function() {
		this.parent.tree.clickedButton = this.parent;
		this.parent.tree.toObjectEditorMode();
	},
	onClickCircleObjectMode: function() {
		this.parent.tree.clickedButton = this.parent;
		this.parent.tree.toObjectEditorMode();
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
				if (moveStyle = 'fly') {
					section.button.flyToPos(P(x,y));
				} else if (moveStyle = 'snap') {
					section.button.snapToPos(P(x,y));
				}
				section.pos.set(P(x,y));
				y += this.totalBlockHeight;
				for (var promptIdx=0; promptIdx<section.prompts.length; promptIdx++) {
					var prompt = section.prompts[promptIdx];
					if (prompt.button != this.clickedButton) {
						if (moveStyle = 'fly') {
							prompt.button.flyToPos(P(x+this.promptIndent, y));
						} else if (moveStyle = 'snap') {
							prompt.button.snapToPos(P(x+this.promptIndent, y));
						}
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

function TreeSection(tree, posInit, sectionDragFuncs, promptDragFuncs, onClick) {
	this.tree = tree;
	this.prompts = [];
	this.pos = posInit.copy();
	this.initSectionIdx = undefined; //for dragging
	this.mousePosInit = P(0, 0); //for dragging
	this.sectionYs = []; //for dragging
	this.sectionDragFuncs = sectionDragFuncs;
	this.promptDragFuncs = promptDragFuncs;
	this.button = new TreeButton(this.tree, this, this.pos, sectionDragFuncs, onClick);
 
}

TreeSection.prototype = {
	addPrompt: function(releasePos, prompt) {
		var newIdx = this.getNewPromptIdx(releasePos);
		if (!prompt) {
			prompt = new TreePrompt(this.tree, this, releasePos, this.promptDragFuncs)
		}
		this.prompts.splice(newIdx, 0, prompt);
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

function TreePrompt(tree, section, posInit, dragFuncs, onClick) {
	this.tree = tree;
	this.section = section;
	this.button = new TreeButton(this.tree, this, posInit, dragFuncs, undefined);
}

TreePrompt.prototype = {
	getSection: function() {
		return this.section;
	},
	setSection: function(section) {
		this.section = section;
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

function TreeButton(tree, parent, posInit, dragFuncs, onClick) {
	this.tree = tree;
	this.pos = posInit.copy();
	this.dragFuncs = dragFuncs;
	this.onClick = onClick;
	this.parent = parent;
	this.rect = this.makeRect();
	this.innerRect = this.makeInnerRect();
	this.arrows = this.makeArrows();
	
}

TreeButton.prototype = {
	toTreeMode: function() {
	
	},
	toObjectMode: function() {
	
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
		rect.hover(
			function() {
				this.attr({fill:this.parent.tree.rectColHover.hex});
				//this.parent.innerRect.attr({fill:this.parent.tree.rectColHover.hex});
			}, 
			function() {
				this.attr({fill:this.parent.tree.rectCol.hex});
				//this.parent.innerRect.attr({fill:this.parent.tree.rectCol.hex});
			}
		);
		var pos = this.rectPos();
		rect.transform('t' + pos.x + ',' + pos.y);
		rect.parent = this;
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
		rect.hover(
			function() {
				this.attr({fill:this.parent.tree.rectColHover.hex})
			},
			function() {
				this.attr({fill:this.parent.tree.rectCol.hex});
			}
		)
		var pos = this.innerRectPos();
		rect.transform('t' + pos.x + ',' + pos.y);
		rect.parent = this;
		return rect;
	},
	makeArrows: function() {
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
			arrow.hover(
				function() {
					this.parent.innerRect.attr({fill:this.parent.tree.rectColHover.hex})
				},
				function() {
					this.parent.innerRect.attr({fill:this.parent.tree.rectCol.hex});
				}				
			)
			arrow.parent = this;
			arrows.push(arrow);
		}
		return arrows;
		
	},
	pointArrows: function(dir) {// 'left', 'right'
		var angle, pos;
		for (var arrowIdx=0; arrowIdx<this.arrows.length; arrowIdx++) {
			var arrow = this.arrows[arrowIdx];
			if (dir == 'left') {
				angle = 180;
			} else if (dir == 'right') {
				angle = 0;
			}
			pos = this.arrowPos(arrowIdx, dir);
			arrow.transform('t' + pos.x + ',' + pos.y + 'r' + angle + ',0,0');
			
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
				this.arrows[arrowIdx].transform('t' + arrowPos.x + ',' + arrowPos.y);
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
			this.rect.animate({transform:'t' + rectPos.x + ',' + rectPos.y}, 250);
			this.innerRect.animate({transform:'t' + innerRectPos.x + ',' + innerRectPos.y}, 250);
			for (var arrowIdx=0; arrowIdx<this.arrows.length; arrowIdx++) {
				var arrowPos = this.arrowPos(arrowIdx);
				this.arrows[arrowIdx].animate({transform:'t' + arrowPos.x + ',' + arrowPos.y}, 250);
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
	arrowPos: function(arrowIdx, dirPointed) {//dirPointed assumes right
		var x = this.pos.x + this.tree.rectDims.dx - this.tree.innerRectDims.dx + this.tree.arrowOffset + arrowIdx*(this.tree.arrowSpacing + this.tree.arrowThickness);
		var y = this.pos.y + (this.tree.rectDims.dy - this.tree.arrowDims.dy)/2;
		if (dirPointed == 'left') {
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