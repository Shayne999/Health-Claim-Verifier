const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const OpenAI = require('openai');
const { ChatCompletion } = OpenAI;

const axios = require('axios');

const { TwitterApi } = require('twitter-api-v2');
// const { Configuration, OpenAIApi } = require('openai');

const app = express();
const PORT = process.env.PORT || 5000;



// Middleware
app.use(cors());
app.use(express.json());

// Twitter API
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

app.get('/api/fetch-tweets', async (req, res) => {
  try {
    const tweets = await twitterClient.v2.search('health nutrition');
    res.json(tweets.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tweets' });
  }
});

// OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/extract-claims', async (req, res) => {
  const { text } = req.body;
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Extract health-related claims from the following text:' },
        { role: 'user', content: text },
      ],
      max_tokens: 100,
    });
    res.json({ claims: response.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: 'Failed to extract claims' });
  }
});

// PubMed API
app.get('api/verify-claims', async (req, res) => {
  const { claims } = req.query;
  try {
    const response = await axios.get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${claim}`);
    res.json(response.data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify claims' });
  }
});


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB is connected'))
  .catch(err => console.log(err));

// Routes
app.get('/', (req, res) => {
  res.send('Health Claim Verifier Backend');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});