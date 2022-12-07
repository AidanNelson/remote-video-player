/* eslint-disable jsx-a11y/alt-text */
import React, { useState, useEffect } from 'react';
import { act } from 'react-dom/test-utils';
import io from 'socket.io-client';

let SERVER_URL = "https://localhost:443";

if (process.env.NODE_ENV === "production"){
  console.log('using production server');
  SERVER_URL = "https://aidan.town";
}
// const SERVER_URL = "https://aidan.town";
// const SERVER_URL = "https://localhost:443"
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
  useEffect(() => {
    console.log('active player id: ', activePlayerId);
  },[activePlayerId])

  const sendCMD = () => {
    const data = { type: "play", playerId: activePlayerId, videoId: activeSourceVideoID };
      socket.emit("cmd", data);
  }

  return (
    <div>
      <h1>Connected: { '' + isConnected }</h1>

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
      <button  style = {{margin: '2em', border: `${activePlayerId === 0? '10px solid red' : ''}`}} key={0} onClick={() => setActivePlayerId(0)} >
          <p>ALL</p>  
          </button>
          <button  style = {{margin: '2em', border: `${activePlayerId === -1? '10px solid red' : ''}`}} onClick={() => setActivePlayerId(-1)} >
          <p>NONE</p>  
          </button>
          
      {availablePlayerIds.map((playerId, index) => {
        if (playerId === socket.id) return null;
        return (
          <button  style = {{margin: '2em', border: `${activePlayerId === playerId? '10px solid red' : ''}`}} key={playerId} onClick={() => setActivePlayerId(playerId)} >
          <p>{playerId}</p>  
          </button>
        )
      })}
      
      <hr />
      <button onClick={ sendCMD }><h1>GO LIVE</h1></button>
    </div>
  );
}

export default App;


// function VideoSelectButton 