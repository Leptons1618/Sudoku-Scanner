import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SudokuGrid = ({ grid }) => {
  if (!grid || !Array.isArray(grid) || grid.length !== 9) {
    return <Text>Invalid grid data</Text>;
  }

  return (
    <View style={styles.sudokuContainer}>
      {grid.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.sudokuRow}>
          {row.map((cell, colIndex) => (
            <View 
              key={`cell-${rowIndex}-${colIndex}`}
              style={[
                styles.sudokuCell,
                (rowIndex % 3 === 2 && rowIndex < 8) && styles.bottomBorder,
                (colIndex % 3 === 2 && colIndex < 8) && styles.rightBorder
              ]}
            >
              <Text style={styles.sudokuDigit}>
                {cell !== 0 ? cell : ''}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  sudokuContainer: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#000',
  },
  sudokuRow: {
    flex: 1,
    flexDirection: 'row',
  },
  sudokuCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBorder: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  rightBorder: {
    borderRightWidth: 2,
    borderRightColor: '#000',
  },
  sudokuDigit: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default SudokuGrid;