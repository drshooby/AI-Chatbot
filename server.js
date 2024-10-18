const express = require('express')
const bodyParser = require('body-parser')
const { OpenAI } = require('openai')
require('dotenv').config()

const path = require('path')
const axios = require('axios')

const app = express()

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const mongoose = require('mongoose')
// Import the environment variables
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const Interaction = require('./models/Interaction');  // Import Interaction model

app.get('/', (req, rsp) => {
    rsp.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('/chat', (req, rsp) => {
    rsp.sendFile(path.join(__dirname, 'public', 'chat.html'))
})

app.post('/history', async (req, res) => {
    const { participantID } = req.body; // Get participant ID

    if (!participantID) {
        return res.status(400).send('Participant ID is required');
    }
    
    try {
        // Fetch all interactions from the database for the given participantID
        const interactions = await Interaction.find({ participantID }).sort( { timestamp: 1 });
        // Send the conversation history back to the client
        res.json({ interactions });
    } catch (error) {
        console.error('Error fetching conversation history:', error.message);
        res.status(500).send('Server Error');
    }
});
    

app.post('/chat', async (req, res) => {

  const { history = [], input: userInput, participantID } = req.body

  if (!participantID) {
    return res.status(400).send('Participant ID is required')
  }

  const messages = history.length === 0
    ? [{ role: 'system', content: 'You are a helpful assistant.' }, {role: 'user', content: userInput }]
    : [{ role: 'system', content: 'You are a helpful assistant.' }, ...history, { role: 'user', content: userInput }]

  try {

    const bingResponse = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
        params: { q: userInput }, // Use the user's input as the search query
        headers: { 'Ocp-Apim-Subscription-Key': process.env.BING_API_KEY }
    });

    const searchResults = bingResponse.data.webPages.value.slice(0, 3).map(result => ({
        title: result.name,
        url: result.url,
        snippet: result.snippet
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 100,
    });

    const botResponse = response.choices[0].message.content.trim()

    // Log the interaction to MongoDB
    const interaction = new Interaction({
      userInput: userInput,
      botResponse: botResponse,
      participantID: participantID
    });
    await interaction.save();  // Save the interaction to MongoDB
    
    // send bot response back to client
    res.json({ searchResults, botResponse });
  } catch (error) {
    console.error('Error interacting with OpenAI API:', error.message);
    res.status(500).send('Server Error');
  }
});

const EventLog = require('./models/EventLog');  // Import EventLog model

app.post('/log-event', async (req, res) => {

  const { eventType, elementName, timestamp, participantID } = req.body;

  if (!participantID) {
    return res.status(400).send('Participant ID is required')
  }

  try {
    // Log the event to MongoDB
    const event = new EventLog({ eventType, elementName, timestamp, participantID });
    await event.save();

    res.status(200).send('Event logged successfully');
  } catch (error) {
    console.error('Error logging event:', error.message);
    res.status(500).send('Server Error');
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});