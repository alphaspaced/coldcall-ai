// server.js (Cleaned + Fully Working Setup)

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const fs = require('fs');
const twilio = require('twilio');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const PORT = process.env.PORT || 3000;

// ---------------- GOOGLE SHEETS ----------------
const auth = new google.auth.GoogleAuth({
  credentials: require('./n8nalphaspace-68e3214b231e.json'), // File must exist in root
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME;

// ---------------- TWILIO SETUP ----------------
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// ---------------- TWIML CALLBACK ----------------
app.post('/call', (req, res) => {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({ input: 'speech', action: '/next', method: 'POST' });

  gather.say("Hi! This is AlphaSpace. What's the best email to reach you at? Please say it clearly after the beep.");
  res.type('text/xml');
  res.send(twiml.toString());
});

// ---------------- STORE EMAIL ----------------
app.post('/next', async (req, res) => {
  try {
    const email = req.body.SpeechResult || 'Unrecognized';
    console.log('Captured Email:', email);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!E:E`,
      valueInputOption: 'RAW',
      requestBody: { values: [[email]] },
    });

    const twiml = new VoiceResponse();
    twiml.say('Thanks! We have saved your email. Goodbye.');
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (err) {
    console.error('Failed to store email:', err);
    res.status(500).send(`Error placing call: ${err.message}`);
  }
});

// ---------------- FETCH NEXT PHONE & TRIGGER CALL ----------------
app.get('/trigger', async (req, res) => {
  try {
    const rows = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!C2:C`,
    });

    const values = rows.data.values || [];
    const rowIndex = values.findIndex((row) => row[0]);
    if (rowIndex === -1) return res.send('No phone numbers found.');

    const phone = values[rowIndex][0];

    await client.calls.create({
      url: 'https://coldcall-ai.onrender.com/call',
      to: phone,
      from: TWILIO_PHONE_NUMBER,
    });

    res.send(`Calling ${phone}`);
  } catch (err) {
    console.error('Failed to trigger call:', err);
    res.status(500).send(`Error placing call: ${err.message}`);
  }
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
