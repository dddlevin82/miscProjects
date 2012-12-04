function Tree(paper, pos) {
	this.paper = paper;
	this.pos = pos; //upper left corner of first section
	this.blockHeight = 40;
	this.blockWidth = 100;
	this.blockSpacing = 10;
	this.totalBlockHeight = this.blockHeight + this.blockSpacing;
	this.promptIndent = 25;
	this.blockCol = Col(100,160,193);//'#64a0c1';
	this.blockColHover = Col(92, 147, 178);//'#5c93b2';
	this.blockColSelect = Col(82,108,122);//'#526c7a';
	this.blockColStroke = Col(59,68,73);//'#3b4449';
	this.sections = [];
	
}

Tree.prototype = {
	addSection: function(mousePos) {
		var pos = posOnPaper(mousePos, this.paper);
		var sectionIdx = this.getNewSectionIdx(pos);
		this.sections.splice(sectionIdx, 0, new Section(sectionIdx, this));
		for (var idx=sectionIdx+1; idx<this.sections.length; idx++) {
			this.sections[idx].idx++;
		}
		this.animateAllToPositions();
	},
	addPrompt: function(mousePos) {
		var pos = posOnPaper(mousePos, this.paper);
		var sectionIdx = this.getNewPromptSectionIdx(pos);
		this.sections[sectionIdx].addPrompt(pos);
		this.animateAllToPositions();
	},
	moveSection: function(srcIdx, destIdx) {
		
	},
	movePrompt: function(srcSectionIdx, destSectionIdx, srcPromptIdx, destPromptIdx) {
	
	},
	removeSection: function(sectionIdx) {
		
	},
	removePrompt: function(sectionIdx, promptIdx) {
	
	},
	getNewSectionIdx: function(pos) {
		var y = this.pos.y;
		for (var sectionIdx=0; sectionIdx<this.sections.length; sectionIdx++) {
			var sectionHeight = this.sections[sectionIdx].totalHeight();
			if (y + sectionHeight/2 > pos.y) {
				return sectionIdx;
			}
		}
		return this.sections.length;
	},
	getNewPromptSectionIdx: function(pos) {
		
	},
	animateAllToPositions: function() {
		for (var sectionIdx=0; sectionIdx<this.sections.length; sectionIdx++) {
			this.sections[sectionIdx].animateTo(sectionIdx);
		}
	}
}

function TreeSection(idx, tree) {
	this.idx = idx;
	this.tree = tree;
	this.prompts = [];
	this.buttom = makeTreeButton(tree, SOMEPOS, 
}

TreeSection.prototype = {
	addPrompt: function(releasePos) {
		
	},
	animateTo: function(sectionIdx) {
		if (this.idx != sectionIdx) {
			this.
		}
	}
	getNewPromptIdx: function(releasePos) {
		
	}
	totalHeight: function() {
		return this.tree.totalBlockHeight*(1+this.prompts.length);
	}
}

function TreePrompt(idx, parent) {
	this.idx = idx;
}

function makeTreeButton(tree, sectionIdx, promptIdx, dragFuncs, onClick) {
	var r = paper.rect(0, 0, tree.blockWidth, tree.blockHeight);
	r.transform('t' + pos.x + ',' + pos.y);
	r.attr(
		{
			fill: tree.blockCol.hex,
			stroke: tree.blockColStroke.hex,
			'stroke-width': 5,
			'stroke-linejoin': 'round',
		}
	var getSectionPos = function(sectionIdx) {
		var y = tree.pos.y;
		for (var treeSectionIdx=0; treeSectionIdx<sectionIdx; treeSectionIdx++) {
			y += tree.sections[treeSectionIdx].totalHeight();
		}
		return y;
	}
	r.snapToIdx = function(sectionIdx, promptIdx) {
		var sectionY = getSectionPos(sectionIdx);
		if (promptIdx === undefined) {
			var x = tree.pos.x;
			var y = sectionY;
		} else {
			var x = tree.pos.x + tree.promptIndent;
			var y = sectionY + (promptIdx+1) * (tree.blockHeight + tree.blockSpacing);//+1 to account for section block, yo
		}
		this.transform('t' + x + ',' + y);
		this.sectionIdx = sectionIdx;
		this.promptIdx = promptIdx;
		this.pos.x = x;
		this.pos.y = y;
	}
	r.animateToIdx = function(sectionIdx, promptIdx) {
		var sectionY = getSectionPos(sectionIdx);
		if (promptIdx === undefined) {
			var x = tree.pos.x;
			var y = sectionY;
		} else {
			var x = tree.pos.x + tree.promptIndent;
			var y = sectionY + (promptIdx+1) * (tree.blockHeight + tree.blockSpacing);//+1 to account for section block, yo
		}
		if (x!=this.pos.x || y!=this.pos.y) {
			this.animate({tramsform:'t' + x + ',' + y}, 250);
		}
		this.sectionIdx = sectionIdx;
		this.promptIdx = promptIdx;
		this.pos.x = x;
		this.pox.y = y;
	}
	//r.drag(dragFuncs.onMove, dragFuncs.onStart, dragFuncs.onEnd);
	r.pos = P(0,0);
	r.snapToIdx(sectionIdx, promptIdx);
	return {rect:r};
}

function posOnPaper(mousePos, paper) {
	return P(mousePos.x-paper._left, mousePos.y-paper._top);
}