// opencv.js - OpenCV JS Wrapper for React Native

// Import OpenCV from node_modules
// We'll use a dynamic import to avoid bundling issues
let cv = null;

// Add utility functions to make OpenCV.js work with React Native
const opencvUtils = {
  // Convert base64 image to OpenCV Mat
  imageToMat: async (base64Image) => {
    // Ensure OpenCV is loaded
    if (!cv) await opencvUtils.initializeOpenCV();
    
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
        
        // Create a temporary img element and draw to canvas
        // This approach is more compatible with React Native's environment
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
        
        // Create object URL from bytes
        const blob = new Blob([bytes], { type: 'image/png' });
        img.src = URL.createObjectURL(blob);
      } catch (error) {
        reject(error);
      }
    });
  },
  
  // Convert OpenCV Mat to base64 image
  matToImage: (mat) => {
    try {
      // Ensure OpenCV is loaded
      if (!cv) throw new Error('OpenCV not initialized');
      
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
  
  // Initialize OpenCV in React Native environment
  initializeOpenCV: async () => {
    if (cv) {
      console.log('OpenCV.js is already initialized');
      return cv;
    }
    
    try {
      // Import using require with dynamic resolution for React Native
      const opencv = require('../../node_modules/opencv-wasm/opencv.js');
      
      // Wait for initialization
      return new Promise((resolve) => {
        opencv.onRuntimeInitialized = () => {
          console.log('OpenCV.js runtime initialized');
          cv = opencv;
          resolve(cv);
        };
      });
    } catch (error) {
      console.error('Failed to initialize OpenCV:', error);
      throw error;
    }
  }
};

// Initialize OpenCV on first import
opencvUtils.initializeOpenCV().catch(console.error);

// Export the utilities
export { opencvUtils };
// Export cv as a getter to ensure it's initialized
export const getCV = async () => {
  if (!cv) await opencvUtils.initializeOpenCV();
  return cv;
};