import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { ref, get, getDatabase, DataSnapshot, set, update, runTransaction, DatabaseReference, query, orderByValue, startAfter, enableLogging, onValue, serverTimestamp, child } from 'firebase/database';
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
import { Button, Divider, FormControl, FormControlLabel, FormGroup, FormHelperText, Grid, Input, InputLabel, ListSubheader, MenuItem, Select, Switch as SwitchButton, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { giveClue, initializeGameState, initializeRoom, startGame, startNewRound, writeStartGameData } from './createGame';
import { BrowserRouter, Route, useParams, Routes } from "react-router-dom";
import { getAuth, updateProfile, signInAnonymously, signInWithCredential, signOut, onAuthStateChanged, updateCurrentUser } from "firebase/auth";
import { useAuthState } from 'react-firebase-hooks/auth';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import StarIcon from '@mui/icons-material/Star';


/*
const firebaseConfig = {
  apiKey: "AIzaSyAyXLgcQ46iFKZW3jZdcV07w9EuBemi-yc",
  authDomain: "testproj-jeffdt.firebaseapp.com",
  databaseURL: "http://something1.fblocal.com:9000",
  projectId: "testproj-jeffdt",
  storageBucket: "testproj-jeffdt.appspot.com",
  messagingSenderId: "781325435126",
  appId: "1:781325435126:web:0f56aad3b2b3db8c0becd7"
};
*/
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
        <Route path="/getTest" element={<GetTest />} />
        <Route path="/timestampTest" element={<TimestampTest />} />
        <Route path="/:gameId" element={<GameView />} />
        <Route path="/" element={<GameView />} />
      </Routes>
    </BrowserRouter>
  );
}

const slots = [0, 1, 2, 3, 4];

