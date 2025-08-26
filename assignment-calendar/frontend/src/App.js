import React, { useState } from 'react';
import ImageUpload from './components/imageupload';
import AssignmentTable from './components/AssignmentTable';
import GoogleCalendarButton from './components/GoogleCalendarButton';
import { parseAssignments } from './utils/assignmentParser';

function App() {
  const [ocrText, setOcrText] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [success, setSuccess] = useState(false);

  const handleOcrComplete = (text) => {
    setOcrText(text);
    const extracted = parseAssignments(text);
    setAssignments(extracted);
  };

  const handleAssignmentsChange = (updated) => {
    setAssignments(updated);
  };

  const handleCalendarSuccess = () => {
    setSuccess(true);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 30 }}>
      <h1>Assignment Calendar</h1>
      <ImageUpload onOcrComplete={handleOcrComplete} />
      {ocrText && (
        <AssignmentTable
          assignments={assignments}
          onAssignmentsChange={handleAssignmentsChange}
        />
      )}
      {assignments.length > 0 && (
        <GoogleCalendarButton
          assignments={assignments}
          onSuccess={handleCalendarSuccess}
        />
      )}
      {success && <p style={{ color: 'green' }}>Events added to your Google Calendar!</p>}
    </div>
  );
}

export default App;