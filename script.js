$(function() {
    $(document).ready(function() {
        $("#userheader").html("You are " + username);
    });

    var socket = io();
    let username = "";
    let usernumber;

    $("form").submit(function() {
        // Prevent empty messages from being sent
        if ($("#m").val() === "") {
            return false;
        }

        socket.emit("chat message", $("#m").val());
        $("#m").val("");
        return false;
    });

    // Recieve a message a message
    socket.on("chat message", function(msg) {
        addMessage(msg);
    });

    // Restore chat history
    socket.on("chat history", function(chatHistory) {
        for (msg of chatHistory) {
            addMessage(msg);
        }
    });

    function addMessage(msg) {
        $("#messages").append($("<li>").html(displayMessages(msg)));
        $("#messages").scrollTop($("#messages")[0].scrollHeight);
    }

    // Get list of people online
    socket.on("online users", function(onlineUsers) {
        $("#users").empty();

        console.log(onlineUsers);

        for (user of onlineUsers) {
            $("#users").append($("<li>").text(user));
        }
        $("#users").scrollTop($("#users")[0].scrollHeight);
    });

    // When initially connecting to server
    socket.on("connect", () => {
        // Either restore state or get a new nickname
        if (document.cookie != "") {
            socket.emit("restore state", document.cookie);
        } else {
            socket.emit("new user");
        }
    });

    // Get notified if the username has been assigned
    socket.on("assigned username", function(assignedUsername) {
        username = assignedUsername;

        $("#userheader").html("You are " + username);
        document.cookie = "username=" + username;
    });

    // Get assigned a username
    socket.on("assigned color", function(newColor) {
        document.cookie = "color=" + newColor;
    });

    // Get assigned a usernumber
    socket.on("assigned number", function(newNumber) {
        document.cookie = "usernumber=" + newNumber;
        usernumber = newNumber;
    });

    function displayMessages(message) {
        let time = new Date(message.time);
        let hours = time.getHours();
        let minutes = time.getMinutes();
        minutes = minutes < 10 ? "0" + minutes : minutes;

        let user =
            '<span style="color:#' +
            message.color +
            '">' +
            message.user +
            "</span>";

        let msgContent =
            message.userNumber === usernumber
                ? '<span style="font-weight:bold">' +
                  message.message +
                  "</span>"
                : message.message;

        console.log(usernumber);

        return hours + ":" + minutes + " " + user + ": " + msgContent;
    }
});
