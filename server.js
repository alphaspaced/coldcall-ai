const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const twilio = require('twilio');

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  keyFile: './n8nalphaspace-470d577db8bc.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = '1bLHBcmQYb0mvIA1RONuJEmqH4n5-mym7VeJjoFMo4';
const SHEET_NAME = 'Recovered_Sheet1';

// 🔹 STEP 1 - Get first phone number
async function getFirstPhoneNumber() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!C2:C`,
  });

  const values = res.data.values || [];
  const rowIndex = values.findIndex(row => row[0]);

  if (rowIndex === -1) throw new Error('No phone numbers found.');
  return {
    phone: values[rowIndex][0],
    row: rowIndex + 2, // +2 because C2 = row 2
  };
}

// 🔹 STEP 2 - Handle Twilio POST callback (asks for email)
app.post('/call', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say('Hi! This is AlphaSpace. What’s the best email to reach you at? Please say it clearly after the beep.');
  twiml.record({
    action: '/gather',
    transcribe: true,
    transcribeCallback: '/gather',
    maxLength: 10,
    timeout: 5,
  });
  res.type('text/xml');
  res.send(twiml.toString());
});

// 🔹 STEP 3 - Capture spoken email and save to Google Sheets
app.post('/gather', async (req, res) => {
  const speech = req.body.SpeechResult || req.body.TranscriptionText;
  if (!speech) {
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say("Sorry, I didn't catch that. Goodbye.");
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  // Find first empty email cell (column F)
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
  twiml.say("Thanks! Got it. We’ll be in touch. Goodbye!");
  res.type('text/xml');
  res.send(twiml.toString());
});

// 🔹 STEP 4 - Manually test call trigger from browser
app.get('/next', async (req, res) => {
  try {
    const { phone } = await getFirstPhoneNumber();
    const from = process.env.TWILIO_PHONE_NUMBER;

    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.calls.create({
      url: 'https://coldcall-ai.onrender.com/call',
      to: phone,
      from,
    });

    res.send(`📞 Calling ${phone}`);
  } catch (err) {
    console.error('Failed to trigger call:', err);
    res.status(500).send(`Error placing call: ${err.message}`);
  }
});

// 🔹 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
