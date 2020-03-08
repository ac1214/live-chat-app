$(function() {
    console.log("TEST");

    var socket = io();
    let username = "";
    let usernumber;

    $("#userheader").html("You are " + username);

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
        $("#messages").append(
            $(
                '<li style="color:#' + msg.color + checkSelfMsg(msg) + ';">'
            ).text(displayMessages(msg) + usernumber)
        );
        $("#messages").scrollTop($("#messages")[0].scrollHeight);
    }

    // Check if the message was sent by us and change the number
    function checkSelfMsg(msg) {
        return msg.userNumber === usernumber ? ";font-weight:bold" : "";
    }

    // Get list of people online
    socket.on("online users", function(onlineUsers) {
        $("#users").empty();

        for (user of onlineUsers) {
            $("#users").append($("<li>").text(user));
        }
        $("#users").scrollTop($("#users")[0].scrollHeight);
    });

    // When initially connecting to server
    socket.on("connect", () => {
        // From: https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
        socket.emit("restore state", document.cookie);
    });

    // Get notified if the username has been assigned
    socket.on("assigned username", function(assignedUsername) {
        $("#userheader").html("You are " + assignedUsername);
        username = assignedUsername;
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

        return (
            hours + ":" + minutes + " " + message.user + ": " + message.message
        );
    }
});
