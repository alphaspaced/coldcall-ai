// server.js for AlphaSpace Cold Calling AI
// Supports: Inbound calls (testing), Outbound AI (production)

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const fs = require("fs");
const twilio = require("twilio");
const VoiceResponse = twilio.twiml.VoiceResponse;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const PORT = process.env.PORT || 3000;

//-----------------------------------
//        GOOGLE SHEETS SETUP
//-----------------------------------
const auth = new google.auth.GoogleAuth({
  keyFile: "./service-account.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME;

//-----------------------------------
//        TWILIO SETUP
//-----------------------------------
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

//-----------------------------------
//        ROUTES
//-----------------------------------

// Inbound testing route
app.post("/test", (req, res) => {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({ input: "speech", action: "/next", method: "POST" });

  gather.say(
    "Hey! This is AlphaSpace, Edmonton and Vancouver’s go-to for real estate photos, videos, and 3D tours. What's the best email to reach you at? Just say it clearly after the beep."
  );

  res.type("text/xml");
  res.send(twiml.toString());
});

// Outbound production route
app.post("/call", (req, res) => {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({ input: "speech", action: "/next", method: "POST" });

  gather.say(
    "Hi there! This is AlphaSpace calling — we help realtors like you win listings with stunning media, fast turnaround, and same-day delivery options. May I ask, what's the best email to reach you at?"
  );

  res.type("text/xml");
  res.send(twiml.toString());
});

// Speech-to-text handler placeholder
app.post("/next", (req, res) => {
  const recording = req.body.SpeechResult;
  console.log("Captured speech:", recording);

  // TO DO: validate + store in Google Sheets

  const twiml = new VoiceResponse();
  twiml.say("Thanks! We'll be in touch shortly. Have an amazing day from AlphaSpace.");
  res.type("text/xml");
  res.send(twiml.toString());
});

//-----------------------------------
//        SERVER START
//-----------------------------------

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
