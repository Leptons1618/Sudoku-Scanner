// sudokuSolver.js - Sudoku solving algorithm

// Check if a number can be placed in a specific position
const isValidPlacement = (grid, row, col, num) => {
  // Check row
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num) {
      return false;
    }
  }
  
  // Check column
  for (let i = 0; i < 9; i++) {
    if (grid[i][col] === num) {
      return false;
    }
  }
  
  // Check 3x3 box
  const boxRowStart = Math.floor(row / 3) * 3;
  const boxColStart = Math.floor(col / 3) * 3;
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[boxRowStart + i][boxColStart + j] === num) {
        return false;
      }
    }
  }
  
  return true;
};

// Find an empty cell (represented by 0)
const findEmptyCell = (grid) => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        return [row, col];
      }
    }
  }
  return null; // No empty cells found
};

// Solve the Sudoku puzzle using backtracking
const solveSudoku = (grid) => {
  // Create a deep copy of the input grid to avoid modifying the original
  const workingGrid = JSON.parse(JSON.stringify(grid));
  
  // Use backtracking to solve the puzzle
  if (solveBacktrack(workingGrid)) {
    return workingGrid;
  }
  
  // If the puzzle cannot be solved
  return null;
};

// Helper function for backtracking algorithm
const solveBacktrack = (grid) => {
  const emptyCell = findEmptyCell(grid);
  
  // If no empty cell is found, the puzzle is solved
  if (!emptyCell) {
    return true;
  }
  
  const [row, col] = emptyCell;
  
  // Try placing digits 1-9
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(grid, row, col, num)) {
      // Place the number
      grid[row][col] = num;
      
      // Recursively try to solve the rest of the puzzle
      if (solveBacktrack(grid)) {
        return true;
      }
      
      // If placing the number doesn't lead to a solution, backtrack
      grid[row][col] = 0;
    }
  }
  
  // No valid number found for this cell
  return false;
};

// Validate if a Sudoku solution is correct
const validateSudoku = (grid) => {
  // Check if all cells are filled
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        return false; // Incomplete solution
      }
    }
  }
  
  // Check rows
  for (let row = 0; row < 9; row++) {
    const rowSet = new Set();
    for (let col = 0; col < 9; col++) {
      const num = grid[row][col];
      if (rowSet.has(num)) {
        return false; // Duplicate in row
      }
      rowSet.add(num);
    }
  }
  
  // Check columns
  for (let col = 0; col < 9; col++) {
    const colSet = new Set();
    for (let row = 0; row < 9; row++) {
      const num = grid[row][col];
      if (colSet.has(num)) {
        return false; // Duplicate in column
      }
      colSet.add(num);
    }
  }
  
  // Check 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const boxSet = new Set();
      for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
        for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
          const num = grid[row][col];
          if (boxSet.has(num)) {
            return false; // Duplicate in box
          }
          boxSet.add(num);
        }
      }
    }
  }
  
  return true; // Solution is valid
};

// Export the Sudoku solver and validator
export { solveSudoku, validateSudoku };