$(function() {
  console.log("TEST");

  var socket = io();

  $("form").submit(function() {
    // Prevent empty messages from being sent
    if ($("#m").val() === "") {
      return false;
    }

    socket.emit("chat message", $("#m").val());
    $("#m").val("");
    return false;
  });

  socket.on("chat message", function(msg) {
    $("#messages").append($("<li>").text(displayMessages(msg)));
    window.scrollTo(0, document.body.scrollHeight);
  });
});

function displayMessages(message) {
  let time = new Date(message.time);
  let hours = time.getHours();
  let minutes = time.getMinutes();

  return hours + ":" + minutes + " " + message.user + ": " + message.message;
}
