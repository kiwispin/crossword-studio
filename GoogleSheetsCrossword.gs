/**
 * 🧩 Google Sheets Crossword Generator & Solver
 * =========================================================================
 * Automatically generates formatted, square-grid crossword puzzles and
 * teacher answer keys directly inside Google Sheets from a list of words & clues!
 *
 * HOW TO SET UP (30 seconds):
 * 1. Open Google Sheets (e.g. at https://sheets.new)
 * 2. In the top menu, go to: Extensions > Apps Script
 * 3. Delete any default code and paste this entire file
 * 4. Click the Save icon (💾) or press Ctrl+S / Cmd+S
 * 5. Reload your Google Sheet tab
 * 6. You will see a new menu at top: "🧩 Crossword Generator"
 * 7. Click "🧩 Crossword Generator" > "📝 Create Sample Words Sheet"
 * 8. Click "🧩 Crossword Generator" > "⚡ Generate Crossword from Words Sheet"
 * =========================================================================
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧩 Crossword Generator')
    .addItem('⚡ Generate Crossword from "Words" Sheet', 'generateCrosswordInSheet')
    .addItem('📝 Create Sample Words Sheet', 'setupSampleWordsSheet')
    .addToUi();
}

/**
 * Creates a pre-populated 'Words' tab with sample vocabulary & clues.
 */
function setupSampleWordsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Words');
  if (!sheet) {
    sheet = ss.insertSheet('Words');
  }
  sheet.clear();

  sheet.getRange('A1:B1').setValues([['Word', 'Clue']])
    .setFontWeight('bold')
    .setBackground('#dbeafe')
    .setFontSize(11);

  const sampleData = [
    ['BONJOUR', 'French greeting meaning hello or good day'],
    ['HOLA', 'Friendly Spanish word for hello'],
    ['ALOHA', 'Hawaiian word for love, peace, and hello'],
    ['POLYGLOT', 'A person who can speak many different languages'],
    ['TRANSLATE', 'To change words from one language into another'],
    ['DIALECT', 'A regional variety of a language with unique words'],
    ['FLUENT', 'Able to speak or write a language smoothly and easily'],
    ['BRAILLE', 'Writing system of raised dots read with fingers'],
    ['ACCENT', 'Distinctive way words are pronounced by region'],
    ['IDIOM', 'A phrase with a figurative meaning like "piece of cake"']
  ];

  sheet.getRange(2, 1, sampleData.length, 2).setValues(sampleData);
  sheet.autoResizeColumns(1, 2);
  SpreadsheetApp.getUi().alert('✅ "Words" sheet ready! Now click "🧩 Crossword Generator" > "⚡ Generate Crossword" to build your puzzle!');
}

/**
 * Reads words/clues from the 'Words' sheet and generates both the Student Puzzle and Answer Key.
 */
function generateCrosswordInSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const wordSheet = ss.getSheetByName('Words');

  if (!wordSheet) {
    SpreadsheetApp.getUi().alert('❌ Could not find a "Words" sheet.\nPlease run "🧩 Crossword Generator" > "📝 Create Sample Words Sheet" first.');
    return;
  }

  const values = wordSheet.getDataRange().getValues();
  const words = [];

  for (let i = 1; i < values.length; i++) {
    const rawWord = String(values[i][0] || '').trim().toUpperCase().replace(/[^A-Z]/g, '');
    const rawClue = String(values[i][1] || rawWord).trim();
    if (rawWord.length >= 2) {
      words.push({ word: rawWord, clue: rawClue });
    }
  }

  if (words.length < 2) {
    SpreadsheetApp.getUi().alert('⚠️ Please provide at least 2 words (each with 2 or more letters) in the "Words" sheet.');
    return;
  }

  // Run layout algorithm
  const result = runCrosswordLayout(words);
  if (!result) {
    SpreadsheetApp.getUi().alert('❌ Could not find an interlocking arrangement for these words. Try adding a few more words with common letters (E, A, R, T, O, N).');
    return;
  }

  // Render both sheets
  renderPuzzleToSheet(ss, result, false); // Student Puzzle
  renderPuzzleToSheet(ss, result, true);  // Teacher Answer Key

  SpreadsheetApp.getUi().alert('🎉 Success! Created "Crossword Puzzle" and "Answer Key" sheets!');
}

/**
 * Formats a Google Sheet with square cells, black block borders, numbers, and conditional formatting.
 */
