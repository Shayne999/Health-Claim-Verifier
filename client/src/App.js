import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/claims')
      .then(response => setClaims(response.data))
      .catch(error => console.log(error));
  }, []);

  return (
    <div>
      <h1>Health Claim Verifier</h1>
      <ul>
        {claims.map((claim, index) => (
          <li key={index}>{claim.text}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
