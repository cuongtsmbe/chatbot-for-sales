const httpServer = require("http").createServer();
const {redis} = require("./../util/redis");
const config = require("../config/default.json");
const { createAdapter } = require('@socket.io/redis-adapter');
const io = require("socket.io")(httpServer, {
  cors: {
    origin: config.fontendURL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const pubClient = redis;
const subClient = redis.duplicate();

io.adapter(createAdapter(pubClient, subClient));

io.use(async (socket, next) => {
  const userID = socket.handshake.auth.userID;
  if (!userID) {
    return next(new Error("invalid userID"));
  }
  socket.userID = userID;
  return next();
});

io.on("connection", async (socket) => {
    socket.join(socket.userID);
    socket.on("disconnect", async () => {});
});

module.exports = {
    io
}; 