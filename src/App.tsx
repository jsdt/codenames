import React from 'react';
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
import Button from 'react-bootstrap/Button'
import { Divider, FormControlLabel, FormGroup, Grid, Switch } from '@mui/material';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

const firebaseConfig = {
  databaseURL: "https://testproj-jeffdt-default-rtdb.europe-west1.firebasedatabase.app"
};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

function App() {
  return (
    <div>
      <FullGameView />
    </div>
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
    winner: snap.child("winner").val()
  };

}

interface ScoreBoard {
  blueWordsLeft: number;
  redWordsLeft: number;
}
function computeWordsLeft(grid: Map<string, WordInfo>): ScoreBoard {
  var blueWordsLeft = 0;
  var redWordsLeft = 0;
  console.log(JSON.stringify(grid));
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

const FullGameView = () => {
  // TODO: Have a unique id for the round of the game, so we can store that we are spymaster for a round. Then if a new game is started, we can reset it.
  const [isSpyMaster, setSpyMaster] = useState(false);
  // const [snapshot, loading, error] = useObject(ref(database, 'games/test/grid'));
  const [snapshot, loading, error] = useObject(ref(database, 'games/test'));
  const gameState: GameState | null = snapshot ? snapshotToGameState(snapshot) : null;
  const score = gameState ? computeWordsLeft(gameState!.grid) : null;
  console.log(JSON.stringify(score));

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
          ref(database, `games/test/winner`),
          winner
        );
        return;
      }
      if (wordInfo.color === "red" && score!.redWordsLeft === 1) {
        set(
          ref(database, `games/test/winner`),
          "red"
        );
        return;
      }
      if (wordInfo.color === "blue" && score!.blueWordsLeft === 1) {
        set(
          ref(database, `games/test/winner`),
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
      batch[`grid/${key}/isRevealed`] = true;
      update(ref(database, `games/test`), batch);
    }
  }

  return (
    <div>
      {error && <strong>Error: {error}</strong>}
      {loading && <span>List: Loading...</span> /* TODO: Add skeleton buttons while loading */}
      {
        !loading && snapshot && (
          <GridView isSpyMaster={isSpyMaster} game={gameState!} onClick={onClick} />
        )
      }
      <Divider />
      <FormGroup>
        <FormControlLabel control={<Switch checked={isSpyMaster} onChange={(e) => setSpyMaster(e.target.checked)} />} label="Spymaster" />
      </FormGroup>

      {gameState && gameState!.winner !== null && `The ${gameState!.winner} team won!`}
      {gameState && gameState!.winner === null && `It is the ${gameState!.current_turn} team's turn!`}


    </div>
  );
};

interface GameState {
  grid: Map<string, WordInfo>
  current_turn: "red" | "blue";
  winner: "red" | "blue" | null;

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

function WordView(props: WordProps) {
  var variant = "light";
  if (props.isSpyMaster || props.wordInfo.isRevealed || props.gameOver) {
    variant = colorToVariant[props.wordInfo.color];
  }
  let isDisabled = props.wordInfo.isRevealed || props.gameOver;
  return <div>
    <Button variant={variant} disabled={isDisabled} onClick={props.onClick}>
      {props.wordInfo.word}
    </Button>
  </div>;
}

interface GridProps {
  isSpyMaster: boolean;
  game: GameState;
  onClick: (s: string) => any;
}

const GridView = (props: GridProps) => {

  return (
    <div>
      {
        (
          <Container fluid>

            {slots.map((r) => (
              <Row>
                {slots.map((c) => (
                  <Col>
                    <WordView wordInfo={props.game.grid.get(`${r * 5 + c}`)!} isSpyMaster={props.isSpyMaster} gameOver={props.game.winner != null} onClick={() => { props.onClick(`${r * 5 + c}`) }} />
                  </Col>
                ))}

              </Row>
            ))}
          </Container>
        )
      }


    </div>
  );
};

export default App;
