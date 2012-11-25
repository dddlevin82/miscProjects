var sqlite = require('sqlite3');
var http = require('http');
var crypto = require('crypto');
var fs = require('fs');
var url = require('url');

var db = new sqlite.Database('hits', createTable);

function createTable() {
    console.log("createTable hitCounts");
    db.run("CREATE TABLE IF NOT EXISTS hitCounts (hash TEXT, hits INT)");
}



counts = {};


http.createServer(function(req, res) {
	var url = req.url;
	if (url=="/favicon.ico") { 
		favicon(req, res);
	} else {
		mainStuff(req, res);
	}

	


}).listen(1337);

function favicon(req, res) {
	res.writeHead(200, {'Content-Type': "image/x-icon"});
	fs.createReadStream("favicon.ico").pipe(res);
}

function mainStuff(req, res) {
	var hasher = crypto.createHash('sha1');
	hasher.update(req.url);
	hasher.update('lala');
	
	var hash = hasher.digest('hex');
	console.log(url.parse(req.url, true));
	db.all("SELECT hits FROM hitCounts WHERE hash=?", hash, function(error, rows) {
		var hits;
		if (rows.length==0) {
			hits = 1;
			db.run("INSERT INTO hitCounts (hash, hits) VALUES (?, ?)", hash, 1);
		} else {
			hits = rows[0].hits+1;
			db.run("UPDATE hitCounts SET hits = hits+1 WHERE hash = ?", hash);
		}
		
		console.log(req.url, hash, error, rows);
		res.writeHead(200, {'Content-Type': "text/html"});
		fs.createReadStream("someFile.html").pipe(res);
		/*res.writeHead(200, {'Content-Type': 'text/plain'});
		res.write('Visited SO ' + hits + ' times!11');
		res.end();*/
	})

}
console.log('Runnnning!');