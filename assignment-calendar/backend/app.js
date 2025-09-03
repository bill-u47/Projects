require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getAuthUrl, getTokens, addEventsToCalendar } = require('./googleAuth');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/auth/google/url', (req, res) => {
  const url = getAuthUrl();
  res.json({ url });
});

app.post('/auth/google/token', async (req, res) => {
  const { code } = req.body;
  try {
    const tokens = await getTokens(code);
    res.json(tokens);
  } catch (err) {
    console.error('Token exchange error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Add callback endpoint for OAuth redirect
app.get('/auth/google/callback', (req, res) => {
  const { code } = req.query;
  if (code) {
    res.send(`
      <html>
        <body>
          <h2>Authorization successful!</h2>
          <p>Copy this code and paste it in the application:</p>
          <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px;">${code}</pre>
          <p>You can close this window now.</p>
        </body>
      </html>
    `);
  } else {
    res.status(400).send('No authorization code received');
  }
});

app.post('/calendar/add-events', async (req, res) => {
  const { access_token, events } = req.body;
  try {
    await addEventsToCalendar(access_token, events);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));