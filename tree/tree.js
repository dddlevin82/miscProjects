function Tree(paper, pos) {
	this.paper = paper;
	this.pos = pos; //upper left corner of first section
	this.blockHeight = 40;
	this.blockWidth = 100;
	this.circleOffset = V(80, 0);
	this.circleRad = 15;
	this.blockSpacing = 10;
	this.totalBlockHeight = this.blockHeight + this.blockSpacing;
	this.promptIndent = 30;
	this.blockCol = Col(100, 160, 193);//'#64a0c1';
	this.blockColHover = Col(92, 147, 178);//'#5c93b2';
	this.blockColSelect = Col(82, 108, 122);//'#526c7a';
	this.blockColStroke = Col(59, 68, 73);//'#3b4449';
	this.circleCol = Col(120, 180, 213);
	this.placerButtonPos = P(200, 300);
	this.defineSectionDragFuncs();
	this.definePromptDragFuncs();
	this.placerButton = this.makePlacerButton();
	
	//this.placerBGRect = this.makePlacerBGRect();
	this.sections = [];
	
}

Tree.prototype = {
	addSection: function(mousePos, section) {
		var pos = posOnPaper(mousePos, this.paper);
		var sectionIdx = this.getNewSectionIdx(pos);
		if (!section) {
		/*should make it send rectangle corner positions*/
			section = new TreeSection(this, pos/*GET A POINT FOR THE UPPER LEFT CORNER, NOT FOR MOUSEPOS*/, this.sectionDragFuncs, this.promptDragFuncs, undefined);
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
	moveSection: function(srcIdx, destIdx) {
		
	},
	movePrompt: function(srcSectionIdx, destSectionIdx, srcPromptIdx, destPromptIdx) {
	
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
	sectionDragStart: function() {
		this.parent.tree.clickedButton = this.parent;
		this.parent.sectionIdx = this.parent.tree.getSectionIdx(this.parent.parent);
		this.parent.mousePos = posOnPaper(globalMousePos, this.parent.tree.paper);
		this.parent.sectionYs = this.parent.tree.getSectionYs();
	},
	sectionDragMove: function() {
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
	sectionDragEnd: function() {
		this.parent.tree.clickedButton = undefined;
		this.parent.sectionIdx = undefined;
		this.parent.mousePos = P(0, 0);
		this.parent.sectionYs = [];
		this.parent.tree.moveAllToPositions('fly');
	},
	defineSectionDragFuncs: function() {
		this.sectionDragFuncs = {
			onStart: this.sectionDragStart,
			onMove: this.sectionDragMove,
			onEnd: this.sectionDragEnd
		}
	},
	promptDragStart: function() {
		this.parent.tree.clickedButton = this.parent;
		this.parent.promptIdx = this.parent.parent.section.getPromptIdx(this.parent.parent);
		this.parent.mousePos = posOnPaper(globalMousePos, this.parent.tree.paper);
		this.parent.sectionYs = this.parent.tree.getSectionYs();
		this.parent.sectionTop = this.parent.parent.section.pos.y;
		this.parent.sectionBottom = this.parent.sectionTop + this.parent.parent.section.totalHeight();
	},
	promptDragMove: function() {
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
	promptDragEnd: function() {
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
			onStart: this.promptDragStart,
			onMove: this.promptDragMove,
			onEnd: this.promptDragEnd		
		}
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
	},

}

function TreeSection(tree, posInit, sectionDragFuncs, promptDragFunctions, onClick) {
	this.tree = tree;
	this.prompts = [];
	this.pos = posInit.copy();
	this.initSectionIdx = undefined; //for dragging
	this.mousePosInit = P(0, 0); //for dragging
	this.sectionYs = []; //for dragging
	this.sectionDragFuncs = sectionDragFuncs;
	this.promptDragFunctions = promptDragFunctions;
	this.button = new TreeButton(this.tree, this, this.pos, sectionDragFuncs, onClick);
 
}

TreeSection.prototype = {
	addPrompt: function(releasePos, prompt) {
		var newIdx = this.getNewPromptIdx(releasePos);
		if (!prompt) {
			prompt = new TreePrompt(this.tree, this, releasePos, this.promptDragFunctions)
		}
		this.prompts.splice(newIdx, 0, prompt);
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
	this.parent = parent;
	this.rect = this.makeRect();
	this.circle = this.makeCircle();
	
}

TreeButton.prototype = {

	makeRect: function() {
		var rect = paper.rect(0, 0, this.tree.blockWidth, this.tree.blockHeight);
		rect.attr(
			{
			fill: this.tree.blockCol.hex,
			stroke: this.tree.blockColStroke.hex,
			'stroke-width': 3,
			'stroke-linejoin': 'round',
			}
		);
		if (this.dragFuncs) {
			rect.drag(this.dragFuncs.onMove, this.dragFuncs.onStart, this.dragFuncs.onEnd);
		}
		var pos = this.rectPos();
		rect.transform('t' + pos.x + ',' + pos.y);
		rect.parent = this;
		return rect;
	},
	setParent: function(parent) {
		this.parent = parent;
	},
	makeCircle: function() {
		var circle = paper.circle(0, 0, this.tree.circleRad);
		circle.attr(
			{
			fill: this.tree.circleCol,
			
			}
		);
		if (this.dragFuncs) {
			circle.drag(this.dragFuncs.onMove, this.dragFuncs.onStart, this.dragFuncs.onEnd);
		}
		var pos = this.circlePos();
		circle.transform('t' + pos.x + ',' + pos.y);
		circle.parent = this;
		return circle;
	},	
	move: function(v) {
		var pos = P(this.pos.x + v.dx, this.pos.y + v.dy);
		this.snapToPos(pos);
	},
	snapToPos: function(pos) {
		if (!pos.sameAs(this.pos)) {
			this.pos.set(pos);
			var rectPos = this.rectPos();
			var circlePos = this.circlePos();
			this.rect.toFront();
			this.circle.toFront();
			this.rect.transform('t' + rectPos.x + ',' + rectPos.y);
			this.circle.transform('t' + circlePos.x + ',' + circlePos.y);
		}
			
	},
	flyToPos: function(pos) {
		if (!pos.sameAs(this.pos)) {
			this.pos.set(pos);
			var rectPos = this.rectPos();
			var circlePos = this.circlePos();
			this.rect.toFront();
			this.circle.toFront();
			this.rect.animate({transform:'t' + rectPos.x + ',' + rectPos.y}, 250);
			this.circle.animate({transform:'t' + circlePos.x + ',' + circlePos.y}, 250);
		}
	},
	rectPos: function() {
		return this.pos.copy();
	},
	circlePos: function() {
		return P(this.pos.x + this.tree.circleOffset.dx, this.pos.y + this.tree.circleOffset.dy + this.tree.blockHeight/2);
	},
	remove: function() {
		this.rect.remove();
	},
}

function posOnPaper(mousePos, paper) {
	return P(mousePos.x-paper._left, mousePos.y-paper._top);
}