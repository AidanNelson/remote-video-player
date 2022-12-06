const express = require("express");
const https = require("https");
const devcert = require("devcert");
const fs = require("fs");

async function main() {
  // Set up express to serve the admin console
  const app = express();
  console.log("Serving static files at ", process.cwd() + "/admin");
  app.use(express.static(process.cwd() + "/admin"));

  // set up HTTPS server and SSL certificates
  let ssl;
  if (process.env.ENVIRONMENT === "PRODUCTION") {
    ssl = {
      key: fs.readFileSync(process.cwd() + "/certs/privkey.pem"),
      cert: fs.readFileSync(process.cwd() + "/certs/fullchain.pem"),
    };
  } else {
    ssl = await devcert.certificateFor("localhost");
  }
  const server = https.createServer(ssl, app);

  // have our HTTPS server listen on HTTPS standard port (443)
  const port = 443;
  server.listen(port);
  console.log(`Server listening on https://localhost:${port}`);

  // set up our socket.io server using the HTTPS server (with permissive CORS)
  let io = require("socket.io")();
  io.listen(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // keep track of our clients for any admin purposes...
  const clients = {};

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    clients[socket.id] = {};

    socket.on("cmd", (data) => {
      console.log(`Received command:${data.type}`);
      if (data.playerId === 0) {
        // send to all
        console.log(`Sending command: ${data.type} to all clients.`);
        io.sockets.emit("cmd", data);
      } else {
        // TODO: address individual sockets
      }
    });
  });
}

main();