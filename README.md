# 🧩 Crossword Studio & Google Sheets Generator

A flexible, kid-friendly Crossword Generator and Interactive Solver.

You can use this in two ways:
1. **Interactive Web App (`index.html`)** *(Recommended)*: A self-contained, touch-friendly web application with auto-advancing letter typing, live hint system, celebratory confetti 🎉, print-ready classroom worksheets, and teacher answer keys.
2. **Google Sheets Companion (`GoogleSheetsCrossword.gs`)**: A ready-to-run Google Apps Script to generate square-grid crosswords and answer keys directly in your Google Drive spreadsheets.

---

## 🎮 Option 1: Interactive Web App (`index.html`)

### How to Run:
Simply double-click or open `index.html` in any web browser (Chrome, Safari, Firefox, Edge).
No installation, npm install, or internet connection required!

```bash
# On Mac:
open index.html
```

### Features:
- **Kids Solver Mode (Interactive Play)**:
  - 🔤 **Smart Typing**: Automatically advances to the next cell horizontally or vertically as you type.
  - 🔄 **Direction Toggle**: Switch between **Across** (➡️) and **Down** (⬇️) with `Space`, clicking the active cell, or the on-screen toggle.
  - 💡 **Hint & Reveal**: "Hint" button reveals tricky letters for kids who get stuck.
  - ✨ **Check Answers**: Checks letters and highlights correct answers in green or incorrect answers with a gentle shake.
  - ⚡ **Instant Check Mode**: Optional toggle for immediate letter-by-letter validation.
  - 🎉 **Victory Celebration**: Full confetti burst and celebration banner when solved!
  - 📱 **Mobile & Tablet Friendly**: Large touch targets, on-screen arrow controls for iPads and Chromebooks.
- **Teacher & Parent Generator Mode**:
  - Enter any **Title**, **Subtitle**, and list of `WORD: Clue`.
  - Preset library (Animals, Space, Fruits, Tech, Fantasy) for instant loading.
  - Generates compact, interlocking crossword grids automatically with reading-order clue numbers (1, 2, 3...).
  - 🎲 **Re-roll**: Easily try different layout variations.
- **Printable Classroom Worksheets**:
  - High-contrast black & white layout with student name, date, and score blanks.
  - Formatted for standard 8.5x11 and A4 printer pages.
  - 🔑 **Teacher Answer Key** toggle for instant grading sheets.
- **Share Link**:
  - Encodes the puzzle into the URL so teachers can share directly with students.

---

## 📊 Option 2: Google Sheets Generator (`GoogleSheetsCrossword.gs`)

If you want the crossword directly inside Google Sheets:

### Quick Setup (30 seconds):
1. Open a Google Sheet (e.g. at [sheets.new](https://sheets.new)).
2. In the top menu, go to **Extensions** > **Apps Script**.
3. Delete any placeholder code and paste the contents of [`GoogleSheetsCrossword.gs`](./GoogleSheetsCrossword.gs).
4. Click the **Save** disk icon (💾) or press `Ctrl+S` / `Cmd+S`.
5. Refresh your Google Sheet browser tab.
6. A new menu **🧩 Crossword Generator** will appear at the top!
7. Click **🧩 Crossword Generator** > **📝 Create Sample Words Sheet**, then click **⚡ Generate Crossword from Words Sheet**.

### What Google Sheets generates:
- **`Words` Sheet**: Enter your vocabulary words and clues here.
- **`Crossword Puzzle` Sheet**: Auto-formatted with square grid dimensions, bold black borders, and clue number notes. Includes automatic conditional formatting so entered letters turn green when correct!
- **`Answer Key` Sheet**: Complete solved puzzle reference for grading.

---

## 📁 File Structure

- [`index.html`](./index.html) - Complete standalone Interactive Web App.
- [`GoogleSheetsCrossword.gs`](./GoogleSheetsCrossword.gs) - Complete Google Apps Script code for Google Sheets.
- [`test-generator.js`](./test-generator.js) - Node.js algorithm verification test.
- [`README.md`](./README.md) - Documentation and setup guide.