function snapshotToRoomState(snap: DataSnapshot): RoomState {
  console.log(JSON.stringify(snap));
  var players: Map<string, PlayerInfo> = new Map();
  snap.child("players").forEach(child => {
    players.set(child.key!, child.val() as PlayerInfo);
  });
  const round_id: string = snap.child("round_id").val();
  const phase: Phase = snap.child("phase").val() as Phase;
  var gameState = undefined
  var spyMasters: Map<Team, string> = new Map();
  snap.child("spyMasters").forEach(child => {
    spyMasters.set(child.key! as Team, child.val());
  });
  var teamsLocked = false
  if (snap.child("teamsLocked").val() === true) {
    teamsLocked = true;
  }
  if (snap.child("gameState").val()) {
    const gs = snap.child("gameState");
    var grid: Map<string, WordInfo> = new Map();
    gs.child("grid").forEach(child => {
      grid.set(child.key!, child.val() as WordInfo);
    });
    var current_clue: Clue | undefined = undefined;
    if (gs.hasChild("current_clue")) {
      current_clue = gs.child("current_clue").val() as Clue;
    }
    gameState = {
      grid: grid,
      current_turn: gs.child("current_turn").val(),
      winner: gs.child("winner").val(),
      round_id: snap.child("round_id").val(),
      current_clue,
      players: players,
      history: [],
    };

  } else if (phase !== "lobby" && phase !== "playing") {
    throw new Error(`invalid phase: ${phase}`);
  }
  return {
    phase,
    round_id,
    players,
    spyMasters,
    gameState,
    teamsLocked
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

const TimestampTest = () => {
  async function run() {
    // firebase.database().useEmulator('localhost', 9000);
    enableLogging(true);

    const r = ref(database, 'timestampTest/');
    onValue(r, (s) => { console.log(`timestamp: ${JSON.stringify(s)}`) });
    const firstResult = await get(r);
    console.log(firstResult);
    await set(r, serverTimestamp());
    console.log("Did the set");
    const secondResult = await get(r);
    console.log(secondResult);


    // console.log('GET -> ', getSnapshot.val());
    // console.log('ONCE- >', onceSnapshot.val());
  }
  return (
    <div>
      <Button onClick={run}>Try it</Button>
    </div>
  );
}

const GetTest = () => {
  async function run() {
    // firebase.database().useEmulator('localhost', 9000);
    enableLogging(true);

    const r = ref(database, 'getTest/');
    await set(r, {
      'a': 1,
      'b': 2,
      'c': 3,
      'd': 4,
    });

    const q = query(r, orderByValue(), startAfter(2));
    const result = await get(q);
    onValue(q, (s) => { console.log(`Other: ${JSON.stringify(s)}`) });
    console.log(JSON.stringify(result));


    // console.log('GET -> ', getSnapshot.val());
    // console.log('ONCE- >', onceSnapshot.val());
  }
  return (
    <div>
      <Button onClick={run}>Try it</Button>
    </div>
  );
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

interface PlayerInfo {
  isOnline: boolean,
  displayName: string,
  team?: Team
  uid: string,
}

interface LobbyProps {
  players: Map<string, PlayerInfo>,
  spyMasters: Map<Team, string>;
  setTeam: (team: "red" | "blue") => void,
  makeSpyMaster: (team: Team, playerId: string) => void,
  startGame?: () => Promise<void>,
  teamsLocked: boolean;
  lockTeams: () => void;
  userInfo: UserInfo;
  teamsView: JSX.Element;
  gameRef: DatabaseReference;
}

interface TeamListProps {
  players: Map<string, PlayerInfo>;
  team: Team;
  spyMaster?: string;
  userInfo: UserInfo;
}

const TeamList = (p: TeamListProps) => {
  function isMe(player: PlayerInfo): boolean {
    return player.uid === p.userInfo.uid;
  }
  return (
    <List subheader={
      <ListSubheader>
        {`${p.team} team`}
      </ListSubheader>
    }>
      {
        Array.from(p.players.entries()).filter(([_, playerInfo]) => { return playerInfo.team === p.team; }).map(([key, playerInfo]) => {
          return (
            <ListItem key={playerInfo.uid} >
              {isMe(playerInfo) && (
                <ListItemIcon>
                  <StarIcon />
                </ListItemIcon>
              )}
              <ListItemText inset={!isMe(playerInfo)} primary={playerInfo.displayName} />
            </ListItem>);
        })
      }
    </List>
  );
}

interface TeamsViewProps {
  players: Map<string, PlayerInfo>,
  spyMasters: Map<Team, string>;
  userInfo: UserInfo;
}

const TeamsView = (p: TeamsViewProps) => {
  return (
    <div>
      <Grid container spacing={2} columns={40}>
        <Grid item key="red" xs={18}>
          <TeamList userInfo={p.userInfo} players={p.players} team="red" spyMaster={p.spyMasters.get("red")} />
        </Grid>
        <Grid item key="blue" xs={18}>
          <TeamList userInfo={p.userInfo} players={p.players} team="blue" spyMaster={p.spyMasters.get("blue")} />
        </Grid>

      </Grid>
    </div>
  );
}

const LobbyView = (p: LobbyProps) => {
  /**
   * There should be two lists of players.
   * The header should be the current spymaster.
   * 
   * Use a SelectedListItem to indicate the current spymaster.
   */
  console.log(p.spyMasters);
  const myId = p.userInfo.uid;
  var team: Team | undefined = undefined;
  if (p.players.get(p.userInfo.uid)) {
    team = p.players.get(p.userInfo.uid)?.team;
  }
  console.log(team);
  const canVolunteer = p.teamsLocked && team !== undefined && !p.spyMasters.get(team);
  const canBegin = team && p.spyMasters.get("red") && p.spyMasters.get("blue");
  const waitingForOtherTeam = team && p.spyMasters.get(team) && !canBegin;
  // if (p.spyMasters.get("red") && p.spyMasters.get("blue"))
  return (

    <div>
      {
        (team !== undefined && p.teamsLocked) ||
        <Select<string> labelId="initial-team-selector" onChange={(e) => { p.setTeam(e.target.value as Team); }} value={p.players.get(p.userInfo.uid)?.team}>
          <MenuItem value="red"> Red </MenuItem>
          <MenuItem value="blue"> Blue </MenuItem>
        </Select>
      }
      {
        canVolunteer && <div>
          {`Your team needs a spymaster!`} <Button onClick={() => {makeSpyMaster(p.gameRef, myId, team!);}}>Volunteer</Button>

        </div>
      }
      {
        // TODO: ensure both teams are nonempty.
        team && !p.teamsLocked &&
        <Button onClick={p.lockTeams}>
          Choose Spymasters
        </Button>
      }
      {
        waitingForOtherTeam && <div> Waiting for the other team to choose a spymaster...</div>
      }
      {canBegin &&
        <Button onClick={() => {startGame(p.gameRef);}}>
          Start Playing
        </Button>
      }

      {p.teamsView}
    </div>

  )
}

interface LoadedGameProps {
  gameId: string;
  userInfo: UserInfo;
  logOut: () => void;
  gameState: GameState;
  isConnected: boolean;
}

function setTeam(gameId: string, user: UserInfo, team: "red" | "blue") {

  set(ref(database, `games/${gameId}/players/${user.uid}/`), { uid: user.uid, displayName: user.displayName, team: team });
}

function lockTeams(gameRef: DatabaseReference): void {
  set(child(gameRef, "teamsLocked"), true);
}

function makeSpyMaster(gameRef: DatabaseReference, playerId: string, team: Team) {
  set(child(gameRef, `spyMasters/${team}`), playerId);

}

interface ClueProps {
  onClue: (word: string, number: number) => void;
}

const ClueForm = (props: ClueProps) => {
  const [word, setWord] = useState("");
  const [number, setNumber] = useState("");
  const onSubmit = () => {
    props.onClue(word, parseInt(number));
  }
  return (
    <div>
      Give your team a clue:
      <form onSubmit={onSubmit}>
        <FormControl sx={{ m: 1, minWidth: 120 }}>
          <TextField required placeholder="Clue Word" type="text" label="Clue" value={word} onChange={(e) => { setWord(e.target.value); }} />
          <FormHelperText>Enter the clue word.</FormHelperText>
        </FormControl>
        <FormControl sx={{ m: 1, minWidth: 120 }}>
          <TextField inputProps={{inputMode: 'numeric', pattern: '[0-9]*'}} required placeholder="Number" type="text" label="Number" value={number} onChange={(e) => { setNumber(e.target.value); }} />
          <FormHelperText>How many words should they guess?</FormHelperText>
        </FormControl>
        <Button onClick={onSubmit}>
          Give Clue
        </Button>


      </form>
    </div>
  );

}
/*
function ClueForm(p: ClueProps) {

  return (
    <div>
      Clue form
    </div>
  );
}
*/

const FullGameView = (props: GameProps) => {

  const gameId: string = props.gameId;
  const gameRef = ref(database, `games/${gameId}`);
  function createGame(): Promise<void> {
    return writeStartGameData(gameRef);
  }
  const [connectionState] = useObject(ref(database, ".info/connected"));
  const [snapshot, loading, error] = useObject(gameRef);

  useEffect(
    () => {
      if (loading || error) {
        return;
      }
      if (snapshot!.val() === null) {
        // createGame();
        initializeRoom(gameRef);
      } else if (snapshot!.child("phase").val() === "playing" && snapshot!.child("gameState").val() === null) {
      // If phase is playing and the gameState is missing, create the game state (grid).
        // create the game
        initializeGameState(gameRef);
      }
    },
    [snapshot]
  );
  if (error) {
    return <ErrorScreen />;
  } else if (loading || snapshot!.val() === null) {
    return <LoadingScreen />;
  }
  // If snapshot is in lobby state, go to lobby view.

  function makeSpyMaster(t: Team, uid: string): void {
    set(ref(database, `games/${gameId}/spyMasters/${t}`), uid);
  }

  // At this point, it must be a valid gamestate.
  const roomState: RoomState = snapshotToRoomState(snapshot!);
  const teamsView = (<TeamsView userInfo={props.userInfo} players={roomState.players} spyMasters={roomState.spyMasters} />);

  if (roomState.phase === "lobby" || !(roomState.players.get(props.userInfo.uid)?.team)) {
    return <LobbyView gameRef={gameRef} teamsLocked={roomState.teamsLocked} lockTeams={() => { lockTeams(gameRef); }} teamsView={teamsView} userInfo={props.userInfo} players={roomState.players} makeSpyMaster={makeSpyMaster} spyMasters={roomState.spyMasters} setTeam={(team) => { setTeam(gameId, props.userInfo, team); }} />
  } else if (!roomState.gameState!) {
    return <LoadingScreen/>;
  }
  const gameState: GameState = roomState.gameState!;
  const isConnected = connectionState && connectionState.val() === true ? true : false;

  const score = gameState ? computeWordsLeft(gameState!.grid) : null;
  // We set the spymaster for the current round, so it is reset if someone starts a new game.
  // const isSpyMaster: boolean = spyMasterRound !== null && gameState != null && spyMasterRound === gameState!.round_id;
  const isSpyMaster: boolean = Array.from(roomState.spyMasters.values()).includes(props.userInfo.uid);
  const isMyTurn: boolean = gameState.current_turn === roomState.players.get(props.userInfo.uid)?.team;
  const enableButtons: boolean = isMyTurn && gameState.current_clue !== undefined;
  const shouldGiveClue: boolean = isSpyMaster && isMyTurn && gameState.current_clue === undefined;

  const endTurn = () => {
    var nextTurn = "red";
    if (gameState!.current_turn === "red") {
      nextTurn = "blue";
    }
    set(ref(database, `games/${gameId}/current_turn`), nextTurn);
  }

  const onClick = (key: string) => {
    if (gameState) {
      const wordInfo = gameState.grid.get(key)!;
      if (wordInfo.isRevealed) {
        console.warn("Clicked a word that was already revealed");
        return;
      }
      var batch: { [k: string]: any } = {};
      if (wordInfo.color === "black") {
        console.log("Black card revealed!");
        var winner = "red";
        // The game is over!
        if (gameState.current_turn === "red") {
          winner = "blue";
        }
        batch['gameState/winner'] = winner;
      } else if (wordInfo.color === "red" && score!.redWordsLeft === 1) {
        batch['gameState/winner'] = "red";
      }
      if (wordInfo.color === "blue" && score!.blueWordsLeft === 1) {
        batch['gameState/winner'] = "blue";
      } else {

      var nextTurn = gameState.current_turn;
      if (wordInfo.color !== gameState.current_turn) {
        nextTurn = (nextTurn === "red") ? "blue" : "red";
      }
      batch["gameState/current_turn"] = nextTurn;
      }
      batch[`gameState/grid/${key}/isRevealed`] = true;
      update(gameRef, batch);
    }
  }


  return (
    <div>
      {error && <strong>Error: {error}</strong>}
      {loading && <span>List: Loading...</span> /* TODO: Add skeleton buttons while loading */}
      {
        !loading && snapshot && (
          <GridView disabled={!enableButtons} isSpyMaster={isSpyMaster} game={gameState!} onClick={onClick} />
        )
      }
      <Divider />
      {

/*
      <FormGroup>
        <FormControlLabel control={<SwitchButton checked={isSpyMaster} onChange={(e) => setSpyMasterHelper(e.target.checked)} />} label="Spymaster" />
      </FormGroup>
      */
      }

      <p>
        {gameState && gameState!.winner !== null && `The ${gameState!.winner} team won!`}
      </p>
      <p>
        {gameState && gameState!.winner === null && `It is the ${gameState!.current_turn} team's turn!`}
      </p >
      <p>
        {gameState.current_clue && `The current clue is "${gameState.current_clue!.word}" for ${gameState.current_clue!.number}`}
      </p>
      <p>
        {score !== null && scoreString(score!)}
      </p>
      {gameState && gameState!.winner === null && <BsButton disabled={!enableButtons} onClick={endTurn}>End Turn</BsButton>}
      {
        shouldGiveClue && <ClueForm onClue={(word: string, number: number) => {giveClue(gameRef, word, number);}} />
      }
      <div>
        <BsButton onClick={() => {startNewRound(gameRef);}}>
          Start New Round
        </BsButton>
      </div>
      {teamsView}
      <div>
        <p>Connection state: {JSON.stringify(connectionState)}</p>
      </div>
      {<div> <Button onClick={props.logOut}>Logout</Button></div>}
    </div >
  );
};

type Team = "red" | "blue";
type Phase = "lobby" | "playing";
interface RoomState {
  phase: Phase;
  round_id: string;
  players: Map<string, PlayerInfo>;
  spyMasters: Map<Team, string>;
  teamsLocked: boolean;
  gameState?: GameState // Defined if the phase is game.
}

interface Clue {
  word: string,
  number: number,
  guesses: string[],
}

interface RawRoomState {
  phase: "lobby" | "playing";
  round_id: string
  grid?: Map<string, WordInfo>;
  current_turn?: Team;
  winner?: Team;
  teamsLocked?: boolean;
  players?: Map<string, PlayerInfo>
}

interface GameState {
  grid: Map<string, WordInfo>
  current_turn: Team;
  winner: Team | null;
  round_id: string;
  players: Map<string, PlayerInfo>;
  current_clue?: Clue;
  history: Clue[];
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
  disabled: boolean;
}

const colorToVariant = {
  "blue": "primary",
  "red": "danger",
  "neutral": "warning",
  "black": "dark",
}

// TODO: Switch to using an MUI button, and make this fill width.
function WordView(props: WordProps) {
  var variant = "light";
  if (props.wordInfo.isRevealed) {
    variant = colorToVariant[props.wordInfo.color];
  } else if (props.isSpyMaster || props.gameOver) {
    // Use this to clarify which ones are revealed.
    variant = `outline-${colorToVariant[props.wordInfo.color]}`;
  }
  let isDisabled = props.wordInfo.isRevealed || props.gameOver || props.disabled;
  return <div className="d-grid gap-2">
    <BsButton variant={variant} color={props.wordInfo.color} disabled={isDisabled} onClick={props.onClick} >
      {props.wordInfo.word}
    </BsButton>
  </div>;
}

interface GridProps {
  isSpyMaster: boolean;
  game: GameState;
  disabled: boolean;
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
                const wordProps = {
                  wordInfo,
                  isSpyMaster: props.isSpyMaster,
                  gameOver: props.game.winner != null,
                  onClick: () => { props.onClick(key) },
                  disabled: props.disabled,
                }
                return (
                  <Grid item key={gridKey} xs={8}>

                      <WordView {...wordProps} />
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
