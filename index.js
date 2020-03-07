var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var port = process.env.PORT || 3000;

messages = [];

// Route for index.html file
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

// Route for client-side JavaScript file
app.get("/script.js", function(req, res) {
  res.sendFile(__dirname + "/script.js");
});

// Route for CSS file
app.get("/styles.css", function(req, res) {
  res.sendFile(__dirname + "/styles.css");
});

io.on("connection", function(socket) {
  console.log("a user connected");

  socket.on("chat message", function(msg) {
    // TODO: Store user info here too
    let message = { user: "temp", time: Date.now(), message: msg };
    messages.push(message);

    io.emit("chat message", message);

    console.log(messages);
  });

  // Remove user from userlist when disconnected
  socket.on("disconnecting", reason => {
    console.log(reason);
  });
});

http.listen(port, function() {
  console.log("listening on *:" + port);
});
