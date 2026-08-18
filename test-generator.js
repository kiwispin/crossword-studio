// Test Crossword Generation Algorithm

function generateCrossword(wordList, options = {}) {
  const maxAttempts = options.maxAttempts || 80;
  let bestResult = null;

  // Clean words
  const cleanList = wordList
    .map(item => ({
      word: item.word.toUpperCase().replace(/[^A-Z]/g, ''),
      clue: item.clue || item.word,
      original: item.word
    }))
    .filter(item => item.word.length >= 2);

  if (cleanList.length === 0) return null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Shuffle slightly for variation, keeping longer words generally first
    const list = [...cleanList].sort((a, b) => {
      const lenDiff = b.word.length - a.word.length;
      if (lenDiff !== 0) return lenDiff + (Math.random() * 3 - 1.5);
      return Math.random() - 0.5;
    });

    const GRID_SIZE = 60;
    const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    const placed = [];

    // Place first word horizontally in center
    const first = list[0];
    const startX = Math.floor(GRID_SIZE / 2) - Math.floor(first.word.length / 2);
    const startY = Math.floor(GRID_SIZE / 2);
    const firstDir = Math.random() > 0.5 ? 'across' : 'down';

    if (firstDir === 'across') {
      for (let i = 0; i < first.word.length; i++) {
        grid[startY][startX + i] = { char: first.word[i], wordIndices: [0] };
      }
      placed.push({ ...first, x: startX, y: startY, dir: 'across', index: 0 });
    } else {
      for (let i = 0; i < first.word.length; i++) {
        grid[startY + i][startX] = { char: first.word[i], wordIndices: [0] };
      }
      placed.push({ ...first, x: startX, y: startY, dir: 'down', index: 0 });
    }

    // Try placing remaining words
    for (let w = 1; w < list.length; w++) {
      const current = list[w];
      const wordStr = current.word;
      const candidates = [];

      // Check against all placed words
      for (const p of placed) {
        const targetDir = p.dir === 'across' ? 'down' : 'across';

        for (let i = 0; i < wordStr.length; i++) {
          const char = wordStr[i];

          for (let j = 0; j < p.word.length; j++) {
            if (p.word[j] === char) {
              // Intersection found! Calculate candidate position
              let candX, candY;
              if (targetDir === 'down') {
                // p is across, candidate is down
                candX = p.x + j;
                candY = p.y - i;
              } else {
                // p is down, candidate is across
                candX = p.x - i;
                candY = p.y + j;
              }

              if (canPlaceWord(grid, wordStr, candX, candY, targetDir)) {
                const score = scorePlacement(grid, placed, wordStr, candX, candY, targetDir);
                candidates.push({ x: candX, y: candY, dir: targetDir, score });
              }
            }
          }
        }
      }

      if (candidates.length > 0) {
        // Sort by score descending
        candidates.sort((a, b) => b.score - a.score);
        const best = candidates[0];

        // Place word
        if (best.dir === 'across') {
          for (let i = 0; i < wordStr.length; i++) {
            if (!grid[best.y][best.x + i]) {
              grid[best.y][best.x + i] = { char: wordStr[i], wordIndices: [w] };
            } else {
              grid[best.y][best.x + i].wordIndices.push(w);
            }
          }
        } else {
          for (let i = 0; i < wordStr.length; i++) {
            if (!grid[best.y + i][best.x]) {
              grid[best.y + i][best.x] = { char: wordStr[i], wordIndices: [w] };
            } else {
              grid[best.y + i][best.x].wordIndices.push(w);
            }
          }
        }

        placed.push({ ...current, x: best.x, y: best.y, dir: best.dir, index: w });
      }
    }

    // Evaluate attempt
    if (placed.length > 0) {
      const bounds = getBounds(grid);
      const totalArea = (bounds.maxX - bounds.minX + 1) * (bounds.maxY - bounds.minY + 1);
      const placedRatio = placed.length / cleanList.length;
      // Fitness: placing more words is paramount, then compactness
      const fitness = (placed.length * 1000) - totalArea + (placedRatio * 5000);

      if (!bestResult || fitness > bestResult.fitness) {
        bestResult = { grid, placed, bounds, fitness, totalWords: cleanList.length };
      }
    }

    if (bestResult && bestResult.placed.length === cleanList.length && attempt > 30) {
      break;
    }
  }

  if (!bestResult) return null;

  return finalizeCrossword(bestResult, cleanList);
}

function canPlaceWord(grid, word, startX, startY, dir) {
  const len = word.length;
  const GRID_SIZE = grid.length;

  if (dir === 'across') {
    if (startX < 1 || startX + len >= GRID_SIZE - 1 || startY < 1 || startY >= GRID_SIZE - 1) return false;
    // Check cell before and after
    if (grid[startY][startX - 1] !== null || grid[startY][startX + len] !== null) return false;

    let intersections = 0;
    for (let i = 0; i < len; i++) {
      const x = startX + i;
      const y = startY;
      const cell = grid[y][x];

      if (cell !== null) {
        if (cell.char !== word[i]) return false; // Clash
        intersections++;
      } else {
        // Parallel adjacent checks: above and below must be empty
        if (grid[y - 1][x] !== null || grid[y + 1][x] !== null) return false;
      }
    }
    return intersections > 0;
  } else {
    // down
    if (startX < 1 || startX >= GRID_SIZE - 1 || startY < 1 || startY + len >= GRID_SIZE - 1) return false;
    // Check cell before and after
    if (grid[startY - 1][startX] !== null || grid[startY + len][startX] !== null) return false;

    let intersections = 0;
    for (let i = 0; i < len; i++) {
      const x = startX;
      const y = startY + i;
      const cell = grid[y][x];

      if (cell !== null) {
        if (cell.char !== word[i]) return false; // Clash
        intersections++;
      } else {
        // Parallel adjacent checks: left and right must be empty
        if (grid[y][x - 1] !== null || grid[y][x + 1] !== null) return false;
      }
    }
    return intersections > 0;
  }
}

