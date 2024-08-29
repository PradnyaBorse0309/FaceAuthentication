import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

const CameraCapture = ({ setAuthStatus }) => {
  const webcamRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);

  const requestPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const captureImage = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      try {
        // Remove the data URL prefix
        const base64Image = imageSrc.split(',')[1];

        // Generate a unique filename
        const filename = `visitor_${Date.now()}.png`;

        console.log('Uploading image to:', import.meta.env.VITE_API_URL_UPLOAD_VISITOR);
        
        // Upload image to S3
        const uploadResponse = await axios.put(
          `${import.meta.env.VITE_API_URL_UPLOAD_VISITOR}/${filename}`,
          base64Image,
          {
            headers: { 'Content-Type': 'image/png' },
          }
        );

        console.log('Upload response:', uploadResponse);

        if (uploadResponse.status === 200) {
          console.log('Authenticating with:', import.meta.env.VITE_API_URL_AUTHENTICATE);
          
          // Authenticate
          const authResponse = await axios.get(
            `${import.meta.env.VITE_API_URL_AUTHENTICATE}?objectKey=${filename}`
          );

          console.log('Auth response:', authResponse);

          if (authResponse.data.Message === 'Success') {
            setAuthStatus({
              isAuth: true,
              message: `Hi ${authResponse.data.firstName} ${authResponse.data.lastName}, welcome to work`,
            });
          } else {
            setAuthStatus({
              isAuth: false,
              message: 'Authentication Failed',
            });
          }
        }
      } catch (error) {
        console.error('Error during authentication process:', error);
        console.error('Error details:', error.response ? error.response.data : 'No response data');
        setAuthStatus({
          isAuth: false,
          message: 'Error in authentication process, try again later.',
        });
      }
    }
  };

  return (
    <div>
      {!hasPermission ? (
        <button onClick={requestPermission}>Request Camera Permission</button>
      ) : (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/png"
          />
          <button onClick={captureImage}>Authenticate</button>
        </>
      )}
    </div>
  );
};

export default CameraCapture;