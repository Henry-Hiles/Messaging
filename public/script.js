import moment from "https://jspm.dev/moment"
import { io } from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js"
const socket = io()
const messageButton = document.querySelector("#send")
const menuButton = document.querySelector("#menu")
const nameButton = document.querySelector("#name")
const nameInput = document.querySelector("input")
const roomInput = document.querySelector("#room")
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

const submitMessage = () => {
    if (!messageInput.value) return (messageInput.required = true)
    messageInput.required = false
    socket.emit("send-chat-message", roomName, messageInput.value)
    addMessage({ user: "you", message: messageInput.value, isYours: true })
    messageInput.value = ""
}

const rowLimit = 3
let lastMessageScrollheight = messageInput.scrollHeight

messageInput.addEventListener("input", () => {
    var rows = parseInt(messageInput.getAttribute("rows"))
    messageInput.setAttribute("rows", "1")

    if (rows < rowLimit && messageInput.scrollHeight > lastMessageScrollheight)
        rows++
    else if (rows > 1 && messageInput.scrollHeight < lastMessageScrollheight)
        rows--

    lastMessageScrollheight = messageInput.scrollHeight
    messageInput.setAttribute("rows", rows)
})

const type = (newText) => {
    const element = document.activeElement
    element.setRangeText(
        newText,
        element.selectionStart,
        element.selectionEnd,
        "end"
    )
}

roomInput.addEventListener("keydown", (event) => {
    if (event.code == "Space") {
        event.preventDefault()
        type("-")
    } else if (!/^[-a-z0-9]+$/i.test(event.key)) event.preventDefault()
})

const checkAlphanumeric = (event) => {
    const text = (event.clipboardData || event.dataTransfer).getData("Text")
    if (!/^[-a-z0-9]+$/i.test(text)) event.preventDefault()
}

roomInput.addEventListener("paste", checkAlphanumeric)
roomInput.addEventListener("drop", checkAlphanumeric)

messageInput.addEventListener("keydown", (event) => {
    if (event.key != "Enter" || event.shiftKey) return
    event.preventDefault()
    submitMessage()
})

const toggleOpen = () =>
    document.querySelector("#rooms").classList.toggle("opened")

const addMessage = ({ message, isYours, isSystem, user }) => {
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

    if (window.screen.width < 1000) {
        toggleOpen()
        document.querySelector("#roomName").innerText = roomName
    }
}

document.querySelector("#room-form").addEventListener("submit", (event) => {
    if (!roomInput.value.trim()) {
        event.preventDefault()
        roomInput.required = true
        document.querySelector("#room-button").classList.add("required")
    }
})

menuButton.addEventListener("click", toggleOpen)

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

if (messageButton) messageButton.addEventListener("click", submitMessage)

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