function renderPuzzleToSheet(ss, result, isAnswerKey) {
  const sheetName = isAnswerKey ? 'Answer Key' : 'Crossword Puzzle';
  let sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet(sheetName);
  }

  const { grid, width, height, acrossClues, downClues } = result;

  // Title Header
  sheet.getRange(1, 1).setValue(isAnswerKey ? '🧩 Crossword Puzzle (Answer Key)' : '🧩 Crossword Puzzle')
    .setFontSize(16)
    .setFontWeight('bold')
    .setFontColor('#0f172a');

  sheet.getRange(2, 1).setValue(isAnswerKey ? 'Teacher Reference Guide with Solutions' : 'Instructions: Type one letter per square to solve the puzzle!')
    .setFontStyle('italic')
    .setFontColor('#475569');

  const startRow = 4;
  const startCol = 1;

  // Resize columns and rows to create perfect squares
  for (let c = 1; c <= width; c++) {
    sheet.setColumnWidth(startCol + c - 1, 38);
  }
  for (let r = 1; r <= height; r++) {
    sheet.setRowHeight(startRow + r - 1, 38);
  }

  // Clear existing conditional rules
  sheet.clearConditionalFormatRules();
  const rules = [];

  // Render cells
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x];
      const targetRange = sheet.getRange(startRow + y, startCol + x);

      if (cell) {
        targetRange.setBackground('#ffffff')
          .setBorder(true, true, true, true, false, false, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM)
          .setHorizontalAlignment('center')
          .setVerticalAlignment('middle')
          .setFontSize(13)
          .setFontWeight('bold');

        if (cell.number) {
          const notes = [];
          if (cell.acrossNumber) notes.push(cell.number + ' Across');
          if (cell.downNumber) notes.push(cell.number + ' Down');
          targetRange.setNote(notes.join(' & '));
        }

        if (isAnswerKey) {
          targetRange.setValue(cell.char).setBackground('#dcfce7').setFontColor('#15803d');
        } else {
          // Add conditional formatting rule so when student enters correct letter, it turns green!
          const rule = SpreadsheetApp.newConditionalFormatRule()
            .whenTextEqualTo(cell.char)
            .setBackground('#dcfce7')
            .setFontColor('#15803d')
            .setRanges([targetRange])
            .build();
          rules.push(rule);
        }
      } else {
        // Black block
        targetRange.setBackground('#1e293b');
      }
    }
  }

  if (!isAnswerKey && rules.length > 0) {
    sheet.setConditionalFormatRules(rules);
  }

  // Render Across and Down Clues
  const clueStartRow = startRow + height + 2;

  sheet.getRange(clueStartRow, 1).setValue('➡️ ACROSS CLUES').setFontWeight('bold').setFontSize(12).setBackground('#e2e8f0');
  for (let i = 0; i < acrossClues.length; i++) {
    sheet.getRange(clueStartRow + 1 + i, 1).setValue(acrossClues[i].number + '. ' + acrossClues[i].clue);
  }

  const downStartCol = Math.max(width + 2, 7);
  sheet.setColumnWidth(downStartCol, 260);
  sheet.getRange(clueStartRow, downStartCol).setValue('⬇️ DOWN CLUES').setFontWeight('bold').setFontSize(12).setBackground('#e2e8f0');
  for (let i = 0; i < downClues.length; i++) {
    sheet.getRange(clueStartRow + 1 + i, downStartCol).setValue(downClues[i].number + '. ' + downClues[i].clue);
  }
}

/**
 * Backtracking heuristic crossword layout generator.
 */
