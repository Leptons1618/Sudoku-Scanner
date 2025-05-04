// src/screens/ResultScreen.js
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SudokuGrid from '../components/SudokuGrid';
import { solveSudoku, validateSudoku } from '../utils/sudokuSolver';

const ResultScreen = ({ navigation, route }) => {
  const { image, grid, mode } = route.params;
  const [solution, setSolution] = useState(null);
  const [isValid, setIsValid] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    processGrid();
  }, []);

  const processGrid = async () => {
    setLoading(true);
    
    try {
      if (mode === 'solve') {
        // Solve the puzzle
        const solvedGrid = solveSudoku(grid);
        setSolution(solvedGrid);
        
        if (!solvedGrid) {
          Alert.alert(
            'Invalid Puzzle',
            'This puzzle cannot be solved. It may contain errors or be an invalid Sudoku puzzle.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // Validate the solution
        const gridIsValid = validateSudoku(grid);
        setIsValid(gridIsValid);
        
        setTimeout(() => {
          Alert.alert(
            gridIsValid ? 'Valid Solution' : 'Invalid Solution',
            gridIsValid 
              ? 'The Sudoku solution is correct!' 
              : 'The Sudoku solution is incorrect or incomplete.',
            [{ text: 'OK' }]
          );
        }, 500);
      }
    } catch (error) {
      console.error('Error processing grid:', error);
      Alert.alert(
        'Processing Error',
        'An error occurred while processing the Sudoku grid.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>
          {mode === 'solve' ? 'Sudoku Solver' : 'Sudoku Validator'}
        </Text>
        
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>
              {mode === 'solve' ? 'Solving puzzle...' : 'Validating solution...'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {mode === 'solve' ? 'Original Puzzle:' : 'Detected Grid:'}
            </Text>
            <SudokuGrid grid={grid} />
            
            {mode === 'solve' && solution && (
              <>
                <Text style={styles.sectionTitle}>Solution:</Text>
                <SudokuGrid grid={solution} />
              </>
            )}
            
            {mode === 'validate' && (
              <View style={styles.validationResult}>
                <Text style={[
                  styles.validationText,
                  isValid ? styles.validText : styles.invalidText
                ]}>
                  {isValid ? 'VALID SOLUTION' : 'INVALID SOLUTION'}
                </Text>
              </View>
            )}
          </>
        )}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.newScanButton]}
            onPress={() => navigation.navigate('Scan', { mode })}
          >
            <Text style={styles.buttonText}>Scan New Puzzle</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.homeButton]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.buttonText}>Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
    color: '#2c3e50',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  validationResult: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 15,
    borderRadius: 10,
  },
  validationText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  validText: {
    color: '#27ae60',
  },
  invalidText: {
    color: '#e74c3c',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 10,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    minWidth: 150,
    alignItems: 'center',
  },
  newScanButton: {
    backgroundColor: '#3498db',
  },
  homeButton: {
    backgroundColor: '#2c3e50',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ResultScreen;