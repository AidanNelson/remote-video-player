/* eslint-disable jsx-a11y/alt-text */
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import * as UpChunk from '@mux/upchunk';
import { useFilePicker } from 'use-file-picker';

let SERVER_URL = 'https://aidan.town';

if (process.env.NODE_ENV === 'development') {
  console.log('using development server');
  SERVER_URL = 'http://localhost:3333';
}

const socket = io(SERVER_URL);

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  // const [availableVideos, setAvailableVideos] = useState([]);
  const [availableVideoPlaybackIds, setAvailableVideoPlaybackIds] = useState(
    []
  );
  const [activeSourceVideoID, setActiveSourceVideoID] = useState(
    'F02BZBmIAWp01Q3RTvRYR2gTKMl02rInzNNKR301KNlz8mA'
  );

  const fileUploadStatusRef = useRef();

  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [availablePlayerIds, setAvailablePlayerIds] = useState([]);
  const [activePlayerId, setActivePlayerId] = useState(0);

  const [uploadUrl, setUploadUrl] = useState(false);

  const [openFileSelector, { plainFiles, loading, errors }] = useFilePicker({
    readAs: 'DataURL',
    // accept: 'image/*',
    // multiple: true,
    limitFilesConfig: { max: 2 },
    // minFileSize: 1,
    readFilesContent: false,
    maxFileSize: 50000, // in megabytes
  });

  useEffect(() => {
    console.log('file content: ', plainFiles);
    if (plainFiles[0] && uploadUrl) {
      const upload = UpChunk.createUpload({
        // getUploadUrl is a function that resolves with the upload URL generated
        // on the server-side
        endpoint: uploadUrl,
        // picker here is a file picker HTML element
        file: plainFiles[0],
        chunkSize: 5120, // Uploads the file in ~5mb chunks
      });

      // subscribe to events
      upload.on('error', (err) => {
        console.error('💥 🙀', err.detail);
      });

      upload.on('progress', (progress) => {
        console.log('Uploaded', progress.detail, 'percent of this file.');
        fileUploadStatusRef.current.innerText = `Uploaded ${progress.detail} % of this file.`;
      });

      // subscribe to events
      upload.on('success', (err) => {
        console.log("Wrap it up, we're done here. 👋");
        fileUploadStatusRef.current.innerText = `Done! 🤩`;
      });
    }
  }, [plainFiles, uploadUrl]);

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('getAvailableVideos');
      socket.emit('getAvailablePlayers');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('availableVideos', (data) => {
      console.log('got available videos', data);
      // setAvailableVideos(data);
      let newIds = [];
      data.map((value, index) => {
        newIds.push(value.playback_ids[0].id);
      });
      setAvailableVideoPlaybackIds(newIds);
      console.log(newIds);
    });
    socket.on('availablePlayers', (data) => {
      console.log('got available players', data);
      let playerIds = Object.keys(data);
      console.log('player ids:', playerIds);
      setAvailablePlayerIds(playerIds);
      setAvailablePlayers(data);
    });

    socket.on('uploadUrl', (data) => {
      console.log('got mux upload url');
      setUploadUrl(data.url);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('availableVideos');
      socket.off('availablePlayers');
      socket.off('uploadUrl');
    };
  }, []);

  useEffect(() => {
    console.log('active video id: ', activeSourceVideoID);
  }, [activeSourceVideoID]);

  useEffect(() => {
    console.log('active player id: ', activePlayerId);
  }, [activePlayerId]);

  const sendCMD = () => {
    const data = {
      type: 'play',
      playerId: activePlayerId,
      videoId: activeSourceVideoID,
    };
    socket.emit('cmd', data);
  };

  const getUploadUrl = () => {
    socket.emit('getUploadUrl');
  };

  return (
    <div style={{ margin: '1em', padding: '1em' }}>
      <h3>Status</h3>
      <h4>
        {isConnected ? 'Connected to server.' : 'NOT connected to server.'}
      </h4>

      <hr />
      <h3>Upload Video</h3>
      <button
        style={{
          margin: '1em',
        }}
        onClick={() => {
          openFileSelector();
          getUploadUrl();
        }}
      >
        Upload File
      </button>
      <div ref={fileUploadStatusRef}></div>
      <hr />
      <h3>Choose Video Source: </h3>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {availableVideoPlaybackIds.map((id, index) => {
          return (
            <button
              key={id}
              style={{
                margin: '1em',
                padding: '0.2em',
                backgroundColor: 'black',
                border: `${
                  activeSourceVideoID === id ? '5px solid red' : '0px'
                }`,
              }}
              onClick={() => setActiveSourceVideoID(id)}
            >
              <img
                style={{
                  width: '210px',
                  height: '90px',
                  objectFit: 'cover',
                }}
                src={`https://image.mux.com/${id}/thumbnail.jpg?time=1`}
              />
            </button>
          );
        })}
      </div>

      <hr />

      <h3>Choose Target Player: </h3>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          style={{
            margin: '1em',
            border: `${activePlayerId === 0 ? '5px solid red' : ''}`,
            minWidth: '100px',
          }}
          key={0}
          onClick={() => setActivePlayerId(0)}
        >
          <p>All Available Players</p>
        </button>
        {availablePlayerIds.map((playerId, index) => {
          if (playerId === socket.id) return null;
          return (
            <button
              style={{
                margin: '1em',
                border: `${activePlayerId === playerId ? '5px solid red' : ''}`,
              }}
              key={playerId}
              onClick={() => setActivePlayerId(playerId)}
            >
              <p>{availablePlayers[playerId].displayName}</p>
            </button>
          );
        })}
      </div>

      <hr />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          style={{ margin: '1em', color: 'white', backgroundColor: 'red' }}
          onClick={sendCMD}
        >
          <h3>GO LIVE</h3>
        </button>
      </div>
    </div>
  );
}

export default App;
