import React, { useRef, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploadResultMessage, setUploadResultMessage] = useState('Please enter an image to authenticate');
  const [isAuth, setAuth] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const API_URL_UPLOAD_VISITOR = import.meta.env.VITE_API_URL_UPLOAD_VISITOR;
  const API_URL_AUTHENTICATE = import.meta.env.VITE_API_URL_AUTHENTICATE;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const firstNameFromURL = params.get('firstname');
    const lastNameFromURL = params.get('lastname');

    if (firstNameFromURL) setFirstName(firstNameFromURL);
    if (lastNameFromURL) setLastName(lastNameFromURL);

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      })
      .catch(err => console.error("Error accessing the camera: " + err));
  }, []);

  const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  };

  const uploadImage = async (imageData, imageName) => {
    const imageBlob = b64toBlob(imageData, 'image/png');
    const requestUrl = `${API_URL_UPLOAD_VISITOR}/${imageName}`;
    
    console.log('Uploading image to:', requestUrl);

    const response = await fetch(requestUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/png'
      },
      body: imageBlob
    });

    console.log('Upload Response Status:', response.status);
    console.log('Upload Response Headers:', response.headers);

    if (!response.ok) {
      const responseText = await response.text();
      console.log('Upload Response Body:', responseText);
      throw new Error('Error in image upload process');
    }
  };

  const authenticate = async (visitorImageName) => {
    const requestUrl = `${API_URL_AUTHENTICATE}?` + new URLSearchParams({
      objectKey: `${visitorImageName}`
    });

    console.log('Authenticating with URL:', requestUrl);

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('Authenticate Response Status:', response.status);
    console.log('Authenticate Response Headers:', response.headers);

    const responseText = await response.text();
    console.log('Authenticate Response Body:', responseText);

    if (response.status === 403) {
      if (responseText.includes('Person not found')) {
        alert('Unauthorized access: Person not found.');
        throw new Error('403 Forbidden: Person not found.');
      } else {
        throw new Error('403 Forbidden: Over API usage or other reasons.');
      }
    }

    if (!response.ok) {
      throw new Error('Error in authentication process');
    }

    const responseData = JSON.parse(responseText);
    console.log('Authenticate Response Data:', responseData);
    return responseData;
  };

  const captureFrame = async () => {
    setIsCapturing(true);

    try {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageData = canvasRef.current.toDataURL('image/png').split(',')[1];

      if (!imageData) {
        throw new Error('Failed to capture image');
      }

      const visitorImageName = `${uuidv4()}.png`;

      await uploadImage(imageData, visitorImageName);

      const response = await authenticate(visitorImageName);

      let message;
      if (response.Message === 'Success') {
        setAuth(true);
        message = `Hi ${response.firstName} ${response.lastName}, welcome to work`;
      } else {
        setAuth(false);
        message = 'Authentication Failed';
      }
      setUploadResultMessage(message);

      alert(message);

    } catch (error) {
      console.error('Capture Frame Error:', error);
      setAuth(false);
      const message = error.message.includes('403 Forbidden: Person not found')
        ? 'Unauthorized access: Person not found.'
        : 'There is an error in authentication process, try again later.';
      setUploadResultMessage(message);
      alert(message);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="container">
      <video ref={videoRef} width="640" height="480" autoPlay></video>
      <div>
        <button id="capture-btn" onClick={captureFrame} disabled={isCapturing}>
          {isCapturing ? 'Processing...' : 'Authenticate'}
        </button>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
}

export default App;
