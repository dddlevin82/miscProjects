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

function DataDisplayer () {
	this.entries = {};
}
DataDisplayer.prototype = {
	setReadouts: function(readouts) {
		this.readouts = readouts;
	},
	addEntry: function(attrs) {
		var self = this;
		var label = attrs.label || '';
		var decPlaces = defaultTo(1, attrs.decPlaces);
		var handle = attrs.handle;
		var expr = attrs.expr || '';
		var units = attrs.units || '';
		var readout = this.readouts[attrs.readout];
		if (!readout) console.log('Bad readout name ' + attrs.readout);
		var listenerStr = 'display' + label + this.entries.length;
		var readoutEntry = readout.addEntry(label + handle);
		var dataEntry = new this.Entry(handle, label, decPlaces, expr, units, listenerStr, this, readoutEntry);
		this.entries[dataEntry.handle] = dataEntry;
		with (DataGetFuncs) {
			var func;
			if (exprHasReturn(expr)) {
				func = eval('(function(){' + expr + '})');
			} else {
				func = eval('(function(){return ' + expr + '})')
			
			}
			addListener(curLevel, 'update', listenerStr, function() {
				var displayStr = label;
				var valStr;
				var val = func();
				if (isNaN(val) || val === undefined) 
					valStr = ''
				else
					valStr = self.setDecPlaces(val, decPlaces);
					
				displayStr += valStr + ' ';
				displayStr += units;
				readoutEntry.setText(displayStr);
			})
		
		}
		return dataEntry;
	},

	setDecPlaces: function(val, decPlaces) {
		var src = String(val);
		var toReturn = '';
		var idx = 0;
		var decHit = false;
		var numDec = 0;
		var decIdx = src.indexOf('.');
		if (decIdx == -1) {
			src = String(src) + '.';
			for (var i=0; i<decPlaces; i++) src += '0';
			return src;
		} else {
			var roundFactor = Number('1e' + decPlaces);
			var unround = Number(src.slice(0, decIdx + decPlaces + 2));
			var round = String(Math.round(roundFactor * unround) / roundFactor);
			var decIdx = round.indexOf('.');
			var zerosToAdd;
			if (decIdx == -1) {
				round += '.';
				zerosToAdd = decPlaces;
			} else {
				zerosToAdd = decIdx + decPlaces - round.length + 1;
			}
			for (var i=0; i<zerosToAdd; i++) {
				round += '0';
			}
			return round;
		}
		
	},
	removeEntry: function(handle) {
		if (this.entries[handle]) {
			this.entries[handle].remove();
		}
	},
	Entry: function(handle, label, decPlaces, expr, units, listenerStr, dataDisplayer, readoutEntry) {
		this.handle = handle;
		this.label = label;
		this.decPlaces = decPlaces;
		this.expr = expr;
		this.units = units;
		this.listenerStr = listenerStr;
		this.dataDisplayer = dataDisplayer;
		this.readoutEntry = readoutEntry;
		this.removed = false;
	},
}
DataDisplayer.prototype.Entry.prototype = {
	remove: function() {
		if (!this.removed) {
			delete this.dataDisplayer.entries[this.handle];
			this.readoutEntry.remove();
			removeListener(curLevel, 'update', this.listenerStr);
			this.removed = true;
		}
	}	
}
