import React, { useState } from 'react';
import axios from 'axios';

const BACKEND = 'http://localhost:5000'; // Make sure this matches your backend port

function GoogleCalendarButton({ assignments, onSuccess }) {
  const [authUrl, setAuthUrl] = useState(null);
  const [code, setCode] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Get Google Auth URL
  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${BACKEND}/auth/google/url`);
      setAuthUrl(res.data.url);
      setStep(1);
    } catch (err) {
      setError('Could not get Google Auth URL.');
    } finally {
      setLoading(false);
    }
  };
  // 2. Exchange code for tokens
  const handleCodeSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${BACKEND}/auth/google/token`, { code });
      console.log(code)
      setAccessToken(res.data.access_token); // Store the access token for next step
      setStep(2);
    } catch (err) {
      setError('Invalid code or failed to get tokens.');
      console.log({code}, err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Send assignments to backend to add calendar events
  const handleAddEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const events = assignments.map(a => ({
        summary: a.name,
        description: a.notes || '',
        start: { date: a.date },
        end: { date: a.date },
      }));
      await axios.post(`${BACKEND}/calendar/add-events`, {
        access_token: accessToken,
        events,
      });
      onSuccess && onSuccess();
      setStep(0); // Optionally reset after success
    } catch (err) {
      setError('Failed to add events to Google Calendar.');
    } finally {
      setLoading(false);
      setError('Assignments successfully added!')
    }
  };

  return (
    <div style={{ marginTop: 32 }}>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {step === 0 && (
        <button onClick={handleGoogleAuth} disabled={loading}>
          {loading ? 'Loading...' : 'Sign in with Google & Add to Calendar'}
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
            disabled={loading}
          />
          <button onClick={handleCodeSubmit} disabled={loading || !code}>
            {loading ? 'Submitting...' : 'Submit Code'}
          </button>
        </div>
      )}
      {step === 2 && (
        <button onClick={handleAddEvents} disabled={loading}>
          {loading ? 'Adding...' : 'Add Assignments to Google Calendar'}
        </button>
      )}
    </div>
  );
}

export default GoogleCalendarButton;