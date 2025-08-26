const { google } = require('googleapis');

// TODO: Insert your credentials here or use dotenv for environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/auth/google/callback';

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

function getAuthUrl() {
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
  });
}

async function getTokens(code) {
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
}

async function addEventsToCalendar(access_token, events) {
  const calendar = google.calendar({ version: 'v3' });
  oAuth2Client.setCredentials({ access_token });
  for (let event of events) {
    await calendar.events.insert({
      calendarId: 'primary',
      auth: oAuth2Client,
      requestBody: event,
    });
  }
}

module.exports = { getAuthUrl, getTokens, addEventsToCalendar };