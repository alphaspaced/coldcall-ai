// server.js for AlphaSpace Cold Calling AI
// Supports: Inbound calls (testing), Outbound AI (production)

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const twilio = require("twilio");
const VoiceResponse = twilio.twiml.VoiceResponse;
const axios = require("axios");

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
//        ELEVENLABS DEMO ROUTE
//-----------------------------------

app.get("/eleven-voice-test", async (req, res) => {
  const demoText = "Hey! This is AlphaSpace, Edmonton and Vancouver's go-to for real estate media. Let's chat soon!";
  const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
  const API_KEY = process.env.ELEVENLABS_API_KEY;

  try {
    const response = await axios({
      method: "POST",
      url: `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      data: {
        text: demoText,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      responseType: "stream",
    });

    res.setHeader("Content-Type", "audio/mpeg");
    response.data.pipe(res);
  } catch (err) {
    console.error("Voice generation failed:", err.response?.data || err.message);
    res.status(500).send("Voice generation failed.");
  }
});

//-----------------------------------
//        ROUTES
//-----------------------------------

// Inbound test with ElevenLabs voice
app.post("/test-eleven", (req, res) => {
  const twiml = new VoiceResponse();

  twiml.play({}, "https://coldcall-ai.onrender.com/eleven-voice-test");

  const gather = twiml.gather({ input: "speech", action: "/next", method: "POST" });
  gather.pause({ length: 1 });

  res.type("text/xml");
  res.send(twiml.toString());
});


// Outbound production route
app.post("/call", (req, res) => {
  const twiml = new VoiceResponse();
  
  twiml.play({}, "https://coldcall-ai.onrender.com/eleven-voice-test");

  const gather = twiml.gather({ input: "speech", action: "/next", method: "POST" });
  gather.pause({ length: 1 }); // short pause before capturing speech

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
