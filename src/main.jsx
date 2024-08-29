// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client'; // New import in React 18
import App from './App';
import './index.css';

// Find the root element in the DOM
const container = document.getElementById('root');

// Create a root using the new createRoot API
const root = ReactDOM.createRoot(container);

// Render the application using the root
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
