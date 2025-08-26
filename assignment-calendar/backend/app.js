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

app.post('/auth/google/tokens', async (req, res) => {
  const { code } = req.body;
  try {
    const tokens = await getTokens(code);
    res.json(tokens);
  } catch (err) {
    res.status(400).json({ error: err.message });
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