import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { ref, getDatabase, DataSnapshot, set, update } from 'firebase/database';
import { useList, useObject, useObjectVal } from 'react-firebase-hooks/database';
import { initializeApp } from 'firebase/app';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import BsButton from 'react-bootstrap/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import LoginIcon from '@mui/icons-material/Login';
import { Button, Divider, FormControl, FormControlLabel, FormGroup, FormHelperText, Grid, Input, InputLabel, MenuItem, Select, Switch as SwitchButton, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { writeStartGameData } from './createGame';
import { BrowserRouter, Route, useParams, Routes } from "react-router-dom";
import { getAuth, updateProfile, signInAnonymously, signInWithCredential, signOut, onAuthStateChanged, updateCurrentUser } from "firebase/auth";
import { useAuthState } from 'react-firebase-hooks/auth';


const firebaseConfig = {
  apiKey: "AIzaSyAyXLgcQ46iFKZW3jZdcV07w9EuBemi-yc",
  authDomain: "testproj-jeffdt.firebaseapp.com",
  databaseURL: "https://testproj-jeffdt-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "testproj-jeffdt",
  storageBucket: "testproj-jeffdt.appspot.com",
  messagingSenderId: "781325435126",
  appId: "1:781325435126:web:0f56aad3b2b3db8c0becd7"
};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:gameId" element={<GameView />} />
        <Route path="/" element={<GameView />} />
      </Routes>
    </BrowserRouter>
  );
}

const slots = [0, 1, 2, 3, 4];

function snapshotToGameState(snap: DataSnapshot): GameState {
  var grid: Map<string, WordInfo> = new Map()
  snap.child("grid").forEach(child => {
    grid.set(child.key!, child.val() as WordInfo);
  });
  return {
    grid: grid,
    current_turn: snap.child("current_turn").val(),
    winner: snap.child("winner").val(),
    round_id: snap.child("round_id").val(),
  };

}

interface ScoreBoard {
  blueWordsLeft: number;
  redWordsLeft: number;
}

function scoreString(sb: ScoreBoard): string {
  return `Blue words remaining: ${sb.blueWordsLeft}; Red words remaining: ${sb.redWordsLeft}`;
}

function computeWordsLeft(grid: Map<string, WordInfo>): ScoreBoard {
  var blueWordsLeft = 0;
  var redWordsLeft = 0;
  grid.forEach((wordInfo) => {
    if (wordInfo.isRevealed) {
      return;
    }
    if (wordInfo.color === "red") {
      redWordsLeft += 1;
    }
    if (wordInfo.color === "blue") {
      blueWordsLeft += 1;
    }
  });
  return {
    blueWordsLeft,
    redWordsLeft
  }
}


interface UserInfo {
  displayName: string
  uid: string
}

const GameView = () => {
  const params = useParams();
  // const gameId: string = encodeURIComponent(params.gameId || "test");
  const gameId: string = btoa(params.gameId || "test");
  const [name, setName] = useLocalStorage<UserInfo | null>("userInfo", null);
  const [user, loading, error] = useAuthState(auth);
  // useAuthState isn't updated when we update the profile (to set the display name), so we use the hook to force a rerender.
  const [didLogin, setProfileUpdated] = useState<boolean>(false);
  async function logIn(name: string, team: string): Promise<void> {
    const creds = await signInAnonymously(auth);
    console.log(creds);
    await updateProfile(creds.user, { displayName: name });
    setProfileUpdated(true);
  }

  function logOut(): void {
    setName(null);
    signOut(auth);
    setProfileUpdated(false);
  }

  function userInfo(): UserInfo | null {
    // Note that we need to use auth.currentUser instead of user because it isn't updated when the profile changes.
    const cu = auth.currentUser
    if (cu! && cu.displayName) {
      return { displayName: cu!.displayName!, uid: cu!.uid };
    } else {
      return null;
    }
  }

  const fullyLoggedIn = auth.currentUser && auth.currentUser!.displayName
  if (error) {
    return <ErrorScreen />
  } else if (loading) {
    return <LoadingScreen />
  } else if (fullyLoggedIn) {
    console.log("I'm fully logged in");
    console.log(`User: ${JSON.stringify(user)}`);
    return (
      <div>
        <FullGameView gameId={gameId} userInfo={userInfo()!} logOut={logOut} />
      </div>
    );
  } else {
    console.log(`User: ${JSON.stringify(user)}`);
    console.log(name);
    return (<div> <LoginView onSubmit={logIn} /></div>);
  }
}

