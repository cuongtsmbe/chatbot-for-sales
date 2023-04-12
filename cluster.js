const cluster = require("cluster");
const http = require("http");
const numCPUs = require("os").cpus().length;
const { setupMaster } = require("@socket.io/sticky");
const { setupPrimary } = require("@socket.io/cluster-adapter");
const app = require("./app");
const { setupWorker } = require("@socket.io/sticky");
const { io } = require("./websocket/socket");

if (cluster.isMaster) {
    console.log(`[*Master* ${process.pid}] is running`);

    const httpServer = http.createServer(app);

    setupMaster(httpServer, {
      loadBalancingMethod: "least-connection",
    });

    // setup connections between the workers
    setupPrimary();

    cluster.setupPrimary({
      serialization: "advanced",
    });

    httpServer.listen(process.env.PORT);

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on("exit", (worker) => {
      console.log(`Worker ${worker.process.pid} died`);
      cluster.fork();
    });
} else {
    console.log(`[*Worker* ${process.pid}] started`);
    // setup connection with the primary process
    setupWorker(io);
}