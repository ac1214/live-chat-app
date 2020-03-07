var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var port = process.env.PORT || 3000;

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/view.html");
});

app.get("/script.js", function(req, res) {
  res.sendFile(__dirname + "/script.js");
});

app.get("/styles.css", function(req, res) {
  res.sendFile(__dirname + "/styles.css");
});

io.on("connection", function(socket) {
  socket.on("chat message", function(msg) {
    io.emit("chat message", msg);
  });
});

http.listen(port, function() {
  console.log("listening on *:" + port);
});
