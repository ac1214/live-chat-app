var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var port = process.env.PORT || 3000;

let messages = [];
let userList = [];

let usernameNumber = 1;
let userNumber = 0;

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
    let username;
    let userColor = "ffffff"; // Set default text color
    let currentUserNumber;

    console.log(userList);

    // Restore previous state from cookies
    socket.on("restore state", function(cookie) {
        let cookieArray = cookie.split(";");
        for (c of cookieArray) {
            let varVal = c.split("=");
            varVal[0] = varVal[0].trim();
            varVal[1] = varVal[1].trim();

            if (varVal[0] === "username") {
                if (checkUniqueUsername(varVal[1])) {
                    username = varVal[1];
                } else {
                    username = getUniqueUsername;
                    socket.emit("assigned username", username);
                }
                userList.push(username);
            } else if (varVal[0] === "color") {
                if (checkValidColor(varVal[1])) {
                    userColor = varVal[1];
                }
            } else if (varVal[0] === "usernumber") {
                currentUserNumber = parseInt(varVal[1]);
            }
        }

        // If any values were not efined by the cookies, then define them
        if (currentUserNumber === undefined) {
            currentUserNumber = userNumber++;
            socket.emit("assigned number", currentUserNumber);
        }
        if (username === undefined) {
            username = getUniqueUsername();
            socket.emit("assigned username", username);
        }
    });

    // Send the newly connected user chat history
    socket.emit("chat history", messages);
    // Send the user the list of people who are online
    //    io.emit("online users", userList);

    socket.on("chat message", function(msg) {
        // Check if the message is a command
        if (msg.charAt(0) === "/") {
            // Get the command
            let command = msg.substring(1, msg.indexOf(" "));
            // Get the user input
            let input = msg.substring(msg.indexOf(" ") + 1);

            // Check what the command is
            if (command === "nick") {
                if (!updateNick(input)) {
                    socket.emit(
                        "chat message",
                        "Failed to update nickname, choose a unique username"
                    );
                }
            } else if (command === "nickcolor") {
                if (!checkValidColor(input)) {
                    socket.emit(
                        "chat message",
                        "Failed to update nickname color, choose a valid color"
                    );
                } else {
                    userColor = input;
                }
            } else {
                socket.emit("chat message", "Invalid command");
            }
        } else {
            // TODO: Store user info here too
            let message = {
                user: username,
                userNumber: currentUserNumber,
                time: Date.now(),
                message: msg,
                color: userColor
            };
            messages.push(message);

            io.emit("chat message", message);
        }

        console.log(messages);
    });

    function updateNick(newNick) {
        if (checkUniqueUsername()) {
            // Replace old username with new one
            userList[userList.indexOf(username)] = newNick;
        } else {
            return false;
        }
        updateUserList();
        return true;
    }

    function updateColor(newColor) {
        if (checkUniqueUsername()) {
            // Update username and remove old one
            userList.splice(userList.indexOf(username), 1);
            userList.push(newNick);
        } else {
            return false;
        }
        // Send the user a new list of people who are online
        io.emit("online users", userList);
        return true;
    }

    // Remove user from userlist when disconnected
    socket.on("disconnect", reason => {
        userList.splice(userList.indexOf(username), 1);
        console.log(reason);
    });

    // Update nick color
    socket.on("update nickcolor", function(newNickColor) {
        // TODO: Update nickcolor here
        console.log(newNickColor);
    });

    // Get a new nickname
    socket.on("get nick", function() {
        // If a user number isn't defined then get one
        if (currentUserNumber === undefined) {
            currentUserNumber = userNumber++;
            socket.emit("assigned number", currentUserNumber);
        }
        username = getUniqueUsername();
        userList.push(username);

        socket.emit("assigned username", username);
    });

    function updateUserList() {
        // Send the users a new list of people who are online
        io.emit("online users", userList);
    }

    function buildErrorMessage(errorMessage) {
        let errorMessage = {
            user: "ERROR",
            userNumber: -1,
            time: Date.now(),
            message: errorMessage,
            color: "ff0000"
        };

        return errorMessage;
    }
});

http.listen(port, function() {
    console.log("listening on *:" + port);
});

function getUniqueUsername() {
    let uniqueUsername = "User" + usernameNumber;
    while (!checkUniqueUsername(uniqueUsername)) {
        usernameNumber++;
        uniqueUsername = "User" + usernameNumber;
    }

    return uniqueUsername;
}

function checkUniqueUsername(username) {
    let index = userList.indexOf(username);

    // If the index is -1 it has not been found and it is a unique username
    if (index == -1) {
        return true;
    } else {
        return false;
    }
}

function checkValidColor(color) {
    // From: https://www.sitepoint.com/community/t/how-to-check-if-string-is-hexadecimal/162739
    // Check if a number is hexadecimal value using regex
    const regex = /[0-9A-Fa-f]{6}/g;

    if (regex.test(color)) {
        return true;
    } else {
        return false;
    }
}
