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

const SPREADSHEET_ID = '1bLHBCmQYb0mvIA1ROnUJEmqH4n5-mym7VeJjoFMo4'; // replace if needed
const SHEET_NAME = 'Recovered_Sheet1';

// STEP 1 - GET FIRST PHONE NUMBER
async function getFirstPhoneNumber() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!C2:C`, // Phone Number column
  });

  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    throw new Error('No phone numbers found.');
  }

  // Return first non-empty phone number
  const phone = rows.find(r => r[0]);
  return phone ? phone[0] : null;
}

// STEP 2 - OUTBOUND CALL ENDPOINT
app.get('/call', async (req, res) => {
  try {
    const phoneNumber = await getFirstPhoneNumber();

    if (!phoneNumber) {
      return res.status(400).send('No phone number available');
    }

    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    const call = await client.calls.create({
      twiml: `<Response><Say>Hello! This is AlphaSpace AI. Can I get your email address, please?</Say></Response>`,
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
