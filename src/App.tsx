import React from 'react';
import logo from './logo.svg';
import './App.css';
import { writeStartGameData } from './createGame';
import { generateRandomGameId } from './util';
import { getGameDataOnce } from './getters';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>

        <button onClick={() => writeStartGameData(generateRandomGameId())}>
          Write to RTDB (Generate Game)
        </button>

        <button onClick={() => getGameDataOnce('d8wrk')}>
          Read from RTDB Once (GameId hardcoded)
        </button>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
