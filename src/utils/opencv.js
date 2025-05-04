// opencv.js - OpenCV JS Wrapper for React Native

import cv from 'opencv.js';

// Add utility functions to make OpenCV.js work with React Native
const opencvUtils = {
  // Convert base64 image to OpenCV Mat
  imageToMat: async (base64Image) => {
    return new Promise((resolve, reject) => {
      try {
        // Remove any data URL prefix
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
        
        // Create a Uint8Array from the base64 string
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Create a Blob from the bytes
        const blob = new Blob([bytes], { type: 'image/png' });
        
        // Create an image element
        const img = new Image();
        
        img.onload = () => {
          // Create a canvas to draw the image
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw the image to the canvas
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          // Get the image data from the canvas
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Create an OpenCV mat from the image data
          const mat = cv.matFromImageData(imageData);
          resolve(mat);
        };
        
        img.onerror = (error) => {
          reject(new Error('Failed to load image: ' + error));
        };
        
        // Load the image from the Blob
        img.src = URL.createObjectURL(blob);
      } catch (error) {
        reject(error);
      }
    });
  },
  
  // Convert OpenCV Mat to base64 image
  matToImage: (mat) => {
    try {
      // Create a canvas
      const canvas = document.createElement('canvas');
      canvas.width = mat.cols;
      canvas.height = mat.rows;
      
      // Get the context
      const ctx = canvas.getContext('2d');
      
      // Create an ImageData object from the mat
      const imgData = new ImageData(
        new Uint8ClampedArray(mat.data),
        mat.cols,
        mat.rows
      );
      
      // Put the image data on the canvas
      ctx.putImageData(imgData, 0, 0);
      
      // Convert the canvas to a base64 string
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error converting Mat to image:', error);
      return null;
    }
  },
  
  // Install OpenCV.js in React Native environment
  installOpenCV: async () => {
    if (typeof cv !== 'undefined') {
      console.log('OpenCV.js is already installed');
      return cv;
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.5.5/opencv.js';
      script.async = true;
      script.onload = () => {
        console.log('OpenCV.js loaded successfully');
        cv.onRuntimeInitialized = () => {
          console.log('OpenCV.js runtime initialized');
          resolve(cv);
        };
      };
      script.onerror = (error) => {
        console.error('Failed to load OpenCV.js:', error);
        reject(error);
      };
      document.body.appendChild(script);
    });
  }
};

// Export the OpenCV instance with utilities
export { cv, opencvUtils };

// Export the Sudoku solver and validator
export { solveSudoku, validateSudoku };