const express = require("express")
const path = require("path")
const http = require("http")
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require("./utils/users");

const app = express();
const server = http.createServer(app)
const io = socketio(server)

//set static folder
app.use(express.static(path.join(__dirname, "public")));
const botName = "Chatcord Bot";

//run when client connects
io.on("connection", (socket) => {

    socket.on("joinRoom",({username, room}) => {

        const user = userJoin(socket.id, username, room)
        socket.join(user.room);

        //runs when client enters  // we're accessing these three methods in main.js by socket.on 
        socket.emit("message", formatMessage(botName, "welcome to ChatCord")) //(for a single client)

        //broadcast when a user connects
        socket.broadcast.to(user.room).emit("message",  formatMessage(botName,`${user.username} has joined the chat`))//(for all clients except the one who's connecting)

        //send users and room info
        io.to(user.room).emit("roomUsers", {
            room : user.room,
            users : getRoomUsers(user.room)
        })
    })

    //listening chatMessage from client side
    socket.on("chatMessage", (msg) => {

        const user = getCurrentUser(socket.id)
        io.to(user.room).emit("message", formatMessage(user.username, msg))
    })


    //runs when client disconnect
    socket.on("disconnect", () => {
        const user = userLeave(socket.id);
    
        if (user) {
          io.to(user.room).emit(
            "message",
            formatMessage(botName, `${user.username} has left the chat`)
          );
    
          // Send users and room info
          io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room),
          });
        }
      });
    });

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`server running on port ${PORT}`));