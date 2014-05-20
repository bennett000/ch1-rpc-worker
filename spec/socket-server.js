var app = require('http').createServer(handler),
io      = require('socket.io').listen(app), 
RPC     = require('./node/js-rpc.js');

app.listen(8079);

function handler (req, res) {
    res.writeHead(200);
    res.end(data);
}

function loopBack(arg) {
    console.log('looping back');
    if (arg) {
	return arg + ' hi there';
    }
    return 'looper';
}

io.sockets.on('connection', function (socket) {
    socket.on('message', function (){
	console.log('hi', arguments);
    });
    var rpc = new RPC({
	on: function (msg, fn) {
	    socket.on(msg, fn);
	},
	emit: function (message) {
	    socket.emit('message', message);
	}
    }, {
	listen: 'on',
	post: 'emit',
	message: 'message'
    });
    
    rpc.expose({
	loopBack: loopBack
    });
    
    setTimeout(function () {
	rpc.isReady(true);
    },25);
});