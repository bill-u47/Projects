import React, { useState } from 'react';
import ImageUpload from './components/imageupload'; // Use the improved version!
import AssignmentTable from './components/AssignmentTable';
import GoogleCalendarButton from './components/GoogleCalendarButton';
import { parseAssignments } from './utils/assignmentParser';

function App() {
  const [ocrText, setOcrText] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [success, setSuccess] = useState(false);

  // Used for generic OCR text (legacy flow)
  const handleOcrComplete = (text) => {
    setOcrText(text);
    const extracted = parseAssignments(text);
    setAssignments(extracted);
  };

  // Used for enhanced calendar extraction
  const handleCalendarExtracted = (calendar) => {
    setOcrText(''); // No raw text shown if we have structured data
    setAssignments(
      calendar.map(entry => ({
        dueDate: entry.date,
        description: entry.assignments,
      }))
    );
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
      <ImageUpload
        onOcrComplete={handleOcrComplete}
        onCalendarExtracted={handleCalendarExtracted}
      />
      {(ocrText || assignments.length > 0) && (
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