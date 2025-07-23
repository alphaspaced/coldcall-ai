const express = require('express');
const twilio = require('twilio');
const app = express();

app.use(express.urlencoded({ extended: false }));

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
