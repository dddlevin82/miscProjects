function Tree(paper, pos) {
	this.paper = paper;
	this.pos = pos; //upper left corner of first section
	this.blockHeight = 40;
	this.blockWidth = 100;
	this.blockSpacing = 10;
	this.totalBlockHeight = this.blockHeight + this.blockSpacing;
	this.promptIndent = 30;
	this.blockCol = Col(100,160,193);//'#64a0c1';
	this.blockColHover = Col(92, 147, 178);//'#5c93b2';
	this.blockColSelect = Col(82,108,122);//'#526c7a';
	this.blockColStroke = Col(59,68,73);//'#3b4449';
	this.placerRectPos = P(200, 300);
	this.placerRect = this.makePlacerRect();
	//this.placerBGRect = this.makePlacerBGRect();
	this.sections = [];
	
}

Tree.prototype = {
	addSection: function(mousePos, section) {
		var pos = posOnPaper(mousePos, this.paper);
		var sectionIdx = this.getNewSectionIdx(pos);
		if (!section) {
		/*should make it send rectangle corner positions*/
			section = new TreeSection(this, pos/*GET A POINT FOR THE UPPER LEFT CORNER, NOT FOR MOUSEPOS*/, undefined, undefined);
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
	makePlacerRect: function() {
		var pos = this.placerRectPos;
		var placer = new TreeSection(this, pos, undefined, undefined);
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
						
						y += this.totalBlockHeight;
					}
				}
			}
		}
	},

}

function TreeSection(tree, posInit, dragFuncs, onClick) {
	this.tree = tree;
	this.prompts = [];
	this.pos = posInit.copy();
	this.button = new TreeButton(this.tree, this.pos, dragFuncs, onClick);
 
}

TreeSection.prototype = {
	addPrompt: function(releasePos, prompt) {
		var newIdx = this.getNewPromptIdx(releasePos);
		if (!prompt) {
			prompt = new TreePrompt(this.tree, this, releasePos)
		}
		this.prompts.splice(newIdx, 0, prompt);
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

function TreePrompt(tree, section, posInit) {
	this.tree = tree;
	this.section = section;
	this.button = new TreeButton(this.tree, posInit, undefined, undefined);
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
	}
}

function TreeButton(tree, posInit, dragFuncs, onClick) {
	this.tree = tree;
	this.pos = posInit.copy();
	this.rect = this.makeRect();
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
		rect.transform('t' + this.pos.x + ',' + this.pos.y);
		return rect;
	},
	
	snapToPos: function(pos) {
		if (!pos.sameAs(this.pos)) {
			this.rect.transform('t' + pos.x + ',' + pos.y);
		}
		this.pos.set(pos);	
	},
	flyToPos: function(pos) {
		if (!pos.sameAs(this.pos)) {
			this.rect.animate({transform:'t' + pos.x + ',' + pos.y}, 250);
		}
		this.pos.set(pos);
	},
	remove: function() {
		this.rect.remove();
	},
}

function posOnPaper(mousePos, paper) {
	return P(mousePos.x-paper._left, mousePos.y-paper._top);
}