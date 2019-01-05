var fs =require('fs');
var port = process.env.PORT || 8000;
var server = require('http').createServer(function(req, res) {

	var url = req.url;
	var tmp = url.split('.');
	var ext = tmp[tmp.length - 1];
 	var path = '.' + url;

	res.writeHead(200, {'Content-Type': getType(req.url)});

	var output = null;

	if (ext == "/") {
		output = fs.readFileSync('./index.html','utf-8');
	} else if (ext == "html" && req.url === "/index.html") {
		output = fs.readFileSync('./index.html','utf-8');
	} else if (ext == "html" && req.url === "/teacher.html") {
		output = fs.readFileSync('./teacher.html', 'utf-8');
	} else if (ext == "jpg" || ext == "gif" || ext == "png") {
		console.log(path);
		output = fs.readFileSync(path, "binary");
		res.end(output, "binary");
	} else {
		console.log(path);
		output = fs.readFileSync(path, "utf-8");
	}
	
	res.end(output);
	
}).listen(port);


var io = require('socket.io').listen(server);

io.sockets.on("connection", function (socket) {

	socket.on("connected", function(msg) {
		console.log("someone connect websocket.");
	});

	socket.on("publish", function(data) {
		io.sockets.emit("publish", {value: data.value});
	});

	socket.on("disconnect", function() {
		console.log("someone disconnect websocket");
	});
});

function getType(_url) {
  var types = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".png": "image/png",
    ".gif": "image/gif",
    ".jpg": "image/jpeg",
    ".svg": "svg+xml"
  }
  for (var key in types) {
    if (_url.endsWith(key)) {
      return types[key];
    }
  }
  return "text/plain";
}


