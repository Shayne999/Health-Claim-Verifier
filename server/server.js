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
// app.use(cors());

app.use(cors({ origin: 'http://localhost:3000' }));
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


// app.post('/api/extract-claims', async (req, res) => {
//   const { text } = req.body;
//   try {
//     // Construct a prompt for the model
//     const prompt = `Extract health-related claims from the following text:\n${text}`;

//     // Call the Hugging Face Inference API
//     const response = await axios({
//       method: 'POST',
//       url: 'https://api-inference.huggingface.co/models/google/flan-t5-base',
//       headers: { 
//         "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}` 
//       },
//       data: {
//         inputs: prompt,
//         parameters: { max_new_tokens: 100 }
//       }
//     });

//     // The response is typically an array; extract the generated text
//     const generatedText = response.data[0]?.generated_text;
//     res.json({ claims: generatedText });
//   } catch (error) {
//     console.error('Hugging Face API error:', error);
//     res.status(500).json({ error: 'Failed to extract claims', details: error.message });
//   }
// });

// // Europe PMC API
// app.get('/api/verify-claims', async (req, res) => {
//   const { claims } = req.query;

//   if (!claims) {
//     return res.status(400).json({ error: 'Missing "claims" query parameter' });
//   }

//   try {
//     const response = await axios.get(`https://www.ebi.ac.uk/europepmc/webservices/rest/search`, {
//       params: { query: claims, format: 'json' }
//     });
//     res.json(response.data);
//   } catch (error) {
//     console.error('Europe PMC API error:', error.response ? error.response.data : error.message);
//     res.status(500).json({ 
//       error: 'Failed to verify claims', 
//       details: error.response ? error.response.data : error.message 
//     });
//   }
// });

// Extract and verify claims in a single endpoint
app.post("/api/extract-and-verify", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Missing "text" in request body' });
  }

  try {
    // **Step 1: Extract Claims using Hugging Face**
    const extractionPrompt = `Extract and list health-related claims from the following text:\n${text}`;
    
    const extractResponse = await axios.post(
      "https://api-inference.huggingface.co/models/google/flan-t5-base",
      { inputs: extractionPrompt, parameters: { max_new_tokens: 100 } },
      { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` } }
    );

    const extractedClaims = extractResponse.data[0]?.generated_text?.split("\n") || [];
    
    if (!extractedClaims.length) {
      return res.status(400).json({ error: "No claims extracted" });
    }

    console.log("Extracted Claims:", extractedClaims);

    // **Step 2: Retrieve Relevant Papers from Europe PMC**
    const verificationResults = await Promise.all(
      extractedClaims.map(async (claim) => {
        try {
          const pmcResponse = await axios.get(
            "https://www.ebi.ac.uk/europepmc/webservices/rest/search",
            { params: { query: claim, format: "json" } }
          );

          const papers = pmcResponse.data.resultList?.result || [];
          const abstracts = papers
            .map((paper) => paper.abstractText)
            .filter((abstract) => abstract) // Remove undefined abstracts
            .slice(0, 5) // Limit number of abstracts to avoid token limit

          console.log(`Retrieved ${abstracts.length} abstracts for claim: "${claim}"`);

          // **Step 3: Use Hugging Face to Verify Claim with Retrieved Evidence**
          const verificationPrompt = `
          Claim: ${claim}
          Based on the following scientific abstracts, determine if the claim is supported, refuted, or inconclusive.
          
          Scientific Evidence:
          ${abstracts.join("\n\n")}

          Return only "Supported", "Refuted", or "Inconclusive".
          `;

          const verifyResponse = await axios.post(
            "https://api-inference.huggingface.co/models/google/flan-t5-base",
            { inputs: verificationPrompt, parameters: { max_new_tokens: 5 } },
            { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` } }
          );

          const verificationResult = verifyResponse.data[0]?.generated_text?.trim() || "Inconclusive";

          return { claim, verification: verificationResult };
        } catch (error) {
          console.error(`Error verifying claim: "${claim}"`, error.message);
          return { claim, verification: "Error retrieving verification" };
        }
      })
    );

    res.json({ extractedClaims, verificationResults });
  } catch (error) {
    console.error("Error processing claims:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
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