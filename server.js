const express = require("express")
const app = express()
const server = require("http").Server(app)
const io = require("socket.io")(server, {
    cors: {
        origin: [
            "http://localhost:5500",
            "http://127.0.0.1:5500",
            "http//192.168.1.226:5500",
            "http//192.168.1.226:5500",
        ],
    },
})

app.set("views", "./views")
app.set("view engine", "ejs")
app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }))

const getUserRooms = (socket) =>
    Object.entries(rooms).reduce((names, [name, room]) => {
        if (room.users[socket.id] != null) names.push(name)
        return names
    }, [])

const rooms = {}

app.get("/", (_, res) => {
    res.render("index", { rooms: rooms })
})

app.post("/room", (req, res) => {
    if (rooms[req.body.room] != null) {
        return res.redirect("/")
    }
    rooms[req.body.room] = { users: {} }
    res.redirect(req.body.room)
    io.emit("room-created", req.body.room)
})

app.get("/:room", (req, res) => {
    if (rooms[req.params.room] == null) {
        return res.redirect("/")
    }
    res.render("room", { roomName: req.params.room })
})

server.listen(3000)

io.on("connection", (socket) => {
    socket.on("new-user", (room, name) => {
        socket.join(room)
        rooms[room].users[socket.id] = name
        socket.broadcast.to(room).emit("user-connected", name)
    })

    socket.on("send-chat-message", (room, message) => {
        socket.broadcast
            .to(room)
            .emit("chat-message", message, rooms[room].users[socket.id])
    })

    socket.on("disconnect", () =>
        getUserRooms(socket).forEach((room) => {
            socket.broadcast
                .to(room)
                .emit("user-disconnected", rooms[room].users[socket.id])
            delete rooms[room].users[socket.id]
        })
    )
})
