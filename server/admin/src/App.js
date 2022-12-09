/* eslint-disable jsx-a11y/alt-text */
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import * as UpChunk from '@mux/upchunk';
import { useFilePicker } from 'use-file-picker';

let SERVER_URL = 'https://aidan.town';

const useMux = false;

if (process.env.NODE_ENV === 'development') {
  console.log('using development server');
  SERVER_URL = 'http://localhost:3333';
}

const socket = io(SERVER_URL);

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [availableVideoPlaybackIds, setAvailableVideoPlaybackIds] = useState(
    []
  );
  const [availableVideos, setAvailableVideos] = useState([]);
  const [activeSourceVideoID, setActiveSourceVideoID] = useState(
    'F02BZBmIAWp01Q3RTvRYR2gTKMl02rInzNNKR301KNlz8mA'
  );
  const [activeVideoSource, setActiveVideoSource] = useState(null);

  const fileUploadStatusRef = useRef();

  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [availablePlayerIds, setAvailablePlayerIds] = useState([]);
  const [activePlayerId, setActivePlayerId] = useState(0);
  const [activePlayerIds, setActivePlayerIds] = useState([]);

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
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('availableVideos', (data) => {
      console.log('got available videos', data);
      setAvailableVideos(data.availableVideos);
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
    if (!activeVideoSource) return;
    const data = {
      type: 'play',
      playerIds: activePlayerIds,
      videoId: activeVideoSource.id,
      playbackType: activeVideoSource.type,
    };
    socket.emit('cmd', data);
  };

  const getUploadUrl = () => {
    socket.emit('getUploadUrl');
  };

  // const addToActivePlayers = (id) => {
  //   setActivePlayerIds((curr) => {
  //     if (curr.includes(id)) return;
  //     curr.push(id);
  //   });
  // };
  // const removeFromActivePlayers = (id) => {
  //   setActivePlayerIds((curr) => {
  //     const foundIndex = curr.indexOf(id);
  //     if (foundIndex > 0) {
  //       curr.splice(foundIndex, 1);
  //     }
  //   });
  // };

  // https://wweb.dev/blog/how-to-toggle-an-array-item-in-react-state/
  const toggleActivePlayerMembership = (id) => {
    setActivePlayerIds((curr) => {
      const arr = curr.includes(id)
        ? curr.filter((i) => i !== id) // remove item
        : [...curr, id]; // add item
      return arr;
    });
  };

  return (
    <div style={{ margin: '1em', padding: '1em' }}>
      <h3>Status</h3>
      <h4>
        {isConnected ? 'Connected to server.' : 'NOT connected to server.'}
      </h4>

      <hr />

      <h3>Upload Video to streaming server:</h3>
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
      <div style={{ textAlign: 'center' }}>
        <h3>LOCAL VIDEOS</h3>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {availableVideos.map((videoInfo, index) => {
          if (!(videoInfo.type === 'LOCAL')) return null;
          return (
            <button
              key={videoInfo.id}
              style={{
                margin: '1em',
                padding: '0.2em',
                backgroundColor: 'black',
                border: `${
                  activeVideoSource?.id === videoInfo.id
                    ? '5px solid red'
                    : '0px'
                }`,
              }}
              onClick={() => setActiveVideoSource(videoInfo)}
            >
              <h3
                style={{
                  color: 'white',
                  paddingLeft: '1em',
                  paddingRight: '1em',
                }}
              >
                {videoInfo.id}
              </h3>
            </button>
          );
        })}
      </div>
      <div style={{ textAlign: 'center' }}>
        <h3>STREAMING VIDEOS (max 1080p resolution):</h3>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {availableVideos.map((videoInfo, index) => {
          if (!(videoInfo.type === 'MUX')) return null;
          return (
            <button
              key={videoInfo.id}
              style={{
                margin: '1em',
                padding: '0.2em',
                backgroundColor: 'black',
                border: `${
                  activeVideoSource?.id === videoInfo.id
                    ? '5px solid red'
                    : '0px'
                }`,
              }}
              onClick={() => setActiveVideoSource(videoInfo)}
            >
              <img
                style={{
                  width: '210px',
                  height: '90px',
                  objectFit: 'cover',
                }}
                src={`https://image.mux.com/${videoInfo.id}/thumbnail.jpg?time=1`}
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
            border: `5px solid blue`,
            minWidth: '100px',
          }}
          key={'clear'}
          onClick={() => {
            setActivePlayerIds([]);
          }}
        >
          <p>Clear Selected</p>
        </button>
        <button
          style={{
            margin: '1em',
            border: `${activePlayerIds.includes(0) ? '5px solid red' : ''}`,
            minWidth: '100px',
          }}
          key={0}
          onClick={() => {
            // setActivePlayerId(0);
            toggleActivePlayerMembership(0);
          }}
        >
          <p>All Available Players</p>
        </button>
        {availablePlayerIds.map((playerId, index) => {
          if (playerId === socket.id) return null;
          return (
            <button
              style={{
                margin: '1em',
                border: `${
                  activePlayerIds.includes(playerId) ? '5px solid red' : ''
                }`,
              }}
              key={playerId}
              onClick={() => {
                // setActivePlayerId(0);
                toggleActivePlayerMembership(playerId);
              }}
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
