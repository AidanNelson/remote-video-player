/* eslint-disable jsx-a11y/media-has-caption */
/* eslint-disable react/self-closing-comp */
/* eslint-disable no-console */
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import MuxVideo from '@mux/mux-video-react';
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useMousetrap } from 'use-mousetrap';

let SERVER_URL = 'https://aidan.town';
if (process.env.NODE_ENV === 'development') {
  SERVER_URL = 'http://localhost:3333';
}

// const
const socket = io(SERVER_URL);

const useCurrentPlaybackIdFromServer = () => {
  const [playbackId, setPlaybackId] = useState('1.mp4');
  const [playbackType, setPlaybackType] = useState('LOCAL');

  const [isConnected, setIsConnected] = useState(socket.connected);

  const [displayName, setDisplayName] = useState(() => {
    const name = window.localStorage.getItem('displayName');
    if (name) return name;
    return 'media-player-0';
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
      if (data.playerIds.includes(0) || data.playerIds.includes(socket.id)) {
        setPlaybackId(data.videoId);
        setPlaybackType(data.playbackType ? data.playbackType : 'LOCAL'); // default to local file playback
      }
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

  return { playbackId, displayName, setDisplayName, playbackType };
};

const MediaPlayer = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [shouldShowInput, setShouldShowInput] = useState(false);
  const { playbackId, displayName, setDisplayName, playbackType } =
    useCurrentPlaybackIdFromServer();

  const videoRef = useRef<null | HTMLVideoElement>(null);

  useEffect(() => {
    // force reload on updated content
    if (!videoRef.current) return;
    try {
      videoRef.current.load();
    } catch (err) {
      console.error(err);
    }
  }, [playbackId]);

  useEffect(() => {
    console.log('Playback Id?', playbackId);
  }, [playbackId]);

  useEffect(() => {
    console.log('DisplayName:', displayName);
  }, [displayName]);

  useMousetrap('ctrl+j', () => {
    setShouldShowInput(true);
    setTimeout(() => {
      setShouldShowInput(false);
    }, 15000);
  });

  useMousetrap('ctrl+k', () => {
    setShouldShowInput(false);
  });

  return (
    <>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {playbackType === 'LOCAL' && (
          <video
            ref={videoRef}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            autoPlay
            muted
            loop
          >
            <source
              src={`http://localhost:3003/${playbackId}`}
              type="video/mp4"
            ></source>

            {/* Fallback Source */}
            <source
              src={`http://localhost:3003/1.mp4`}
              type="video/mp4"
            ></source>
          </video>
        )}
        {playbackType === 'MUX' && (
          <MuxVideo
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            playbackId={playbackId}
            streamType="on-demand"
            autoPlay
            muted
            loop
          />
        )}
      </div>
      {shouldShowInput && (
        <div
          style={{
            zIndex: 1000,
            backgroundColor: '#ffeebb',
            margin: '1em',
            padding: '2em',
            position: 'absolute',
            top: '50%',
            left: '50%',
          }}
        >
          <form>
            <div>
              <input
                ref={inputRef}
                placeholder={displayName}
                id="displayName"
                type="text"
                name="text"
              />
              <button
                type="button"
                onClick={() => {
                  if (inputRef.current) {
                    setDisplayName(inputRef.current.value);
                    setShouldShowInput(false);
                    console.log('submitting new name');
                  }
                }}
              >
                Update Name
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MediaPlayer />} />
      </Routes>
    </Router>
  );
}