function scorePlacement(grid, placed, word, startX, startY, dir) {
  let score = 0;
  let intersections = 0;
  const len = word.length;

  for (let i = 0; i < len; i++) {
    const x = dir === 'across' ? startX + i : startX;
    const y = dir === 'across' ? startY : startY + i;
    if (grid[y][x] !== null) {
      intersections++;
    }
  }

  score += intersections * 20;
  return score;
}

function getBounds(grid) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] !== null) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, maxX, minY, maxY };
}

function finalizeCrossword(result, originalList) {
  const { grid, placed, bounds } = result;
  const width = bounds.maxX - bounds.minX + 1;
  const height = bounds.maxY - bounds.minY + 1;

  const croppedGrid = Array(height).fill(null).map(() => Array(width).fill(null));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const origCell = grid[bounds.minY + y][bounds.minX + x];
      if (origCell) {
        croppedGrid[y][x] = {
          char: origCell.char,
          number: null,
          acrossNumber: null,
          downNumber: null
        };
      }
    }
  }

  const adjustedPlaced = placed.map(p => ({
    ...p,
    x: p.x - bounds.minX,
    y: p.y - bounds.minY
  }));

  let currentNum = 1;
  const acrossClues = [];
  const downClues = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = croppedGrid[y][x];
      if (!cell) continue;

      const acrossWord = adjustedPlaced.find(p => p.dir === 'across' && p.x === x && p.y === y);
      const downWord = adjustedPlaced.find(p => p.dir === 'down' && p.x === x && p.y === y);

      let numbered = false;
      if (acrossWord) {
        cell.number = currentNum;
        acrossWord.number = currentNum;
        acrossClues.push({
          number: currentNum,
          word: acrossWord.word,
          clue: acrossWord.clue,
          x: acrossWord.x,
          y: acrossWord.y,
          dir: 'across',
          length: acrossWord.word.length
        });
        numbered = true;
      }

      if (downWord) {
        if (!numbered) {
          cell.number = currentNum;
        }
        downWord.number = currentNum;
        downClues.push({
          number: currentNum,
          word: downWord.word,
          clue: downWord.clue,
          x: downWord.x,
          y: downWord.y,
          dir: 'down',
          length: downWord.word.length
        });
        numbered = true;
      }

      if (numbered) {
        currentNum++;
      }
    }
  }

  for (const clue of acrossClues) {
    for (let i = 0; i < clue.length; i++) {
      if (croppedGrid[clue.y][clue.x + i]) {
        croppedGrid[clue.y][clue.x + i].acrossNumber = clue.number;
      }
    }
  }
  for (const clue of downClues) {
    for (let i = 0; i < clue.length; i++) {
      if (croppedGrid[clue.y + i][clue.x]) {
        croppedGrid[clue.y + i][clue.x].downNumber = clue.number;
      }
    }
  }

  const unplaced = originalList.filter(item => !placed.some(p => p.word === item.word));

  return {
    grid: croppedGrid,
    width,
    height,
    placedWords: adjustedPlaced,
    acrossClues,
    downClues,
    unplaced
  };
}

// Test with animal words
const testWords = [
  { word: "ELEPHANT", clue: "Largest land mammal with a trunk" },
  { word: "LION", clue: "King of the jungle" },
  { word: "TIGER", clue: "Striped big cat" },
  { word: "GIRAFFE", clue: "Tallest mammal with a long neck" },
  { word: "ZEBRA", clue: "Black and white striped animal" },
  { word: "MONKEY", clue: "Playful animal that loves bananas" },
  { word: "PENGUIN", clue: "Flightless bird that waddles on ice" },
  { word: "KANGAROO", clue: "Australian animal with a pouch" },
  { word: "BEAR", clue: "Furry mammal that loves honey and hibernates" }
];

console.log("Generating crossword...");
const res = generateCrossword(testWords);
console.log(`Placed: ${res.placedWords.length} / ${testWords.length}`);
console.log(`Grid Size: ${res.width} x ${res.height}`);
console.log("Across Clues:", res.acrossClues.map(c => `${c.number}. ${c.word} (${c.clue})`));
console.log("Down Clues:", res.downClues.map(c => `${c.number}. ${c.word} (${c.clue})`));
if (res.unplaced.length > 0) {
  console.log("Unplaced:", res.unplaced.map(u => u.word));
}

for (let y = 0; y < res.height; y++) {
  let line = "";
  for (let x = 0; x < res.width; x++) {
    const c = res.grid[y][x];
    line += c ? `[${c.char}]` : " . ";
  }
  console.log(line);
}
