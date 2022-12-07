/* eslint-disable no-console */
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import MuxVideo from '@mux/mux-video-react';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';

let SERVER_URL = 'https://aidan.town';
if (process.env.NODE_ENV === 'development') {
  SERVER_URL = 'https://localhost:443';
}

// const
const socket = io(SERVER_URL);

const useCurrentPlaybackIdFromServer = () => {
  const [playbackId, setPlaybackId] = useState(
    'DS00Spx1CV902MCtPj5WknGlR102V5HFkDe'
  );

  const [isConnected, setIsConnected] = useState(socket.connected);

  const [displayName, setDisplayName] = useState(() => {
    const name = window.localStorage.getItem('displayName');
    if (name) return name;
    return '';
  });

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('cmd', (data) => {
      console.log(data);
      // TODO check for correct playerID
      if (data.playerId === 0 || data.playerId === socket.id) {
        setPlaybackId(data.videoId);
      }
    });

    socket.on('displayName', (data) => {
      setDisplayName(data.displayName);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('cmd');
    };
  }, []);

  useEffect(() => {
    console.log('display name updated! saving to local storage');
    window.localStorage.setItem('displayName', displayName);
    socket.emit('updateDisplayName', { displayName });
  }, [displayName]);

  useEffect(() => {
    console.log('Socket connected?', isConnected);
  }, [isConnected]);

  return { playbackId, displayName, setDisplayName };
};

const Hello = () => {
  const { playbackId, displayName, setDisplayName } =
    useCurrentPlaybackIdFromServer();

  useEffect(() => {
    console.log('Playback Id?', playbackId);
  }, [playbackId]);

  useEffect(() => {
    // TODO better way to update display name
    window.setDisplayName = setDisplayName;
  }, [setDisplayName]);

  useEffect(() => {
    console.log('DisplayName:', displayName);
  }, [displayName]);

  return (
    <div>
      <MuxVideo
        style={{ height: '100%', width: '100vw' }}
        playbackId={playbackId}
        streamType="on-demand"
        // controls
        autoPlay
        muted
        loop
      />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
