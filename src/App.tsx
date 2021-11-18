import React from 'react';
import logo from './logo.svg';
import './App.css';
import { writeGameData } from './createGame';
import { generateRandomGameId } from './util';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>

        <button onClick={() => writeGameData(generateRandomGameId())}>
          Write to RTDB (Generate Game)
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
