var http = require('http');
var crypto = require('crypto');
var fs = require('fs');
var url = require('url');
var thermoSimPath = 'thermoSim/'
var allSimulations = [
	new SimulationReference('rev', 'Reversibility', 'danielTest.html', 'wooo')
]

http.createServer(function(req, res) {
	var urlParse = url.parse(req.url, true);
	var pathname = urlParse.pathname;
	urlParse.pathname = cutSlashes(urlParse.pathname)
	var ext = getExt(urlParse.pathname);
	console.log('path name ' + urlParse.pathname + ' with ext ' + ext);
	pathname = urlParse.pathname;
	if (ext===undefined) {
		if (pathname == "") {
			thermoSimMain(req, res, urlParse, allSimulations);
		} else {
			res.writeHead(200, {'Content-Type': 'text/html'})
			res.end('Page not found');
		}
	} else {
		serveFile(req, res, urlParse.pathname, ext);
	}

}).listen(1337);

function SimulationReference(handle, title, fileName, description) {
	this.handle = handle;
	this.title = title;
	this.fileName = fileName;
	this.description = description;
}



function startsWith(str, substr) {
	return str.indexOf(substr)==0;
}

function getEnd(str) {
	var slashIdx = str.indexOf('/');
	if (slashIdx==-1) {
		return str;
	} else {
		return getEnd(str.slice(slashIdx+1, str.length));
	}
}

function getExt(pathname) {
	var dotIdx = pathname.indexOf('.');
	if (dotIdx==-1) {
		return undefined;
	} else {
		var recurse = getExt(pathname.slice(dotIdx+1, pathname.length));
		if (recurse==undefined) {
			return pathname.slice(dotIdx+1, pathname.length);
		} else {
			return recurse;
		}
	}
}

function thermoSimMain(req, res, urlParse, sims) {
	var str = "";
	str += "<p>Simulations:</p>";
	for (var simIdx=0; simIdx<sims.length; simIdx++) {
		var sim = sims[simIdx];
		str += '<a href = "' + thermoSimPath + 'levels/' + sim.fileName + '">' + sim.title + '</a>: ' + sim.description + '<br>';
	}
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(str);
	// db.all("SELECT dir, title, fileName FROM sims", function(error, rows) {
		// for (rowIdx=0; rowIdx<rows.length; rowIdx++) {
			// var row = rows[rowIdx];
			// var dir = row.dir;
			// var title = row.title;
			// var fileName = row.fileName;
			// str += "<p>" + title + ": at " + link(dir, 'thermoSim/'+dir) + ', loads file ' + row.fileName + '</p>';
		// }
		// writePage(res, str);
	// });
}

function thermoSimAdd(req, res, urlParse) {
	var str = "";
	var query = urlParse.query;
	db.all("SELECT dir, fileName FROM sims WHERE dir=?", query.dir, function(error, rows) {
		console.log(rows);
		if (rows.length==0 && query.dir && query.fileName) {
			db.run("INSERT INTO sims (dir, fileName, title) VALUES (?, ?, ?)", query.dir, query.fileName, query.title);
			str += "Entry at /thermoSim/" + query.dir + "<br>";
		} else if (rows.length>0 && query.dir.length>0 && query.title.length>0 && query.dir.length>0) {
			db.run("UPDATE sims SET fileName = ?, title = ? WHERE dir = ?", query.fileName, query.title, query.dir);
			str += "Entry at /thermoSim/ " + query.dir + " updated to " + query.fileName + ".";
		}
		console.log('rows ');
		console.log('len ' + rows.length);
		for (row in rows) {
			console.log(rows[row]);
		}
		console.log('fin rows');
		str += "<p>Add simulation:</p>";
		str += "<form>";
		str += "Title: <input type='text' name='title'><br>";
		str += "thermoSim/: <input type='text' name='dir'><br>";
		str += "HTML file: <input type='text' name='fileName'>";
		str += "<input type='submit' value='Add'>";
		str += "</form>";
		writePage(res, str);
		
	});	
}


