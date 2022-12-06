/* eslint-disable jsx-a11y/alt-text */
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// const SERVER_URL = "https://aidan.town";
const SERVER_URL = "https://localhost:443"
const socket = io(SERVER_URL);

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  // const [availableVideos, setAvailableVideos] = useState([]);
  const [availableVideoPlaybackIds, setAvailableVideoPlaybackIds] = useState([]);
  const [activeSourceVideoID, setActiveSourceVideoID] = useState("F02BZBmIAWp01Q3RTvRYR2gTKMl02rInzNNKR301KNlz8mA");

  const [availablePlayerIds, setAvailablePlayerIds] = useState([]);
  const [activePlayerId, setActivePlayerId] = useState(0);

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
        newIds.push(value.playback_ids[0].id)
      });
      setAvailableVideoPlaybackIds(newIds);
      console.log(newIds);

    })
    socket.on('availablePlayers', (data) => {
      console.log('got available players', data);
      setAvailablePlayerIds(data.ids);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('pong');
    };
  }, []);

  useEffect(() => {
    console.log('active video id: ', activeSourceVideoID);
  },[activeSourceVideoID])

  const sendCMD = () => {
    const data = { type: "play", playerId: activePlayerId, videoId: activeSourceVideoID };
      socket.emit("cmd", data);
  }

  return (
    <div>
      <p>Connected: { '' + isConnected }</p>

      <hr />
      <h1>Choose Video Source: </h1>
      {availableVideoPlaybackIds.map((id, index) => {
        return (
        <button 
          key={id}
          style = {{margin: '2em', border: `${activeSourceVideoID === id? '10px solid red' : ''}`}}
          onClick={() => setActiveSourceVideoID(id)}>
             <img  style={{maxWidth: "300px", maxHeight: "200px"}} src={`https://image.mux.com/${id}/thumbnail.jpg?time=1`} />
        </button>
        );
      })}


      <h1>Choose Target Players: </h1>
      {availablePlayerIds.map((playerId, index) => {
        if (playerId === socket.id) return null;
        return (
          <button key={playerId}>
          <p>{playerId}</p>  
          </button>
        )
      })}
      <button>ALL</button>
      <hr />
      <button onClick={ sendCMD }><h1>GO LIVE</h1></button>
    </div>
  );
}

export default App;


// function VideoSelectButton 