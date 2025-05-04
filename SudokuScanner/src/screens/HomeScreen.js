// src/screens/HomeScreen.js
import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sudoku Scanner</Text>
        <Text style={styles.subtitle}>Scan, Solve, and Validate Sudoku Puzzles</Text>
      </View>
      
      <View style={styles.imageContainer}>
        <Image 
          source={require('../../assets/sudoku-icon.png')} 
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Scan', { mode: 'solve' })}
        >
          <Text style={styles.buttonText}>Solve a Puzzle</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('Scan', { mode: 'validate' })}
        >
          <Text style={styles.buttonText}>Validate a Solution</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Take a picture of a Sudoku puzzle to get started.
          Make sure the grid is clearly visible with good lighting.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 8,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '80%',
    height: '80%',
  },
  buttonContainer: {
    marginVertical: 30,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: '#2ecc71',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
  },
  infoText: {
    textAlign: 'center',
    color: '#7f8c8d',
    lineHeight: 20,
  },
});

export default HomeScreen;