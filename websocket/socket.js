const httpServer = require("http").createServer();
const {redis} = require("./../util/redis");
const config = require("../config/default.json");
const { createAdapter } = require('@socket.io/redis-adapter');
const io = require("socket.io")(httpServer, {
  cors: {
    origin: config.fontendURL
  }
});

const pubClient = redis;
const subClient = redis.duplicate();
const adapter = createAdapter(pubClient, subClient);

// Set the adapter for socket.io
io.adapter(adapter);

const { setupWorker } = require("@socket.io/sticky");
const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex");

const { RedisSessionStore } = require("./../models/sessionStore");
const sessionStore = new RedisSessionStore(redis);

io.use(async (socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  if (sessionID) {
    const session = await sessionStore.findSession(sessionID);
    if (session) {
      socket.sessionID = sessionID;
      socket.userID = session.userID;
      socket.username = session.username;
      return next();
    }
  }
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.sessionID = randomId();
  socket.userID = randomId();
  socket.username = username;
  next();
});

io.on("connection", async (socket) => {
  // persist session
  sessionStore.saveSession(socket.sessionID, {
    userID: socket.userID,
    username: socket.username,
    connected: true,
  });

  // emit session details
  socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });

  // join the "userID" room
  socket.join(socket.userID);
  // notify users upon disconnection
  socket.on("disconnect", async () => {
   
  });
});

setupWorker(io);
