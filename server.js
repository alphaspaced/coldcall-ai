const express = require('express');
const twilio = require('twilio');
const app = express();

app.use(express.urlencoded({ extended: false }));

// STEP 1: Handle incoming call
app.post('/call', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  const gather = twiml.gather({
    input: 'speech',
    timeout: 5,
    speechTimeout: 'auto',
    action: '/gather-email',
    method: 'POST'
  });

  gather.say('Hi! This is AlphaSpace AI. Please say your email address clearly after the beep.');

  res.type('text/xml');
  res.send(twiml.toString());
});

// STEP 2: Capture the email and read it back
app.post('/gather-email', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const speechResult = req.body.SpeechResult;

  if (speechResult) {
    console.log(`Captured email: ${speechResult}`);
    twiml.say(`Thanks. We heard: ${speechResult}. Goodbye!`);
  } else {
    twiml.say('Sorry, we didn’t catch that. Please try again later.');
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// STEP 3: Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
