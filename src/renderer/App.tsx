import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import MuxVideo from '@mux/mux-video-react';
import {useState, useEffect} from "react";
import io from 'socket.io-client';

const SERVER_URL = "https://aidan.town";
const socket = io(SERVER_URL);

const Hello = () => {
  const currentPlaybackId = useCurrentPlaybackIdFromServer();
  return (
    <div>
      <MuxVideo
        style={{ height: '100%', maxWidth: '100%' }}
        playbackId={currentPlaybackId}
        // metadata={{
        //   video_id: 'video-id-123456',
        //   video_title: 'Super Interesting Video',
        //   viewer_user_id: 'user-id-bc-789',
        // }}
        streamType="on-demand"
        // controls
        autoPlay
        muted
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


const useCurrentPlaybackIdFromServer = () => {
  const [playbackId, setPlaybackId] = useState("DS00Spx1CV902MCtPj5WknGlR102V5HFkDe");

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastPong, setLastPong] = useState("");

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('pong', () => {
      setLastPong(new Date().toISOString());
    });

    socket.on('cmd', (data) => {
      console.log(data);
      // setPlaybackId(data.playbackId);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('setActiveVideo');
    };
  }, []);

  const sendPing = () => {
    socket.emit('ping');
  }

  return playbackId;
}