const express = require('express');
const twilio = require('twilio');
const app = express();

app.use(express.urlencoded({ extended: false }));

app.post('/call', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say('Hello! This is AlphaSpace AI. Can I get your email address, please?');
  res.type('text/xml');
  res.send(twiml.toString());
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
