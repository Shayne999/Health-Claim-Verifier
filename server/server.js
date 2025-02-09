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
    console.error('Twitter API error:', error);
    res.status(500).json({ error: 'Failed to fetch tweets' });
  }
});


// OpenAI API
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// app.post('/api/extract-claims', async (req, res) => {
//   const { text } = req.body;
//   try {
//     const response = await openai.chat.completions.create({
//       model: 'gpt-3.5-turbo',
//       messages: [
//         { role: 'system', content: 'Extract health-related claims from the following text:' },
//         { role: 'user', content: text },
//       ],
//       max_tokens: 100,
//     });
//     res.json({ claims: response.choices[0].message.content });
//   } catch (error) {
//     console.error('Error extracting claims:', error);
//     res.status(500).json({ error: error.message, stack: error.stack });
//   }
// });

app.post('/api/extract-claims', async (req, res) => {
  const { text } = req.body;
  try {
    // Construct a prompt for the model
    const prompt = `Extract health-related claims from the following text:\n${text}`;

    // Call the Hugging Face Inference API
    const response = await axios({
      method: 'POST',
      url: 'https://api-inference.huggingface.co/models/google/flan-t5-base',
      headers: { 
        "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}` 
      },
      data: {
        inputs: prompt,
        parameters: { max_new_tokens: 100 }
      }
    });

    // The response is typically an array; extract the generated text
    const generatedText = response.data[0]?.generated_text;
    res.json({ claims: generatedText });
  } catch (error) {
    console.error('Hugging Face API error:', error);
    res.status(500).json({ error: 'Failed to extract claims', details: error.message });
  }
});

// Europe PMC API
app.get('/api/verify-claims', async (req, res) => {
  const { claims } = req.query;

  if (!claims) {
    return res.status(400).json({ error: 'Missing "claims" query parameter' });
  }

  try {
    const response = await axios.get(`https://www.ebi.ac.uk/europepmc/webservices/rest/search`, {
      params: { query: claims, format: 'json' }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Europe PMC API error:', error.response ? error.response.data : error.message);
    res.status(500).json({ 
      error: 'Failed to verify claims', 
      details: error.response ? error.response.data : error.message 
    });
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