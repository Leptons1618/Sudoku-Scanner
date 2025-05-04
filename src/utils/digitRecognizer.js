// digitRecognizer.js - A TensorFlow.js model for digit recognition in Sudoku

import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';

// Class to manage the digit recognition model
class DigitRecognizer {
  constructor() {
    this.model = null;
    this.isModelLoaded = false;
  }

  // Initialize the model - either load a pre-trained model or train a new one
  async initialize(usePretrainedModel = true) {
    try {
      if (usePretrainedModel) {
        await this.loadModel();
      } else {
        await this.trainModel();
      }
      this.isModelLoaded = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize digit recognition model:', error);
      return false;
    }
  }

  // Load a pre-trained model from storage or a URL
  async loadModel() {
    try {
      // Try to load from local storage first
      this.model = await tf.loadLayersModel('localstorage://sudoku-digit-model');
      console.log('Loaded digit recognition model from local storage');
    } catch (error) {
      // If not available locally, load from a remote URL
      console.log('No local model found, loading pre-trained model from server...');
      this.model = await tf.loadLayersModel('https://yourserver.com/models/sudoku-digit-model/model.json');
      
      // Save the model to local storage for future use
      await this.model.save('localstorage://sudoku-digit-model');
    }
  }

  // Train a new model using MNIST dataset
  async trainModel() {
    // Create a sequential model
    const model = tf.sequential();
    
    // Add layers
    model.add(tf.layers.conv2d({
      inputShape: [28, 28, 1],
      kernelSize: 3,
      filters: 32,
      activation: 'relu'
    }));
    
    model.add(tf.layers.maxPooling2d({
      poolSize: [2, 2]
    }));
    
    model.add(tf.layers.conv2d({
      kernelSize: 3,
      filters: 64,
      activation: 'relu'
    }));
    
    model.add(tf.layers.maxPooling2d({
      poolSize: [2, 2]
    }));
    
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dropout({
      rate: 0.2
    }));
    
    model.add(tf.layers.dense({
      units: 10,
      activation: 'softmax'
    }));
    
    // Compile the model
    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    // Load and prepare the MNIST dataset
    console.log('Loading MNIST dataset...');
    const mnist = await this.loadMnistData();
    
    // Train the model
    console.log('Training digit recognition model...');
    const history = await model.fit(
      mnist.trainImages, 
      mnist.trainLabels, 
      {
        epochs: 10,
        batchSize: 128,
        validationData: [mnist.testImages, mnist.testLabels],
        callbacks: [
          tfvis.show.fitCallbacks(
            { name: 'Training Performance' },
            ['loss', 'val_loss', 'acc', 'val_acc'],
            { height: 200, callbacks: ['onEpochEnd'] }
          )
        ]
      }
    );
    
    // Evaluate the model
    const evalOutput = model.evaluate(mnist.testImages, mnist.testLabels);
    console.log(`Test loss: ${evalOutput[0].dataSync()[0].toFixed(4)}`);
    console.log(`Test accuracy: ${evalOutput[1].dataSync()[0].toFixed(4)}`);
    
    // Save the model to local storage
    await model.save('localstorage://sudoku-digit-model');
    
    this.model = model;
    return history;
  }
  
  // Load the MNIST dataset
  async loadMnistData() {
    const trainData = await fetch('https://storage.googleapis.com/tfjs-datasets/mnist_train.csv');
    const testData = await fetch('https://storage.googleapis.com/tfjs-datasets/mnist_test.csv');
    
    const trainText = await trainData.text();
    const testText = await testData.text();
    
    const trainRows = trainText.split('\n');
    const testRows = testText.split('\n');
    
    // Process training data
    const trainFeatures = [];
    const trainLabels = [];
    
    for (let i = 0; i < trainRows.length; i++) {
      const row = trainRows[i].trim();
      if (row) {
        const values = row.split(',').map(x => parseInt(x));
        const label = values[0];
        const features = values.slice(1);
        
        trainFeatures.push(features);
        trainLabels.push(label);
      }
    }
    
    // Process test data
    const testFeatures = [];
    const testLabels = [];
    
    for (let i = 0; i < testRows.length; i++) {
      const row = testRows[i].trim();
      if (row) {
        const values = row.split(',').map(x => parseInt(x));
        const label = values[0];
        const features = values.slice(1);
        
        testFeatures.push(features);
        testLabels.push(label);
      }
    }
    
    // Normalize and reshape data
    const trainImages = tf.tensor4d(
      trainFeatures.map(f => f.map(v => v / 255)),
      [trainFeatures.length, 28, 28, 1]
    );
    
    const testImages = tf.tensor4d(
      testFeatures.map(f => f.map(v => v / 255)),
      [testFeatures.length, 28, 28, 1]
    );
    
    // Convert labels to one-hot encoding
    const trainLabelsOneHot = tf.oneHot(tf.tensor1d(trainLabels, 'int32'), 10);
    const testLabelsOneHot = tf.oneHot(tf.tensor1d(testLabels, 'int32'), 10);
    
    return {
      trainImages,
      trainLabels: trainLabelsOneHot,
      testImages,
      testLabels: testLabelsOneHot
    };
  }
  
  // Process an image and recognize the digit
  async recognizeDigit(imageData) {
    if (!this.isModelLoaded) {
      await this.initialize();
    }
    
    try {
      // Preprocess the image
      const processedImage = this.preprocessImage(imageData);
      
      // Make prediction
      const prediction = this.model.predict(processedImage);
      const results = await prediction.argMax(1).dataSync()[0];
      
      // Clean up tensors
      prediction.dispose();
      processedImage.dispose();
      
      return results;
    } catch (error) {
      console.error('Error recognizing digit:', error);
      return null;
    }
  }
  
  // Preprocess the image for the model
  preprocessImage(imageData) {
    // Convert to tensor
    const tensor = tf.browser.fromPixels(imageData, 1); // Grayscale
    
    // Resize to 28x28
    const resized = tf.image.resizeBilinear(tensor, [28, 28]);
    
    // Normalize values to [0, 1]
    const normalized = resized.div(tf.scalar(255));
    
    // Expand dimensions to match model input shape [1, 28, 28, 1]
    const batched = normalized.expandDims(0);
    
    // Clean up intermediate tensors
    tensor.dispose();
    resized.dispose();
    normalized.dispose();
    
    return batched;
  }
}

export default DigitRecognizer;