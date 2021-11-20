import { DatabaseReference, set } from "firebase/database";
import { generateRandomIntInRange, generateShuffledPositionsArray } from './util';
import { wordList } from './wordList';
import { ToastBody } from 'react-bootstrap';

// Generate new board game and write initial state to RTDB
export function writeStartGameData(gameRef: DatabaseReference) {
  const gameData: any = generateGameData();

  set(gameRef, gameData);
  console.log("Successfully initialized new game with id " + gameRef.key!);

}

// Generate initial game state JSON
function generateGameData() {
  const gameDictionary: string[] = generateGameDictionary();
  const firstTeam = (Math.random() > 0.5) ? "red" : "blue";
  const gameGrid = generateGameGrid(gameDictionary, firstTeam);

  let json_data = {
    "game_options": {
      "time_per_round_seconds": 180,
      "dictionary": gameDictionary
    },
    "grid": gameGrid,
    "current_turn": firstTeam,
    "winner": null,
    "turn_end_timer": 0,
    "round_id": `${Math.random()}`,
    "clue": {
      "word": null,
      "number": null
    }
  };

  return json_data
}

// Generate the 25 words that will be used for the current game
function generateGameDictionary(): string[] {
  let gameDictionary: string[] = new Array()
  let wordListIndex: number = 0
  let wordAtIndex: string = ""

  while (gameDictionary.length < 25) {
    wordListIndex = generateRandomIntInRange(0, wordList.length);
    wordAtIndex = wordList[wordListIndex];

    if (gameDictionary.indexOf(wordAtIndex) === -1) {
      gameDictionary.push(wordAtIndex);
    }
  }

  return gameDictionary;
}

// Generate grid using current game dictionary
// Red assumed to start game with 9, blue goes second with 8
function generateGameGrid(gameDictionary: string[], firstTeam: "red" | "blue") {
  let gameGridUnshuffled: any = []

  gameGridUnshuffled.push({
    "word": gameDictionary[0],
    "color": firstTeam,
    "isRevealed": false
  });
  // Push 9 red cards to grid
  for (let i = 1; i < 9; i++) {
    gameGridUnshuffled.push({
      "word": gameDictionary[i],
      "color": "red",
      "isRevealed": false
    });
  };

  // Push 8 blue cards to grid
  for (let i = 9; i < 17; i++) {
    gameGridUnshuffled.push({
      "word": gameDictionary[i],
      "color": "blue",
      "isRevealed": false
    });
  };

  // Push 7 neutral cards to grid
  for (let i = 17; i < 24; i++) {
    gameGridUnshuffled.push({
      "word": gameDictionary[i],
      "color": "neutral",
      "isRevealed": false
    });
  };

  // Push 1 black card to grid
  gameGridUnshuffled.push({
    "word": gameDictionary[24],
    "color": "black",
    "isRevealed": false
  });

  // Below shuffles the cards in the grid to make them distributed
  let gameSlots: number[] = generateShuffledPositionsArray();
  let gameGridShuffled: { [key: string]: any } = {};

  for (let i = 0; i < 25; i++) {
    gameGridShuffled[i.toString()] = gameGridUnshuffled[gameSlots[i]];
  }

  return gameGridShuffled;
}
