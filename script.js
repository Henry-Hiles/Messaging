import moment from "https://jspm.dev/moment"
import { io } from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js"
const socket = io(":3000")
const messageButton = document.querySelector("#send")
const nameButton = document.querySelector("button")
const nameInput = document.querySelector("input")
const messageInput = document.querySelector("textarea")

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
    else if (isSystem) messageDiv.classList.add("system")
    messageDiv.querySelector(".message-text").innerText = message
    const time = Date.now()
    messageDiv.dataset.time = time
    messageDiv.querySelector(".message-timestamp").innerText =
        moment(time).fromNow()
    if (user) messageDiv.querySelector(".message-user").innerText = `${user} • `
    document.querySelector("#messages").prepend(messageDiv)
}

nameButton.addEventListener("click", () => {
    if (!nameInput.value) return (nameInput.required = true)
    document.querySelector("#login").classList.add("done")
    socket.emit("new-user", nameInput.value)
    addMessage({
        message: "You joined",
        isYours: true,
        isSystem: true,
    })
})

messageButton.addEventListener("click", () => {
    if (!messageInput.value) return (messageInput.required = true)
    socket.emit("send-chat-message", messageInput.value)
    addMessage({ user: "you", message: messageInput.value, isYours: true })
    messageInput.value = ""
})

socket.on("chat-message", (message, user) => {
    addMessage({ message, user })
})

socket.on("user-connected", (name) => {
    addMessage({ message: `${name} joined`, isSystem: true })
})

socket.on("user-disconnected", (name) => {
    addMessage({ message: `${name} disconnected`, isSystem: true })
})
