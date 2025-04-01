import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './contexts/AuthContext';
// import { seedDatabase } from './utils/seedData'; // OLD
import { seedSubcontractorData } from './utils/seedData'; // NEW - Note: requires userId

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Seed the database (development only) - Needs to be called conditionally with userId
// For now, commenting out the direct call. Consider moving this logic inside App.tsx
// if (process.env.NODE_ENV === 'development') {
//   // seedDatabase(); // OLD
//   // seedSubcontractorData(userId); // NEW - Requires userId from AuthProvider/useAuth
// }

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
