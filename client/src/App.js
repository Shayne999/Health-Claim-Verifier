import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

import { Button } from './components/ui/Button';
import { Card, CardContent } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Label } from './components/ui/Label';

function App() {
  const [tweets, setTweets] = useState([]);
  const [text, setText] = useState("");
  const [claims, setClaims] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Fetch tweets containing health information
  const fetchTweets = async () => {
    setSearchLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/fetch-tweets');
      setTweets(response.data);
    } catch (error) {
      console.error('Failed to fetch tweets', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Extract health claims from user input text
  const extractClaims = async () => {
    if (!text) return;
    try {
      const response = await axios.post('http://localhost:5000/api/extract-claims', { text });
      setClaims(response.data.claims ? response.data.claims.split('\n') : []);
    } catch (error) {
      console.error('Failed to extract claims', error);
    }
  };

  // Verify health claims
  const verifyClaims = async () => {
    setVerificationLoading(true);
    try {
      const verifiedResults = await Promise.all(
        claims.map(async (claim) => {
          const response = await axios.get(`http://localhost:5000/api/verify-claims`, { params: { claim } });
          return { claim, result: response.data }; 
        })
      );
      console.log(verifiedResults);
    } catch (error) {
      console.error('Failed to verify claims', error);
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1 className="main-title">Health Claim Verifier</h1>
  
      <motion.div whileHover={{ scale: 1.02 }} className="motion-div">
        <Button className="button" onClick={fetchTweets} disabled={searchLoading}>
          {searchLoading ? 'Fetching Tweets...' : 'Fetch Health Tweets'}
        </Button>
        <div className="tweets-grid">
          {tweets.map((tweet, index) => (
            <Card key={index} className="card">
              <CardContent>
                <p>{tweet.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
  
      <div className="form-section">
        <Label htmlFor="textInput" className="label">Enter Text to Extract Claims:</Label>
        <Input
          id="textInput"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input"
          placeholder="Type or paste health information here..."
        />
        <Button onClick={extractClaims} className="button">
          Extract Claims
        </Button>
      </div>
  
      <div className="results-section">
        <h2 className="main-title">Extracted Claims:</h2>
        <ul className="claim-list">
          {claims.map((claim, index) => (
            <li key={index} className="claim-item">{claim}</li>
          ))}
        </ul>
        <Button onClick={verifyClaims} disabled={verificationLoading || claims.length === 0} className="button">
          {verificationLoading ? 'Verifying Claims...' : 'Verify Claims'}
        </Button>
      </div>
    </div>
  );
  
}

export default App;


