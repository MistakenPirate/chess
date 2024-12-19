const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = { white: null, black: null };

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index.ejs", { title: "Chess Game" });
});

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  // Assign player roles
  if (!players.white) {
    players.white = socket.id;
    socket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = socket.id;
    socket.emit("playerRole", "b");
  } else {
    socket.emit("spectatorRole");
  }

  // Handle disconnect
  socket.on("disconnect", () => {
    if (socket.id === players.white) {
      players.white = null;
    } else if (socket.id === players.black) {
      players.black = null;
    }
  });

  // Handle moves
  socket.on("move", (move) => {
    try {
      // Validate turn
      if (
        (chess.turn() === "w" && socket.id !== players.white) ||
        (chess.turn() === "b" && socket.id !== players.black)
      ) {
        console.log("Not your turn!");
        return;
      }

      // Apply the move
      const result = chess.move(move);
      if (result) {
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid move:", move);
        socket.emit("invalidMove", move);
      }
    } catch (err) {
      console.error("Error handling move:", err);
    }
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
