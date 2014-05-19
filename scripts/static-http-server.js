var connect = require('connect');
connect.createServer(
    connect.static(__dirname + '/../spec')
).listen(8080);
