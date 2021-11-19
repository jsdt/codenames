import React from 'react';
import logo from './logo.svg';
import './App.css';
import { writeStartGameData } from './createGame';
import { generateRandomGameId } from './util';
import { getGameDataOnce } from './getters';
import {setCurrentTurn, revealWord, setWinner} from './setters';

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

        <button onClick={() => setCurrentTurn('d8wrk', 'red')}>
          Update RTDB Team to Red
        </button>

        <button onClick={() => setCurrentTurn('d8wrk', 'blue')}>
          Update RTDB Team to Blue
        </button>

        <button onClick={() => revealWord('d8wrk', '0')}>
          Reveal word at grid location (0)
        </button>

        <button onClick={() => setWinner('d8wrk', 'red')}>
          Set Winner to Red
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
