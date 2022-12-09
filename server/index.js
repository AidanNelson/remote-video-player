/* eslint-disable no-plusplus */
/* eslint-disable prefer-template */
/* eslint-disable no-console */
const express = require('express');
// const https = require('https');
const http = require('http');
const io = require('socket.io')();

const Mux = require('@mux/mux-node');

// make it possible to read credentials from .env files
const dotenv = require('dotenv');

dotenv.config();
// assume process.env.MUX_TOKEN_ID and process.env.MUX_TOKEN_SECRET contain your credentials
const muxClient = new Mux(); // Success!

let availableVideos = [];

const localVideos = ['1.mp4', '2.mp4', '3.mp4', '4.mp4', '5.mp4'];

const useMux = false;

async function getVideosFromMux() {
  console.log('getting available videos from mux!');
  let newVids = [];
  // if (useMux) {
  const muxVids = await muxClient.Video.Assets.list();

  for (let i = 0; i < muxVids.length; i++) {
    newVids.push({
      type: 'MUX',
      id: muxVids[i].playback_ids[0].id,
    });
  }

  for (let i = 0; i < localVideos.length; i++) {
    newVids.push({
      type: 'LOCAL',
      id: localVideos[i],
    });
  }

  availableVideos = newVids;

  console.log(newVids);
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

  const server = http.createServer(app);
  const port = 3333;
  server.listen(port);
  console.log(`Server listening on https://localhost:${port}`);

  // set up our socket.io server using the HTTP server (with permissive CORS)
  io.listen(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  setInterval(async () => {
    await getVideosFromMux();
    io.sockets.emit('availableVideos', { availableVideos });
  }, 10000);
  getVideosFromMux();
  // keep track of our clients for any admin purposes...
  const clients = {};

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    clients[socket.id] = { displayName: 'No Name Set' };
    io.sockets.emit('availablePlayers', clients);
    socket.emit('availableVideos', { availableVideos });

    socket.on('disconnect', () => {
      console.log('disconnection');
      delete clients[socket.id];
      io.sockets.emit('availablePlayers', clients);
    });

    if (useMux) {
      socket.on('getUploadUrl', async () => {
        socket.emit('uploadUrl', await getUploadUrlFromMux());
      });
    }

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
