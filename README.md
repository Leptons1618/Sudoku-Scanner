# Sudoku-Scanner
# Sudoku Scanner App - Setup Guide

This guide will help you set up and run the Sudoku Scanner application using React Native and Expo.

## Prerequisites

- Node.js (version 14 or newer)
- npm or yarn
- Expo CLI
- A mobile device with Expo Go installed or an emulator/simulator

## Project Setup

### 1. Create a new Expo project

```bash
# Install Expo CLI if you don't have it
npm install -g expo-cli

# Create a new project
expo init SudokuScanner
cd SudokuScanner
```

### 2. Install dependencies

```bash
npm install react-native-camera
expo install expo-camera
expo install expo-image-picker
expo install expo-image-manipulator
expo install expo-file-system
npm install @tensorflow/tfjs
npm install @tensorflow/tfjs-react-native
expo install expo-gl
expo install expo-gl-cpp
npm install opencv.js --save
```

### 3. Project Structure

Create the following file structure:

```
SudokuScanner/
├── App.js
├── assets/
├── src/
│   ├── utils/
│   │   ├── opencv.js
│   │   ├── sudokuSolver.js
│   │   └── digitRecognizer.js
│   ├── components/
│   │   ├── SudokuGrid.js
│   │   └── CameraView.js
│   └── screens/
│       ├── HomeScreen.js
│       ├── ScanScreen.js
│       └── ResultScreen.js
├── app.json
└── package.json
```

### 4. Configure app.json

Update your `app.json` file to include necessary permissions:

```json
{
  "expo": {
    "name": "Sudoku Scanner",
    "slug": "sudoku-scanner",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to scan Sudoku puzzles.",
        "NSPhotoLibraryUsageDescription": "This app accesses your photos to let you select Sudoku puzzle images."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

## Code Integration

### 1. Copy the provided code files into your project structure:

- Copy the main `App.js` code from the artifact to your project's App.js
- Copy the OpenCV utility functions to `src/utils/opencv.js`
- Copy the Sudoku solver functions to `src/utils/sudokuSolver.js`
- Copy the digit recognition module to `src/utils/digitRecognizer.js`

### 2. Create the components:

#### SudokuGrid.js
```javascript
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
```

#### CameraView.js
```javascript
import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

const CameraView = ({ onCapture }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef = useRef(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      onCapture(photo.uri);
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
      onCapture(result.assets[0].uri);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});

export default CameraView;
```

## Running the App

1. Start the development server:
```bash
expo start
```

2. Scan the QR code with the Expo Go app on your device, or press 'a' to open the app on an Android emulator, or 'i' for iOS simulator.

## Customization and Extensions

### 1. Improving Digit Recognition
For better digit recognition, consider:
- Using a pre-trained MNIST model 
- Adding data augmentation for better robustness
- Implementing a digit classifier directly in the app

### 2. Enhancing Image Processing
Improve grid detection with:
- Adaptive thresholding parameters
- More robust contour detection
- Perspective transformation refinement

### 3. Adding Features
Potential enhancements:
- Save puzzles locally
- Share puzzles
- Difficulty rating
- Step-by-step solving with hints
- Different visualization modes

## Troubleshooting

### Common Issues:

1. **Camera Access Problems**:
   - Check that permissions are properly set in app.json
   - Ensure you've requested permissions at runtime

2. **OpenCV Integration Issues**:
   - Make sure OpenCV.js is properly loaded and initialized
   - Check browser console for specific errors

3. **Image Processing Failures**:
   - Try with clearer images of Sudoku puzzles
   - Adjust threshold parameters for different lighting conditions
   - Debug by displaying intermediate processing results

4. **Digit Recognition Errors**:
   - Train the model on more diverse Sudoku fonts
   - Implement a confidence threshold and ask user for verification when uncertain

## Resources

- [OpenCV Documentation](https://docs.opencv.org/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [TensorFlow.js Documentation](https://www.tensorflow.org/js)