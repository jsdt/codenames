import { app, database } from './firebaseConfig';
import { getDatabase, ref, set, onValue, child, get, update } from "firebase/database";

// Update current_turn in database
export function setCurrentTurn(gameId: string, currentTeam: string){
    const updates: any = {};
    updates[`games/${gameId}/current_turn`] = currentTeam;
    return update(ref(database), updates);
    // TODO: Add completion callback
}

// Reveal word at specific grid location
export function revealWord(gameId: string, gridIndex: string){
    const updates: any = {};
    updates[`games/${gameId}/grid/${gridIndex}/revealed`] = true;
    return update(ref(database), updates);
    // TODO: Add completion callback
}

// Set a winner for a game
export function setWinner(gameId: string, winnerTeam: string){
    const updates: any = {};
    updates[`games/${gameId}/winner`] = winnerTeam;
    return update(ref(database), updates);
    // TODO: Add completion callback
}