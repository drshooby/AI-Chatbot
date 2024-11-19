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
const Notes = require('./models/Notes');  // Import Notes model

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
    
app.post('/getnotes', async (req, res) => {
    const { participantID } = req.body; // Get participant ID

    if (!participantID) {
        return res.status(400).send('Participant ID is required');
    }

    try {
        let doc = await Notes.findOne({participantID: participantID}).exec();

	//make a fake doc if it doen't exist
	if (!doc) {
	  doc = new Notes({
	    participantID: participantID,
	    doc: []
	  });
	  await doc.save()
	}
	res.send(doc);

    } catch (error) {
        console.error('Error fetching notes:', error.message);
        res.status(500).send('Server Error');
    }
});

app.post('/notes', async (req, res) => {
  const { participantID, doc } = req.body;
    
  if (!participantID) {
    return res.status(400).send('Participant ID is required')
  }

  const filter = { participantID: participantID };
  const update = { doc: doc };

  await Notes.findOneAndUpdate(filter, update);  // Save the interaction to MongoDB
  res.send("Notes saved");
});

app.post('/chat', async (req, res) => {

  const { history = [], input: userInput, participantID } = req.body

  if (!participantID) {
    return res.status(400).send('Participant ID is required')
  }

  const initPrompt = 'You are a helpful assistant assisting in procedural knowledge understanding. For each step of the process, include a header, and create an organized response for the user. Please limit your responses to 450 tokens.'

  const messages = history.length === 0
    ? [{ role: 'system', content: initPrompt }, {role: 'user', content: userInput }]
    : [{ role: 'system', content: initPrompt }, ...history, { role: 'user', content: userInput }]

  try {

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 500,
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
    res.json({ botResponse });
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

app.post('/redirect-to-survey', (req, res) => {
  const { participantID } = req.body; // Getting participantID from request body
  // Base Qualtrics URL from Step 2
  const qualtricsBaseUrl =
  'https://usfca.qualtrics.com/jfe/form/SV_1TR7PjZkeDXwnbw';
  // Add the participant ID as a URL parameter
  const surveyUrl = `${qualtricsBaseUrl}?participantID=${encodeURIComponent(participantID)}`;
  // Send the URL back to the client
  res.send(surveyUrl);
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
