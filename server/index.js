import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { registerHandlers } from "./handlers.js";

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "game-room-ws" });
});

const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  registerHandlers(io, socket);
});

server.listen(PORT, () => {
  console.log(`Game Room server listening on ${PORT}`);
});