function serveFile(req, res, pathname, ext) {
	try {
	//if (fs.exists(pathname)) {
		//console.log('serving ' + pathname);
		if (ext=='jpg' || ext=='jpeg') {
			res.writeHead(200, {'Content-Type': "image/jpeg"});
		} else if (ext=='ico') {
			res.writeHead(200, {'Content-Type': "image/x-icon"});
		} else if (ext=='html') {
			res.writeHead(200, {'Content-Type': 'text/html'});
		} else if (ext=='js') {
			res.writeHead(200, {'Content-Type': 'application/javascript'});
		} else if (ext=='png') {
			res.writeHead(200, {'Content-Type': 'image/png'});
		} else if (ext=='xml') {
			res.writeHead(200, {'Content-Type': 'text/xml'});
		} else if (ext=='css') {
			res.writeHead(200, {'Content-Type': 'text/css'});
		} else if (ext=='gif') {
			res.writeHead(200, {'Content-Type': 'image/gif'});
		} else {
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.end('File extension ' + ext + ' is not supported.');
			//console.trace();
		}
		var readStream = fs.createReadStream(pathname);
		readStream.on('open', function() {
			readStream.pipe(res);
		})
		readStream.on('error', function(err) {
			console.log(err);
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.end('File not found');
		})
	} catch(e) {
		console.log('File ' + pathname + ' does not exist');
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end("<p>I'm sorry, that file does not exist.  Please accept this free smiley face instead.</p>:)");		
		console.trace();
	}
}

function cutSlashes(pathname) {
	if (pathname[pathname.length-1] == "/") {
		pathname = pathname.slice(0, pathname.length-1);
	}
	if (pathname[0] == "/") {
		pathname = pathname.slice(1, pathname.length);
	}	
	return pathname;
}

function writePage(res, str) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(str);
}



function addTiny(req, res, urlParse) {
	var str = "";
	var query = urlParse.query;
	db.all("SELECT name, url FROM tinyUrls WHERE name=? AND url=?", query.name, query.url, function(error, rows) {
		console.log(rows);
		if (rows.length==0 && query.name && query.url) {
			db.run("INSERT INTO tinyUrls (name, url) VALUES (?, ?)", query.name, query.url);
			str += "Entry at /tiny/" + query.name + "<br>";
		} else if (rows.length>0) {
			str += "Entry at /tiny/ " + query.name + " for url " + query.url + " already exists, silly.";
		}
		console.log('rows ');
		console.log('len ' + rows.length);
		for (row in rows) {
			console.log(rows[row]);
		}
		console.log('fin rows');
		str += "<form>";
		str += "URL: <input type='text' name='url'><br>";
		str += "Name: <input type='text' name='name'>";
		str += "<input type='submit' value='Add'>";
		str += "</form>";
		writePage(res, str);
		
	});
}

function printTiny(req, res, urlParse) {
	var str = "";
	str += "<p>Tiny urls:</p>";
	db.all("SELECT name, url FROM tinyUrls", function(error, rows) {
		for (rowIdx=0; rowIdx<rows.length; rowIdx++) {
			var row = rows[rowIdx];
			var name = row.name;
			var url = row.url;
			str += "<p>tiny/" + name + " links to <a href=" + url + ">" + url + "</a></p>";
		}
		writePage(res, str);
	});
}

function link(url, text) {
	return "<a href = " + url + " >" + text + "</a>";
}

function toTiny(req, res, urlParse) {
	var str = "";
	var name = urlParse.pathname.slice(5, urlParse.pathname.length);
	db.all("SELECT url FROM tinyUrls WHERE name=?", name, function(error, rows) {
		if (rows.length==0) {
			writePage(res, "tiny/" + name + " does not exist");
			console.trace();
		} else {
			var row = rows[0];
			console.log(row.url);
			res.writeHead(301, 'Moved Permanently', {Location: row.url});
			res.end();
		}
	});
}
console.log('Runnnning!');