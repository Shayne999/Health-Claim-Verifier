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
  const [verificationResults, setVerificationResults] = useState([]);
  const [loading, setLoading] = useState(false);


  const fetchTweets = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/fetch-tweets");
      setTweets(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch tweets", error);
    } finally {
      setLoading(false);
    }
  };


  const processClaims = async () => {
    if (!text) return;
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/extract-and-verify", { text });
      setClaims(response.data.extractedClaims || []);
      setVerificationResults(response.data.verificationResults || []);
    } catch (error) {
      console.error("Failed to process claims", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1 className="main-title">Health Claim Verifier</h1>

      {/* Fetch Tweets Section */}
      <motion.div whileHover={{ scale: 1.02 }} className="motion-div">
        <Button onClick={fetchTweets} disabled={loading}>
          {loading ? "Fetching Tweets..." : "Fetch Health Tweets"}
        </Button>
        <div className="tweets-grid">
          {tweets.map((tweet, index) => (
            <div key={index} className="tweet-card">
              <p>{tweet.text}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Input Section */}
      <div className="form-section">
        <Label htmlFor="textInput">Enter Text to Extract and Verify Claims:</Label>
        <Input id="textInput" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste health information here..." />
        <Button onClick={processClaims} disabled={loading}>
          {loading ? "Processing..." : "Extract & Verify Claims"}
        </Button>
      </div>

      {/* Results Section */}
      <div className="results-section">
        <h2 className="main-title">Extracted Claims & Verification Results:</h2>
        <ul className="claim-list">
          {verificationResults.map((item, index) => (
            <li key={index} className="claim-item">
              <strong>{item.claim}:</strong> {item.verification}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;