import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { TransitionGroup } from 'react-transition-group';

import { ref, get, getDatabase, DataSnapshot, set, update, runTransaction, DatabaseReference, query, orderByValue, startAfter, enableLogging, onValue, serverTimestamp, child } from 'firebase/database';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
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
import { Button, Collapse, Divider, FormControl, FormControlLabel, FormGroup, FormHelperText, Grid, Input, InputLabel, ListSubheader, MenuItem, Select, Switch as SwitchButton, TextField } from '@mui/material';
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
    /*
    if (gs.hasChild("current_clue")) {
      var guesses: string[] = [];
      gs.child("current_clue/guesses").forEach(child => {
        guesses.push()
      })
      current_clue = {
        word: gs.child("current_clue/word").val() as string,
        number: gs.child("current_clue/number").val() as number,
        guesses
      }
      current_clue = gs.child("current_clue").val() as Clue;
      gs.child("current_clue")
    }
    */
    if (gs.hasChild("current_clue")) {
      current_clue = gs.child("current_clue").val() as Clue;
      if (!current_clue.guesses) {
        current_clue.guesses = [];
      }
    }
    gameState = {
      grid: grid,
      current_turn: gs.child("current_turn").val(),
      winner: gs.child("winner").val(),
      round_id: snap.child("round_id").val(),
      current_clue,
      players: players,
      history: (gs.child("history").val() as Clue[]) || [],
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
  const filteredPlayers = Array.from(p.players.entries()).filter(([_, playerInfo]) => { return playerInfo.team === p.team; });
  return (

    <List style={{ maxHeight: '100%', overflow: 'auto' }} subheader={
      <ListSubheader>
        {`${p.team} team`}
      </ListSubheader>
    }>
      <TransitionGroup>

        {
          filteredPlayers.map(([key, playerInfo]) => {
            const typographyProps = isMe(playerInfo) ? {fontWeight: 'bold'} : {};
            const suffix = p.spyMaster === playerInfo.uid ? " (spymaster)" : "";
            return (
              <Collapse key={playerInfo.uid} >

                <ListItem key={playerInfo.uid} >
                  {/* if isMe(playerInfo), make it bold */}
                  <ListItemText primaryTypographyProps={typographyProps} primary={playerInfo.displayName + suffix} />
                </ListItem> </Collapse>);
          })
        }
      </TransitionGroup>
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
      <Box sx={{maxHeight: '25vh', display: "flex", flexDirection: 'row'}}>
          <Box border={2} borderColor={"error.main"} flexGrow={1}>
            <TeamList userInfo={p.userInfo} players={p.players} team="red" spyMaster={p.spyMasters.get("red")} />
          </Box>
          <Box border={2} borderColor={"primary.main"} flexGrow={1}>
            <TeamList userInfo={p.userInfo} players={p.players} team="blue" spyMaster={p.spyMasters.get("blue")} />
          </Box>
      </Box>
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
          {`Your team needs a spymaster!`} <Button onClick={() => { makeSpyMaster(p.gameRef, myId, team!); }}>Volunteer</Button>

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
        <Button onClick={() => { startGame(p.gameRef); }}>
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
          <TextField inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} required placeholder="Number" type="text" label="Number" value={number} onChange={(e) => { setNumber(e.target.value); }} />
          <FormHelperText>How many words should they guess?</FormHelperText>
        </FormControl>
        <Button onClick={onSubmit}>
          Give Clue
        </Button>


      </form>
    </div>
  );

}