function runCrosswordLayout(words) {
  let best = null;
  const maxAttempts = 60;

  for (let att = 0; att < maxAttempts; att++) {
    const list = [...words].sort(function(a, b) {
      const lenDiff = b.word.length - a.word.length;
      if (lenDiff !== 0) return lenDiff + (Math.random() * 2 - 1);
      return Math.random() - 0.5;
    });

    const SIZE = 45;
    const grid = [];
    for (let r = 0; r < SIZE; r++) {
      grid[r] = [];
      for (let c = 0; c < SIZE; c++) grid[r][c] = null;
    }
    const placed = [];

    // Seed first word
    const first = list[0];
    const sx = Math.floor(SIZE / 2) - Math.floor(first.word.length / 2);
    const sy = Math.floor(SIZE / 2);
    for (let i = 0; i < first.word.length; i++) {
      grid[sy][sx + i] = { char: first.word[i] };
    }
    placed.push({ word: first.word, clue: first.clue, x: sx, y: sy, dir: 'across' });

    // Place remaining
    for (let w = 1; w < list.length; w++) {
      const cur = list[w];
      let placedOk = false;

      for (let pIdx = 0; pIdx < placed.length && !placedOk; pIdx++) {
        const p = placed[pIdx];
        const targetDir = p.dir === 'across' ? 'down' : 'across';

        for (let i = 0; i < cur.word.length && !placedOk; i++) {
          for (let j = 0; j < p.word.length && !placedOk; j++) {
            if (cur.word[i] === p.word[j]) {
              const candX = targetDir === 'down' ? p.x + j : p.x - i;
              const candY = targetDir === 'down' ? p.y - i : p.y + j;

              if (canFit(grid, cur.word, candX, candY, targetDir, SIZE)) {
                for (let k = 0; k < cur.word.length; k++) {
                  const gx = targetDir === 'across' ? candX + k : candX;
                  const gy = targetDir === 'across' ? candY : candY + k;
                  grid[gy][gx] = { char: cur.word[k] };
                }
                placed.push({ word: cur.word, clue: cur.clue, x: candX, y: candY, dir: targetDir });
                placedOk = true;
              }
            }
          }
        }
      }
    }

    if (placed.length > 0) {
      if (!best || placed.length > best.placed.length) {
        best = { grid: grid, placed: placed, size: SIZE };
      }
    }
    if (best && best.placed.length === words.length) break;
  }

  if (!best) return null;
  return finalizeGasGrid(best);
}

function canFit(grid, word, startX, startY, dir, size) {
  const len = word.length;
  if (dir === 'across') {
    if (startX < 1 || startX + len >= size - 1 || startY < 1 || startY >= size - 1) return false;
    if (grid[startY][startX - 1] !== null || grid[startY][startX + len] !== null) return false;
    let cross = 0;
    for (let i = 0; i < len; i++) {
      const c = grid[startY][startX + i];
      if (c !== null) {
        if (c.char !== word[i]) return false;
        cross++;
      } else {
        if (grid[startY - 1][startX + i] !== null || grid[startY + 1][startX + i] !== null) return false;
      }
    }
    return cross > 0;
  } else {
    if (startX < 1 || startX >= size - 1 || startY < 1 || startY + len >= size - 1) return false;
    if (grid[startY - 1][startX] !== null || grid[startY + len][startX] !== null) return false;
    let cross = 0;
    for (let i = 0; i < len; i++) {
      const c = grid[startY + i][startX];
      if (c !== null) {
        if (c.char !== word[i]) return false;
        cross++;
      } else {
        if (grid[startY + i][startX - 1] !== null || grid[startY + i][startX + 1] !== null) return false;
      }
    }
    return cross > 0;
  }
}

function finalizeGasGrid(best) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const grid = best.grid;
  for (let y = 0; y < best.size; y++) {
    for (let x = 0; x < best.size; x++) {
      if (grid[y][x] !== null) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const cropped = [];
  for (let y = 0; y < height; y++) {
    cropped[y] = [];
    for (let x = 0; x < width; x++) {
      const c = grid[minY + y][minX + x];
      cropped[y][x] = c ? { char: c.char, number: null, acrossNumber: null, downNumber: null } : null;
    }
  }

  const adjPlaced = best.placed.map(function(p) {
    return { word: p.word, clue: p.clue, dir: p.dir, x: p.x - minX, y: p.y - minY };
  });

  let curNum = 1;
  const acrossClues = [];
  const downClues = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!cropped[y][x]) continue;
      const aw = adjPlaced.find(function(p) { return p.dir === 'across' && p.x === x && p.y === y; });
      const dw = adjPlaced.find(function(p) { return p.dir === 'down' && p.x === x && p.y === y; });
      let assigned = false;
      if (aw) {
        cropped[y][x].number = curNum;
        cropped[y][x].acrossNumber = curNum;
        acrossClues.push({ number: curNum, clue: aw.clue, word: aw.word });
        assigned = true;
      }
      if (dw) {
        if (!assigned) cropped[y][x].number = curNum;
        cropped[y][x].downNumber = curNum;
        downClues.push({ number: curNum, clue: dw.clue, word: dw.word });
        assigned = true;
      }
      if (assigned) curNum++;
    }
  }

  return { grid: cropped, width: width, height: height, acrossClues: acrossClues, downClues: downClues };
}
