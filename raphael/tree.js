function Tree(paper, pos) {
	this.paper = paper;
	this.pos = pos;
	this.blockHeight = 40;
	this.blockWidth = 100;
	this.blockSpacing = 10;
	this.promptIndent = 25;
	this.blockCol = '#64a0c1';
	this.blockColHover = '#5c93b2';
	this.blockColSelect = '#526c7a';
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
	getNewSectionIdx: function(pos) {
		for (var sectionIdx=0; sectionIdx<this.sections.length; sectionIdx++) {
			if (this.sections[sectionIdx].pos.y > pos.y) {
				return sectionIdx;
			}
		}
		return this.sections.length;
	},
	getNewPromptSectionIdx: function(pos) {
		
	},
}

function Section(idx, tree) {
	this.idx = idx;
	this.tree = tree;
	this.prompts = [];
}

Section.prototype = {
	addPrompt: function(releasePos) {
		
	},
	getNewPromptIdx: function(releasePos) {
		
	}
}

function Block() {

}

Block.prototype = {

}

function posOnPaper(mousePos, paper) {
	return P(mousePos.x-paper._left, mousePos.y-paper._top);
}