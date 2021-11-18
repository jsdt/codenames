import React from 'react';
import logo from './logo.svg';
import './App.css';
import { ref, getDatabase, DataSnapshot, set } from 'firebase/database';
import { useList } from 'react-firebase-hooks/database';
import { initializeApp } from 'firebase/app';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import Button from 'react-bootstrap/Button'

const firebaseConfig = {
  databaseURL: "https://testproj-jeffdt-default-rtdb.europe-west1.firebasedatabase.app"
};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

function App() {
  return (
    <div>
      <GridView />
    </div>
  );
}

const slots = [0, 1, 2, 3, 4];

const GameView = () => {
  const [isSpyMaster, setSpyMaster] = useState(false);
  // Other top-level state?
  // Is the game over?
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

function onClickFunction(index: number) {
  set(
    ref(database, `games/test/grid/${index}/isRevealed`),
    true
  );

}

const GridView = () => {
  const [snapshots, loading, error] = useList(ref(database, 'games/test/grid'));

  return (
    <div className="box">
      {error && <strong>Error: {error}</strong>}
      {loading && <span>List: Loading...</span>}
      {!loading && snapshots && (
        <Container fluid>

          {slots.map((r) => (
            <Row>
              {slots.map((c) => (
                <Col>
                  <WordView wordInfo={snapshots[r * 5 + c].val() as WordInfo} isSpyMaster={false} gameOver={false} onClick={() => { onClickFunction(r * 5 + c) }} />
                </Col>
              ))}

            </Row>
          ))}

        </Container>
      )}
    </div>
  );
};

export default App;
