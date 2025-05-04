// src/screens/ScanScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { StatusBar } from 'expo-status-bar';
import { cv, opencvUtils } from '../utils/opencv';
import DigitRecognizer from '../utils/digitRecognizer';

const ScanScreen = ({ navigation, route }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const { mode } = route.params || { mode: 'solve' };
  const cameraRef = useRef(null);
  const digitRecognizer = useRef(new DigitRecognizer());

  // Request camera permissions and initialize OpenCV on component mount
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      try {
        // Initialize OpenCV
        await opencvUtils.installOpenCV();
        
        // Initialize digit recognizer
        await digitRecognizer.current.initialize();
      } catch (error) {
        console.error('Initialization error:', error);
        Alert.alert(
          'Initialization Error',
          'There was a problem initializing the application. Please restart the app.',
          [{ text: 'OK' }]
        );
      }
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        processImage(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture image. Please try again.');
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
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
      
      // Create an OpenCV matrix from the image
      const imageMat = await opencvUtils.imageToMat(manipResult.uri);
      
      // Process the image to extract the sudoku grid
      const extractedGrid = extractSudokuGrid(imageMat);
      
      // Navigate to the result screen with the extracted grid
      navigation.navigate('Result', {
        image: manipResult.uri,
        grid: extractedGrid,
        mode,
      });
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert(
        'Processing Error',
        'Failed to extract the Sudoku grid. Please try again with a clearer image.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Function to extract the Sudoku grid from an image
  const extractSudokuGrid = (imageMat) => {
    // This is a simplified example - in a real app, you would implement robust 
    // image processing with OpenCV to detect grid lines, cells, and recognize digits
    
    // For demo purposes, generate a sample grid
    // In a real implementation, this would be replaced with actual image processing logic
    const sampleGrid = Array(9).fill().map(() => Array(9).fill(0));
    
    // Add some sample numbers
    sampleGrid[0][0] = 5;
    sampleGrid[0][1] = 3;
    sampleGrid[0][4] = 7;
    sampleGrid[1][0] = 6;
    sampleGrid[1][3] = 1;
    sampleGrid[1][4] = 9;
    sampleGrid[1][5] = 5;
    sampleGrid[2][1] = 9;
    sampleGrid[2][2] = 8;
    sampleGrid[2][7] = 6;
    
    // More sample numbers for the grid
    sampleGrid[3][0] = 8;
    sampleGrid[3][4] = 6;
    sampleGrid[3][8] = 3;
    sampleGrid[4][0] = 4;
    sampleGrid[4][3] = 8;
    sampleGrid[4][5] = 3;
    sampleGrid[4][8] = 1;
    sampleGrid[5][0] = 7;
    sampleGrid[5][4] = 2;
    sampleGrid[5][8] = 6;
    
    sampleGrid[6][1] = 6;
    sampleGrid[6][6] = 2;
    sampleGrid[6][7] = 8;
    sampleGrid[7][3] = 4;
    sampleGrid[7][4] = 1;
    sampleGrid[7][5] = 9;
    sampleGrid[7][8] = 5;
    sampleGrid[8][4] = 8;
    sampleGrid[8][7] = 7;
    sampleGrid[8][8] = 9;
    
    return sampleGrid;
    
    // In a real implementation, you would:
    // 1. Convert the image to grayscale
    // 2. Apply adaptive thresholding
    // 3. Find contours to locate the grid
    // 4. Apply perspective transform to get a top-down view
    // 5. Detect grid lines and extract individual cells
    // 6. Recognize digits in each cell using the digitRecognizer
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Camera access denied</Text>
        <Text style={styles.instructionText}>
          This app needs camera permission to scan Sudoku puzzles.
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Processing Sudoku grid...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {mode === 'solve' ? 'Scan to Solve' : 'Scan to Validate'}
        </Text>
        <Text style={styles.headerSubtitle}>
          Position the Sudoku puzzle within the frame
        </Text>
      </View>
      
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={Camera.Constants.Type.back}
          ratio="1:1"
        />
        <View style={styles.overlay}>
          <View style={styles.gridOverlay} />
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cameraButton]}
          onPress={takePicture}
        >
          <Text style={styles.buttonText}>Take Picture</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.galleryButton]}
          onPress={pickImage}
        >
          <Text style={styles.buttonText}>From Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.backButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridOverlay: {
    width: '80%',
    height: '80%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  buttonContainer: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  button: {
    padding: 15,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
  },
  cameraButton: {
    backgroundColor: '#3498db',
  },
  galleryButton: {
    backgroundColor: '#9b59b6',
  },
  backButton: {
    backgroundColor: '#7f8c8d',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
  },
});

export default ScanScreen;

