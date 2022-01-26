const io = require("socket.io")(3000, {
    cors: {
        origin: [
            "http://localhost:5500",
            "http://127.0.0.1:5500",
            "http//192.168.1.226:5500",
        ],
    },
})

const users = {}

io.on("connection", (socket) => {
    socket.on("new-user", (name) => {
        users[socket.id] = name
        socket.broadcast.emit("user-connected", name)
    })

    socket.on("send-chat-message", (message) =>
        socket.broadcast.emit("chat-message", message, users[socket.id])
    )

    socket.on("disconnect", () => {
        socket.broadcast.emit("user-disconnected", users[socket.id])
        delete users[socket.id]
    })
})
