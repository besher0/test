// recipient-listener.js
import { io } from "socket.io-client";

const token = "Bearer <JWT-OF-USER-B>";
const conversationId = "<conversation-uuid>";

const socket = io("http://localhost:3000/conversations", {
  auth: { token },
});

socket.on("connect", () => {
  console.log("✅ Connected as recipient");
  socket.emit("join", { conversationId });
});

socket.on("new_message", (data) => {
  console.log("📩 New message received:", data);
});

socket.on("disconnect", () => console.log("❌ Disconnected"));