interface LoginProps {
  onSubmit(name: string, team: string): Promise<void>
}

const LoginView = (props: LoginProps) => {
  const [team, setTeam] = useState("Random");
  const [name, setName] = useState("");
  const [isLoggingIn, setLoggingIn] = useState(false);

  const onSubmit = () => {
    setLoggingIn(true);
    console.log("Going to log in!");
    props.onSubmit(name, team).finally(() => setLoggingIn(false));
    // console.log(`Submitted: ${name}`);
  }

  return (
    <div>
      <form onSubmit={onSubmit}>

        <FormControl sx={{ m: 1, minWidth: 120 }}>
          <TextField required placeholder="Your Name" type="search" label="Name" value={name} onChange={(e) => { console.log(e.target.value); setName(e.target.value); }} />
          <FormHelperText>Enter your name.</FormHelperText>
        </FormControl>
        <FormControl sx={{ m: 1, minWidth: 120 }}>

          <InputLabel id="initial-team-selector">Team</InputLabel>
          <Select<string> labelId="initial-team-selector" onChange={(e) => { setTeam(e.target.value); }} value={team}>
            <MenuItem value="Random"> <em>Random</em> </MenuItem>
            <MenuItem value="red"> Red </MenuItem>
            <MenuItem value="blue"> Blue </MenuItem>
          </Select>
          <FormHelperText>Choose a team (you can change this later).</FormHelperText>
        </FormControl>
        <LoadingButton endIcon={<LoginIcon />} onClick={onSubmit} variant="contained" disabled={!name} loading={isLoggingIn}>
          Login
        </LoadingButton>
        {
          /*
        <Button onClick={onSubmit} disabled={!name}>
          Play!
        </Button>
        */}
      </form>

    </div>
  );
}

interface GameProps {
  gameId: string
  userInfo: UserInfo
  logOut: () => void
}

const ErrorScreen = () => {
  return (
    <div>
      <p> Error! Maybe refresh? </p>
    </div>
  );
}
const LoadingScreen = () => {
  return (
    <div>
      <p> Loading... </p>
    </div>
  );
}

const Lobby = () => {
  //
}

