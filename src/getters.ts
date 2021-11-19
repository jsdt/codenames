import { app, database } from './firebaseConfig';
import { getDatabase, ref, set, onValue, child, get } from "firebase/database";

// Get game data JSON for provided gameID
export function getGameData(gameId: string){
    const gameDataRef: any = ref(database, 'games/' + gameId);
    onValue(gameDataRef, (snapshot) => {
        const data = snapshot.val();
        // TODO: Add function & listener
    });
}

// Get game grid, to limit size of snapshots
export function getGameGrid(gameId: string){
    const gameGridRef: any = ref(database, 'games/' + gameId + '/grid');
    onValue(gameGridRef, (snapshot) => {
        const data = snapshot.val();
        // TODO: Add function & listener
    });
}

// Get current turn team, to limit size of snapshots
export function getCurrentTurn(gameId: string){
    const currentTurnRef: any = ref(database, 'games/' + gameId + '/current_turn');
    onValue(currentTurnRef, (snapshot) => {
        const data = snapshot.val();
        // TODO: Add function & listener
    });
}

// TODO: Delete
// Testing function, do not implement in UI
export function getGameDataOnce(gameId: string){
    get(child(ref(database), `games/${gameId}`)).then((snapshot) => {
        if (snapshot.exists()) {
            console.log(snapshot.val());
        } else {
            console.log(`GameId ${gameId} does not exist`);
        }
    }).catch((error) => {
        console.error(error);
    });
}