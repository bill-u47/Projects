import React, { useState } from 'react';
import axios from 'axios';

const BACKEND = 'http://localhost:5000';

function GoogleCalendarButton({ assignments, onSuccess }) {
  const [authUrl, setAuthUrl] = useState(null);
  const [code, setCode] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [step, setStep] = useState(0);

  const handleGoogleAuth = async () => {
    const res = await axios.get(`${BACKEND}/auth/google/url`);
    setAuthUrl(res.data.url);
    setStep(1);
  };

  const handleCodeSubmit = async () => {
    const res = await axios.post(`${BACKEND}/auth/google/tokens`, { code });
    setAccessToken(res.data.access_token);
    setStep(2);
  };

  const handleAddEvents = async () => {
    // Prepare Google Calendar events
    const events = assignments.map(a => ({
      summary: a.name,
      description: a.notes,
      start: { date: a.date },
      end: { date: a.date }
    }));
    await axios.post(`${BACKEND}/calendar/add-events`, {
      access_token: accessToken,
      events
    });
    onSuccess();
  };

  return (
    <div style={{ marginTop: 32 }}>
      {step === 0 && (
        <button onClick={handleGoogleAuth}>
          Sign in with Google & Add to Calendar
        </button>
      )}
      {step === 1 && (
        <div>
          <p>
            <a href={authUrl} target="_blank" rel="noopener noreferrer">
              Click here to sign in and copy the code from the URL.
            </a>
          </p>
          <input
            placeholder="Paste code from URL here"
            value={code}
            onChange={e => setCode(e.target.value)}
            style={{ width: 320 }}
          />
          <button onClick={handleCodeSubmit}>Submit Code</button>
        </div>
      )}
      {step === 2 && (
        <button onClick={handleAddEvents}>
          Add Assignments to Google Calendar
        </button>
      )}
    </div>
  );
}

export default GoogleCalendarButton;