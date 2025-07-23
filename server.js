const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const twilio = require('twilio');

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// GOOGLE SHEETS SETUP
const auth = new google.auth.GoogleAuth({
  keyFile: './n8nalphaspace-470d577db8bc.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = '1bLHBCmQYb0mvIA1ROnUJEmqH4n5-mym7VeJjoFMo4';
const SHEET_NAME = 'Recovered_Sheet1';

// STEP 1 - GET FIRST PHONE NUMBER
async function getFirstPhoneNumber() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!C2:C`,
  });

  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    throw new Error('No phone numbers found.');
  }

  const phone = rows.find(r => r[0]);
  return phone ? phone[0] : null;
}

// STEP 2 - TWILIO WEBHOOK (INBOUND POST from Twilio)
app.post('/call', async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  const gather = twiml.gather({
    input: 'speech',
    action: '/gather',
    method: 'POST',
    timeout: 5,
    speechTimeout: 'auto'
  });

  gather.say('Hi! This is AlphaSpace. What’s the best email to reach you at? Please say it clearly after the beep.');

  res.type('text/xml');
  res.send(twiml.toString());
});

app.get('/next', async (req, res) => {
  try {
    const rows = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!C2:C`, // Column C = Phone Number
    });

    const values = rows.data.values || [];
    const rowIndex = values.findIndex((row) => row[0]);

    if (rowIndex === -1) return res.send('No phone numbers found.');

    const phone = values[rowIndex][0];
    const from = process.env.TWILIO_PHONE_NUMBER;

    await client.calls.create({
      url: 'https://coldcall-ai.onrender.com/call',
      to: phone,
      from,
    });

    res.send(`📞 Calling ${phone}`);
  } catch (err) {
    console.error('Failed to trigger call:', err.message);
    res.status(500).send('Error placing call');
  }
});


// STEP 3 - OUTBOUND CALL TRIGGER
app.get('/trigger', async (req, res) => {
  try {
    const phoneNumber = await getFirstPhoneNumber();
    if (!phoneNumber) {
      return res.status(400).send('No phone number available');
    }

    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    const call = await client.calls.create({
      url: 'https://coldcall-ai.onrender.com/call', // must be POST-compatible TwiML route
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    res.send(`Calling ${phoneNumber}... SID: ${call.sid}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error making call');
  }
});

const PORT = process.env.PORT || 3000;
app.post('/gather', async (req, res) => {
  const speech = req.body.SpeechResult;

  if (!speech) {
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Sorry, I didn’t catch that. Goodbye!');
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  // Find the first empty row in column F (email)
  const rows = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!F2:F`,
  });

  const values = rows.data.values || [];
const rowIndex = values.findIndex(row => !row[0]) + 2;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!F${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[speech]],
    },
  });

  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say('Thanks! Got it. We’ll be in touch. Goodbye!');
  res.type('text/xml');
  res.send(twiml.toString());
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
