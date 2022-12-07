/* eslint-disable prefer-template */
/* eslint-disable no-console */
const express = require('express');
// const https = require('https');
const http = require('http');
const devcert = require('devcert');
const fs = require('fs');
const io = require('socket.io')();

const Mux = require('@mux/mux-node');

// make it possible to read credentials from .env files
const dotenv = require('dotenv');

dotenv.config();
// assume process.env.MUX_TOKEN_ID and process.env.MUX_TOKEN_SECRET contain your credentials
const muxClient = new Mux(); // Success!

let availableVideos = [];

async function getVideosFromMux() {
  console.log('getting available videos from mux!');
  availableVideos = await muxClient.Video.Assets.list();
}

async function getUploadUrlFromMux() {
  const upload = await muxClient.Video.Uploads.create({
    cors_origin: 'https://aidan.town',
    new_asset_settings: {
      playback_policy: 'public',
    },
  });

  return {
    url: upload.url,
  };
}

async function main() {
  // Set up express to serve the admin console
  const app = express();
  console.log('Serving static files at ', process.cwd() + '/admin/build');
  app.use(express.static(process.cwd() + '/admin/build'));

  // set up HTTPS server and SSL certificates
  let ssl;
  if (process.env.ENVIRONMENT === 'development') {
    ssl = await devcert.certificateFor('localhost');
  } else {
    ssl = {
      key: fs.readFileSync(process.cwd() + '/certs/privkey.pem'),
      cert: fs.readFileSync(process.cwd() + '/certs/fullchain.pem'),
    };
  }
  // const server = https.createServer(ssl, app);
  const server = http.createServer(app);

  // have our HTTPS server listen on HTTPS standard port (443)
  // const port = 443;
  // server.listen(port);
  // console.log(`Server listening on https://localhost:${port}`);
  const port = 3333;
  server.listen(port);
  console.log(`Server listening on https://localhost:${port}`);

  // set up our socket.io server using the HTTPS server (with permissive CORS)

  io.listen(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  setInterval(async () => {
    await getVideosFromMux();
    io.sockets.emit('availableVideos', availableVideos);
  }, 10000);
  // keep track of our clients for any admin purposes...
  const clients = {};

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    clients[socket.id] = { displayName: 'No Name Set' };
    io.sockets.emit('availablePlayers', clients);

    socket.on('disconnect', () => {
      console.log('disconnection');
      delete clients[socket.id];
      io.sockets.emit('availablePlayers', clients);
    });

    socket.on('getAvailableVideos', () => {
      socket.emit('availableVideos', availableVideos);
    });

    socket.on('getUploadUrl', async () => {
      socket.emit('uploadUrl', await getUploadUrlFromMux());
    });

    // socket.on('getAvailablePlayers', async () => {
    // const ids = await io.allSockets();
    // let idArray = Array.from(ids);
    // const data = {
    //   ids: idArray,
    // };
    // console.log('sending ', data);
    // socket.emit('availablePlayers', data);

    // });

    socket.on('cmd', (data) => {
      console.log(`Received command:${data.type}`);
      console.log(`Sending command: ${data.type} to all clients.`);
      io.sockets.emit('cmd', data);
    });

    socket.on('updateDisplayName', (data) => {
      console.log('got updated display name: ', data.displayName);
      clients[socket.id].displayName = data.displayName;
      io.sockets.emit('availablePlayers', clients);
    });
  });
}

main();
