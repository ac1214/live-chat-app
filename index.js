var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var port = process.env.PORT || 3000;

// Store message history
let messages = [];
// Keep track of current users
let currentUsers = [];

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
    let username = "";
    let userColor = "ffffff"; // Set default text color
    let currentUserNumber = -1;

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
                    username = getUniqueUsername();
                }

                currentUsers.push(username);
            } else if (varVal[0] === "color") {
                if (checkValidColor(varVal[1])) {
                    userColor = varVal[1];
                }
            } else if (varVal[0] === "usernumber") {
                currentUserNumber = parseInt(varVal[1]);
            }
        }

        // If any values were not defined by the cookies, then define them
        if (currentUserNumber === undefined) {
            currentUserNumber = userNumber++;
        }
        if (username === undefined) {
            username = getUniqueUsername();
        }

        // Notify to the client to confirm it's username and userNumber
        socket.emit("assigned username", username);
        socket.emit("assigned number", currentUserNumber);

        // Update currentUsers for everyone connected
        updatecurrentUsers();

        // Send the newly connected user chat history
        socket.emit("chat history", messages);
    });

    // Create a new user
    socket.on("new user", function() {
        // Assign a user number
        currentUserNumber = userNumber++;

        // Get username
        username = getUniqueUsername();
        currentUsers.push(username);

        // Notify the client of it's username and userNumber
        socket.emit("assigned username", username);
        socket.emit("assigned number", currentUserNumber);

        // Update currentUsers for everyone connected
        updatecurrentUsers();

        // Send the newly connected user chat history
        socket.emit("chat history", messages);
    });

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
                        buildErrorMessage(
                            "Failed to update nickname, choose a unique username"
                        )
                    );
                } else {
                    socket.emit(
                        "chat message",
                        buildSuccessMessage("Updated nickname to " + username)
                    );
                }
            } else if (command === "nickcolor") {
                if (!checkValidColor(input)) {
                    socket.emit(
                        "chat message",
                        buildErrorMessage(
                            "Failed to update nickname color, choose a valid color"
                        )
                    );
                } else {
                    userColor = input;
                    socket.emit(
                        "chat message",
                        buildSuccessMessage(
                            "Successfully updated nickname color to " +
                                userColor
                        )
                    );
                }
            } else {
                socket.emit(
                    "chat message",
                    buildErrorMessage("Invalid command")
                );
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
    });

    function updateNick(newNick) {
        if (checkUniqueUsername(newNick)) {
            // Replace old username with new one
            currentUsers[currentUsers.indexOf(username)] = newNick;
            username = newNick;
        } else {
            return false;
        }

        socket.emit("assigned username", username);
        updatecurrentUsers();
        return true;
    }

    // Remove user from currentUsers when disconnected
    socket.on("disconnect", reason => {
        currentUsers.splice(currentUsers.indexOf(username), 1);
        updatecurrentUsers();
    });

    function updatecurrentUsers() {
        // Send the users a new list of people who are online
        io.emit("online users", currentUsers);
    }

    function buildErrorMessage(errorMessage) {
        let error = {
            user: "ERROR",
            userNumber: -1,
            time: Date.now(),
            message: errorMessage,
            color: "ff0000"
        };

        return error;
    }

    function buildSuccessMessage(successMessage) {
        let error = {
            user: "Success",
            userNumber: -1,
            time: Date.now(),
            message: successMessage,
            color: "00ff00"
        };

        return error;
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
    usernameNumber++;

    return uniqueUsername;
}

function checkUniqueUsername(username) {
    let index = currentUsers.indexOf(username);

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
