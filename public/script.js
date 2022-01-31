import moment from "https://jspm.dev/moment"
import { io } from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js"
const socket = io(":3000")
const messageButton = document.querySelector("#send")
const menuButton = document.querySelector("#menu")
const nameButton = document.querySelector("#name")
const nameInput = document.querySelector("input")
const roomContainer = document.querySelector("#room-container")
const messageInput = document.querySelector("textarea")
const login = document.querySelector("#login")
const nameDisplay = document.querySelector("#name-display")

setInterval(
    () =>
        document.querySelectorAll(".message-timestamp").forEach((element) => {
            element.innerText = moment(
                new Date(Number(element.closest(".message").dataset.time))
            ).fromNow()
        }),
    45000
)

const addMessage = (messageObject) => {
    const { message, isYours, isSystem, user } = messageObject
    const messageDiv = document
        .querySelector("template")
        .content.cloneNode(true)
        .querySelector(".message")

    if (isYours) messageDiv.classList.add("message-right")
    if (isSystem) messageDiv.classList.add("system")
    messageDiv.querySelector(".message-text").innerText = message
    const time = Date.now()
    messageDiv.dataset.time = time
    messageDiv.querySelector(".message-timestamp").innerText =
        moment(time).fromNow()
    if (user) messageDiv.querySelector(".message-user").innerText = `${user} • `
    document.querySelector("#messages").prepend(messageDiv)
}

if (roomName) {
    socket.emit("new-user", roomName, localStorage.getItem("name"))
    addMessage({
        message: "You joined",
        isYours: true,
        isSystem: true,
    })
}

menuButton.addEventListener("click", () =>
    document.querySelector("#rooms").classList.toggle("opened")
)

if (!localStorage.getItem("name")) login.classList.remove("done")
else nameDisplay.innerHTML = localStorage.getItem("name")

document
    .querySelector("#change-name")
    .addEventListener("click", () => login.classList.remove("done"))

socket.on("room-created", (room) => {
    const roomItem = document.createElement("li")
    const roomLink = document.createElement("a")
    roomLink.href = `/${room}`
    roomLink.innerText = room
    roomItem.append(roomLink)
    roomContainer.append(roomItem)
    if (document.querySelector("#no-rooms"))
        document.querySelector("#no-rooms").classList.add("changed")
})

if (nameButton)
    nameButton.addEventListener("click", () => {
        if (!nameInput.value) return (nameInput.required = true)
        document.querySelector("#login").classList.add("done")
        localStorage.setItem("name", nameInput.value)
        nameDisplay.innerHTML = localStorage.getItem("name")
        if (roomName) {
            socket.emit("name-change", roomName, nameInput.value)
            addMessage({
                message: `You renamed yourself to ${nameInput.value}`,
                isSystem: true,
            })
        }
    })

if (messageButton)
    messageButton.addEventListener("click", () => {
        if (!messageInput.value) return (messageInput.required = true)
        messageInput.required = false
        socket.emit("send-chat-message", roomName, messageInput.value)
        addMessage({ user: "you", message: messageInput.value, isYours: true })
        messageInput.value = ""
    })

socket.on("chat-message", (message, user) => {
    addMessage({ message, user })
})

socket.on("name-changed", (oldName, newName) => {
    addMessage({
        message: `${oldName} was renamed to ${newName}.`,
        isSystem: true,
    })
})

socket.on("user-connected", (name) => {
    addMessage({ message: `${name} joined`, isSystem: true })
})

socket.on("user-disconnected", (name) => {
    addMessage({ message: `${name} disconnected`, isSystem: true })
})
