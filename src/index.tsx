import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { seedDatabase } from './utils/seedData';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Seed database with test data in development mode
if (process.env.NODE_ENV === 'development') {
  seedDatabase().catch(console.error);
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