const FullGameView = (props: GameProps) => {
  const gameId: string = props.gameId;
  const gameRef = ref(database, `games / ${gameId}`);
  function createGame(): Promise<void> {
    return writeStartGameData(gameRef);
  }
  const [snapshot, loading, error] = useObject(gameRef);
  const [spyMasterRound, setSpyMaster] = useState<string | null>(null);
  useEffect(
    () => {
      if (!loading && !error && snapshot!.val() === null) {
        createGame();
      }
    },
    [snapshot]
  );
  if (error) {
    return <ErrorScreen />;
  } else if (loading || snapshot!.val() === null) {
    return <LoadingScreen />;
  }
  const gameState: GameState | null = snapshot ? snapshotToGameState(snapshot) : null;

  const score = gameState ? computeWordsLeft(gameState!.grid) : null;
  // We set the spymaster for the current round, so it is reset if someone starts a new game.
  const isSpyMaster: boolean = spyMasterRound !== null && gameState != null && spyMasterRound === gameState!.round_id;
  const setSpyMasterHelper = (b: boolean) => {
    if (b) {
      setSpyMaster(gameState!.round_id);
    } else {
      setSpyMaster(null);
    }
  }

  const endTurn = () => {
    var nextTurn = "red";
    if (gameState!.current_turn === "red") {
      nextTurn = "blue";
    }
    set(ref(database, `games / ${gameId} / current_turn`), nextTurn);
  }

  const onClick = (key: string) => {
    if (gameState) {
      const wordInfo = gameState.grid.get(key)!;
      if (wordInfo.isRevealed) {
        console.warn("Clicked a word that was already revealed");
        return;
      }
      if (wordInfo.color === "black") {
        console.log("Black card revealed!");
        var winner = "red";
        // The game is over!
        if (gameState.current_turn === "red") {
          winner = "blue";
        }
        set(
          ref(database, `games / ${gameId} / winner`),
          winner
        );
        return;
      }
      if (wordInfo.color === "red" && score!.redWordsLeft === 1) {
        set(
          ref(database, `games / ${gameId} / winner`),
          "red"
        );
        return;
      }
      if (wordInfo.color === "blue" && score!.blueWordsLeft === 1) {
        set(
          ref(database, `games / ${gameId} / winner`),
          "blue"
        );
        return;
      }
      var nextTurn = gameState.current_turn;
      if (wordInfo.color !== gameState.current_turn) {
        nextTurn = (nextTurn === "red") ? "blue" : "red";
      }
      var batch: { [k: string]: any } = {};
      batch["current_turn"] = nextTurn;
      batch[`grid / ${key} / isRevealed`] = true;
      update(gameRef, batch);
    }
  }

  return (
    <div>
      {<div><p>Hello {props.userInfo.displayName}</p> <Button onClick={props.logOut}>Logout</Button></div>}
      {error && <strong>Error: {error}</strong>}
      {loading && <span>List: Loading...</span> /* TODO: Add skeleton buttons while loading */}
      {
        !loading && snapshot && (
          <GridView isSpyMaster={isSpyMaster} game={gameState!} onClick={onClick} />
        )
      }
      <Divider />
      <FormGroup>
        <FormControlLabel control={<SwitchButton checked={isSpyMaster} onChange={(e) => setSpyMasterHelper(e.target.checked)} />} label="Spymaster" />
      </FormGroup>

      <p>
        {gameState && gameState!.winner !== null && `The ${gameState!.winner} team won!`}
      </p>
      <p>
        {gameState && gameState!.winner === null && `It is the ${gameState!.current_turn} team's turn!`}
      </p >
      <p>
        {score !== null && scoreString(score!)}
      </p>
      {gameState && gameState!.winner === null && <BsButton onClick={endTurn}>End Turn</BsButton>}
      <div>
        <BsButton onClick={createGame}>
          Start New Game
        </BsButton>
      </div>
    </div >
  );
};

interface GameState {
  grid: Map<string, WordInfo>
  current_turn: "red" | "blue";
  winner: "red" | "blue" | null;
  round_id: string;

}

// This is the DB state for a word.
interface WordInfo {
  word: string;
  isRevealed: boolean;
  color: "red" | "blue" | "black" | "neutral";
}

interface WordProps {
  wordInfo: WordInfo;
  onClick: () => any;
  isSpyMaster: boolean;
  gameOver: boolean;
}

const colorToVariant = {
  "blue": "primary",
  "red": "danger",
  "neutral": "warning",
  "black": "dark",
}

// TODO: Switch to using an MUI button.
function WordView(props: WordProps) {
  var variant = "light";
  if (props.isSpyMaster || props.wordInfo.isRevealed || props.gameOver) {
    variant = colorToVariant[props.wordInfo.color];
  }
  let isDisabled = props.wordInfo.isRevealed || props.gameOver;
  return <div>
    <BsButton variant={variant} disabled={isDisabled} onClick={props.onClick} >
      {props.wordInfo.word}
    </BsButton>
  </div>;
}

interface GridProps {
  isSpyMaster: boolean;
  game: GameState;
  onClick: (s: string) => any;
}

const boxStyle = {
  alignItems: "center",
  justifyContent: "center",
  display: "flex"
};

const GridView = (props: GridProps) => {

  return (
    <div>
      {
        (
          <Grid container spacing={2} columns={40}>
            {

              Array.from(props.game.grid).map(([key, wordInfo]) => {
                const gridKey = `${props.game.round_id}/${key}`;
                return (
                  <Grid item key={gridKey} xs={8}>
                    <div style={boxStyle}>

                      <WordView wordInfo={wordInfo} isSpyMaster={props.isSpyMaster} gameOver={props.game.winner != null} onClick={() => { props.onClick(key) }} />
                    </div>
                  </Grid>
                );

              })
            }
          </Grid>
        )
      }


    </div>
  );
};


// Hook
function useLocalStorage<T>(key: string, initialValue: T): [T, (v: T) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });
  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: any) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };
  return [storedValue, setValue];
}


export default App;