interface HistoryProps {
  history: Clue[]
  current_clue?: Clue
}
const HistoryTimeline = (props: HistoryProps) => {
  // TODO: Add a header/key?
  const reversedClues = [...props.history];
  reversedClues.reverse();
  function keyFromIndex(index: number): number {
    return reversedClues.length - index ;
  }
  return (
    <React.Fragment>
      <Timeline position="left">
        <TimelineItem>

        <TimelineSeparator>

        <TimelineConnector/>
        </TimelineSeparator>
        <TimelineContent></TimelineContent>
        </TimelineItem>
        {
          reversedClues.map((clue, i) => {
            return (
              <TimelineItem key={keyFromIndex(i)}>
                <TimelineOppositeContent>
                  {clue.guesses && clue.guesses.join(', ')}
                </TimelineOppositeContent>
                <TimelineSeparator >
                  <TimelineDot color={teamToMUIVariant[clue.team] as ("primary" | "error")} />
                  {
                    i < reversedClues.length - 1 && <TimelineConnector />
                  }

                </TimelineSeparator>

                <TimelineContent>{`${clue.word} (${clue.number})`}</TimelineContent>
              </TimelineItem>
            );
          })
        }
      </Timeline>
    </React.Fragment>
  );

}

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
    return <LoadingScreen />;
  }
  const gameState: GameState = roomState.gameState!;
  const isConnected = connectionState && connectionState.val() === true ? true : false;

  const score = gameState ? computeWordsLeft(gameState!.grid) : null;
  // We set the spymaster for the current round, so it is reset if someone starts a new game.
  // const isSpyMaster: boolean = spyMasterRound !== null && gameState != null && spyMasterRound === gameState!.round_id;
  const isSpyMaster: boolean = Array.from(roomState.spyMasters.values()).includes(props.userInfo.uid);
  const isMyTurn: boolean = gameState.current_turn === roomState.players.get(props.userInfo.uid)?.team;
  const enableButtons: boolean = isMyTurn && gameState.current_clue !== undefined;
  const shouldGiveClue: boolean = isSpyMaster && isMyTurn && gameState.current_clue === undefined && !gameState.winner;

  const endTurn = () => {
    var batch: { [k: string]: any } = {};
    var nextTurn = "red";
    if (gameState!.current_turn === "red") {
      nextTurn = "blue";
    }
    batch["current_turn"] = nextTurn;
    batch[`history/${gameState.history.length}`] = gameState.current_clue!;
    batch["current_clue"] = null;
    update(child(gameRef, "gameState"), batch);
    // set(ref(database, `games/${gameId}/current_turn`), nextTurn);
  }

  const onClick = (key: string) => {
    if (gameState) {
      const wordInfo = gameState.grid.get(key)!;
      if (wordInfo.isRevealed) {
        console.warn("Clicked a word that was already revealed");
        return;
      }
      const newGuesses = [...gameState.current_clue!.guesses];
      newGuesses.push(wordInfo.word);
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
        if (wordInfo.color !== gameState.current_turn || gameState.current_clue!.number < newGuesses.length) {
          nextTurn = (nextTurn === "red") ? "blue" : "red";
          batch[`gameState/history/${gameState.history.length}`] = { team: gameState.current_turn, word: gameState.current_clue!.word, number: gameState.current_clue!.number, guesses: newGuesses };
          batch[`gameState/current_clue`] = null;
        } else {
          batch["gameState/current_clue/guesses"] = newGuesses;
        }
        batch["gameState/current_turn"] = nextTurn;
      }
      batch[`gameState/grid/${key}/isRevealed`] = true;
      update(gameRef, batch);
    }
  }

  function currentClueThing(): string {
    if (gameState.current_clue) {
      return `The current clue is "${gameState.current_clue!.word}" for ${gameState.current_clue!.number}. Up to ${gameState.current_clue!.number + 1 - gameState.current_clue!.guesses.length} guesses left.`;
    } else {
      const waitingFor = shouldGiveClue ? "you" : "other spymaster";
      return `Waiting for ${waitingFor} to give a clue...`;
    }
  }

  return (
    <div>
      {error && <strong>Error: {error}</strong>}
      {loading && <span>List: Loading...</span> /* TODO: Add skeleton buttons while loading */}
          <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', width: '100%'}}>
            <Box sx={{width: '30%'}} border={1}>
              {currentClueThing()}
            </Box>
          <Box  sx={{width: '30%', textAlign: 'center'}} border={1}>
            {gameState && gameState!.winner !== null && `The ${gameState!.winner} team won!` || `It is the ${gameState!.current_turn} team's turn!`}
          </Box>
          <Box  sx={{width: '30%', textAlign: 'right'}} border={1}>
            {score !== null && scoreString(score!)}
            </Box>
            </Box>
            {
            }
      <Divider />
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
      {gameState && gameState!.winner === null && <BsButton disabled={!enableButtons} onClick={endTurn}>End Turn</BsButton>}
      {
        shouldGiveClue && <ClueForm onClue={(word: string, number: number) => { giveClue(gameRef, word, number, gameState.current_turn); }} />
      }
      <HistoryTimeline history={gameState.history} />
      <div>
        <BsButton onClick={() => { startNewRound(gameRef); }}>
          Start New Round
        </BsButton>
      </div>
      <div>
        <Box sx={{height: '10%'}}>

      {teamsView}
      </Box>
      </div>
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
  team: Team,
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

const teamToMUIVariant = {
  "blue": "primary",
  "red": "error"
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
      <Box sx={{ m: 5 }}>

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
      </Box>


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
