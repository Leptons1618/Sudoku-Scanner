// App.js - Main application file for Sudoku Scanner

import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { cv } from './opencv';

const App = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [image, setImage] = useState(null);
  const [sudokuGrid, setSudokuGrid] = useState(null);
  const [solution, setSolution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('validate'); // 'validate' or 'solve'
  const cameraRef = useRef(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      // Initialize OpenCV
      await initOpenCV();
    })();
  }, []);

  const initOpenCV = async () => {
    // Wait for OpenCV.js to be loaded
    if (cv.getBuildInformation) {
      console.log('OpenCV.js is ready');
    } else {
      // Wait until OpenCV is initialized
      cv.onRuntimeInitialized = () => {
        console.log('OpenCV.js is ready');
      };
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      processImage(photo.uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri) => {
    setLoading(true);
    setImage(uri);
    
    try {
      // Resize and normalize the image
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 600 } }],
        { format: 'png' }
      );
      
      // Extract the sudoku grid using OpenCV
      const extractedGrid = await extractSudokuGrid(manipResult.uri);
      setSudokuGrid(extractedGrid);
      
      if (mode === 'solve') {
        const solvedGrid = solveSudoku(extractedGrid);
        setSolution(solvedGrid);
      } else {
        // Validate the grid
        const isValid = validateSudoku(extractedGrid);
        if (isValid) {
          Alert.alert("Valid Solution", "The sudoku solution is valid!");
        } else {
          Alert.alert("Invalid Solution", "The sudoku solution is not valid.");
        }
      }
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process the Sudoku image. Please try again with a clearer image.');
    } finally {
      setLoading(false);
    }
  };

  const extractSudokuGrid = async (imageUri) => {
    // Convert the image URI to a format OpenCV can process
    const imageBytes = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Create an OpenCV matrix from the image
    const imgData = Buffer.from(imageBytes, 'base64');
    const src = cv.matFromImageData(imgData);
    
    // Convert to grayscale
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    // Apply Gaussian blur
    const blur = new cv.Mat();
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
    
    // Apply adaptive threshold
    const thresh = new cv.Mat();
    cv.adaptiveThreshold(
      blur,
      thresh,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY_INV,
      11,
      2
    );
    
    // Find the largest contour (should be the Sudoku grid)
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(
      thresh,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    );
    
    // Find the largest contour by area
    let maxArea = 0;
    let maxContourIdx = -1;
    
    for (let i = 0; i < contours.size(); i++) {
      const contourArea = cv.contourArea(contours.get(i));
      if (contourArea > maxArea) {
        maxArea = contourArea;
        maxContourIdx = i;
      }
    }
    
    if (maxContourIdx === -1) {
      throw new Error('Could not find Sudoku grid');
    }
    
    // Get the corners of the grid
    const grid = new cv.Mat();
    const approx = new cv.Mat();
    const contour = contours.get(maxContourIdx);
    
    const epsilon = 0.02 * cv.arcLength(contour, true);
    cv.approxPolyDP(contour, approx, epsilon, true);
    
    // Ensure we have a quadrilateral
    if (approx.rows !== 4) {
      throw new Error('Could not detect the four corners of the Sudoku grid');
    }
    
    // Perspective transform to get a top-down view of the grid
    const srcPoints = [
      { x: approx.data32S[0], y: approx.data32S[1] },
      { x: approx.data32S[2], y: approx.data32S[3] },
      { x: approx.data32S[4], y: approx.data32S[5] },
      { x: approx.data32S[6], y: approx.data32S[7] }
    ];
    
    // Sort the points to get top-left, top-right, bottom-right, bottom-left
    const sortedPoints = sortCornerPoints(srcPoints);
    
    const dstPoints = [
      { x: 0, y: 0 },
      { x: 450, y: 0 },
      { x: 450, y: 450 },
      { x: 0, y: 450 }
    ];
    
    const srcPointsMat = cv.matFromArray(4, 1, cv.CV_32FC2, [
      sortedPoints[0].x, sortedPoints[0].y,
      sortedPoints[1].x, sortedPoints[1].y,
      sortedPoints[2].x, sortedPoints[2].y,
      sortedPoints[3].x, sortedPoints[3].y
    ]);
    
    const dstPointsMat = cv.matFromArray(4, 1, cv.CV_32FC2, [
      dstPoints[0].x, dstPoints[0].y,
      dstPoints[1].x, dstPoints[1].y,
      dstPoints[2].x, dstPoints[2].y,
      dstPoints[3].x, dstPoints[3].y
    ]);
    
    const perspectiveMatrix = cv.getPerspectiveTransform(srcPointsMat, dstPointsMat);
    cv.warpPerspective(src, grid, perspectiveMatrix, new cv.Size(450, 450));
    
    // Extract individual cells and recognize digits
    const result = Array(9).fill().map(() => Array(9).fill(0));
    const cellSize = 450 / 9;
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = new cv.Mat();
        const rect = new cv.Rect(col * cellSize, row * cellSize, cellSize, cellSize);
        cell = grid.roi(rect);
        
        // Preprocess cell image for digit recognition
        const cellGray = new cv.Mat();
        cv.cvtColor(cell, cellGray, cv.COLOR_RGBA2GRAY);
        
        const cellThresh = new cv.Mat();
        cv.threshold(cellGray, cellThresh, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);
        
        // Check if cell contains a digit (based on white pixel ratio)
        const pixelCount = cv.countNonZero(cellThresh);
        const cellArea = cellSize * cellSize;
        const whiteRatio = pixelCount / cellArea;
        
        if (whiteRatio > 0.03 && whiteRatio < 0.4) {
          // This likely contains a digit
          // For a real app, use a ML model (like TensorFlow Lite) 
          // to recognize the digit
          
          // For this example, we'll simulate digit recognition
          const digit = recognizeDigit(cellThresh);
          result[row][col] = digit;
        }
        
        cellGray.delete();
        cellThresh.delete();
        cell.delete();
      }
    }
    
    // Clean up OpenCV matrices
    src.delete();
    gray.delete();
    blur.delete();
    thresh.delete();
    contours.delete();
    hierarchy.delete();
    grid.delete();
    approx.delete();
    perspectiveMatrix.delete();
    srcPointsMat.delete();
    dstPointsMat.delete();
    
    return result;
  };

  // Helper function to sort corner points
  const sortCornerPoints = (points) => {
    // Calculate the center point
    const center = {
      x: points.reduce((sum, p) => sum + p.x, 0) / 4,
      y: points.reduce((sum, p) => sum + p.y, 0) / 4
    };
    
    // Sort points based on position relative to center
    return points.sort((a, b) => {
      const aQuad = getQuadrant(a, center);
      const bQuad = getQuadrant(b, center);
      return aQuad - bQuad;
    });
  };

  // Helper function to determine quadrant
  const getQuadrant = (point, center) => {
    if (point.x < center.x && point.y < center.y) return 0; // Top-left
    if (point.x > center.x && point.y < center.y) return 1; // Top-right
    if (point.x > center.x && point.y > center.y) return 2; // Bottom-right
    return 3; // Bottom-left
  };

  // Simulated digit recognition (in a real app, use TensorFlow Lite)
  const recognizeDigit = (cellImage) => {
    // This is a placeholder for digit recognition
    // In a real app, you would use a trained ML model
    
    // For this example, we'll just return a random digit (1-9)
    // This would be replaced with actual OCR/ML inference
    return Math.floor(Math.random() * 9) + 1;
  };

  // Validate if the sudoku solution is correct
  const validateSudoku = (grid) => {
    // Check rows
    for (let row = 0; row < 9; row++) {
      const rowSet = new Set();
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) return false; // Incomplete solution
        if (rowSet.has(grid[row][col])) return false; // Duplicate in row
        rowSet.add(grid[row][col]);
      }
    }
    
    // Check columns
    for (let col = 0; col < 9; col++) {
      const colSet = new Set();
      for (let row = 0; row < 9; row++) {
        if (colSet.has(grid[row][col])) return false; // Duplicate in column
        colSet.add(grid[row][col]);
      }
    }
    
    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const boxSet = new Set();
        for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
          for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
            if (boxSet.has(grid[row][col])) return false; // Duplicate in box
            boxSet.add(grid[row][col]);
          }
        }
      }
    }
    
    return true; // Solution is valid
  };

  // Solve the sudoku puzzle using backtracking algorithm
  const solveSudoku = (grid) => {
    const result = JSON.parse(JSON.stringify(grid)); // Deep copy
    
    if (solveHelper(result)) {
      return result;
    }
    return null; // No solution exists
  };

  // Helper function for the solving algorithm
  const solveHelper = (grid) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        // Find an empty cell
        if (grid[row][col] === 0) {
          // Try digits 1-9
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(grid, row, col, num)) {
              grid[row][col] = num; // Try this number
              
              // Recursively try to solve the rest of the grid
              if (solveHelper(grid)) {
                return true;
              }
              
              grid[row][col] = 0; // Backtrack if the placement doesn't work
            }
          }
          return false; // No valid number found for this cell
        }
      }
    }
    return true; // All cells filled
  };

  // Check if a number can be placed in a cell
  const isValidPlacement = (grid, row, col, num) => {
    // Check row
    for (let i = 0; i < 9; i++) {
      if (grid[row][i] === num) return false;
    }
    
    // Check column
    for (let i = 0; i < 9; i++) {
      if (grid[i][col] === num) return false;
    }
    
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[boxRow + i][boxCol + j] === num) return false;
      }
    }
    
    return true; // Valid placement
  };

  // Render the sudoku grid
  const renderSudokuGrid = (grid) => {
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

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>Sudoku Scanner</Text>
        
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'validate' && styles.selectedMode]}
            onPress={() => setMode('validate')}
          >
            <Text style={styles.modeButtonText}>Validate Solution</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'solve' && styles.selectedMode]}
            onPress={() => setMode('solve')}
          >
            <Text style={styles.modeButtonText}>Solve Puzzle</Text>
          </TouchableOpacity>
        </View>
        
        {!image ? (
          <>
            <View style={styles.cameraContainer}>
              <Camera
                ref={cameraRef}
                style={styles.camera}
                type={Camera.Constants.Type.back}
              />
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={takePicture}>
                <Text style={styles.buttonText}>Take Picture</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={pickImage}>
                <Text style={styles.buttonText}>Pick Image</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.image} />
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Processing Sudoku...</Text>
              </View>
            ) : (
              <>
                {sudokuGrid && (
                  <>
                    <Text style={styles.sectionTitle}>
                      {mode === 'validate' ? 'Detected Grid:' : 'Original Puzzle:'}
                    </Text>
                    {renderSudokuGrid(sudokuGrid)}
                    
                    {solution && mode === 'solve' && (
                      <>
                        <Text style={styles.sectionTitle}>Solution:</Text>
                        {renderSudokuGrid(solution)}
                      </>
                    )}
                  </>
                )}
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                      setImage(null);
                      setSudokuGrid(null);
                      setSolution(null);
                    }}
                  >
                    <Text style={styles.buttonText}>Scan New Puzzle</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  modeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  selectedMode: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    fontWeight: '600',
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    borderRadius: 12,
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
  },
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

export default App;