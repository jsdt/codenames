// Generate a random gameID. Note: Not guaranteed to be 7 chars long.
export function generateRandomGameId() {
  const res: string = (Math.random() + 1).toString(36).substring(7);
  return res;
}

// Generates random ints within range of function inputs, Min (inclusive) and Max (exclusive)
export function generateRandomIntInRange(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

// Shuffles array according to Fisher-Yates Shuffle
// Sidenote: Interesting read/visual: https://bost.ocks.org/mike/shuffle/)
export function generateShuffledPositionsArray() {
    let gameSlots = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]
    let currentIndex = gameSlots.length, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [gameSlots[currentIndex], gameSlots[randomIndex]] = [
            gameSlots[randomIndex], gameSlots[currentIndex]];
    }

    return gameSlots;
}

