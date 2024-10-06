const express = require('express')
const bodyParser = require('body-parser')
const { OpenAI } = require('openai')
require('dotenv').config()

const path = require('path')

const app = express()

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get('/', (req, rsp) => {
    rsp.sendFile(path.join(__dirname, 'public', 'chat.html'))
})

app.post('/chat', async (req, res) => {
  const message = req.body
  if (!message) {
    return res.status(400).send('Invalid input');
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: 'user', content: message.chat }],
      max_tokens: 100,
    });

    const botResponse = response.choices[0].message.content.trim()
    res.json({ botResponse });
  } catch (error) {
    console.error('Error interacting with OpenAI API:', error.message);
    res.status(500).send('Server Error');
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});