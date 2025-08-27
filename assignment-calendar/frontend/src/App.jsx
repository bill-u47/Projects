import React, { useState } from "react";
import FileUpload from "./components/FileUpload";
import AssignmentTable from "./components/AssignmentTable";
import GoogleCalendarButton from "./components/GoogleCalendarButton";
import { extractAssignments } from "./utils/assignmentExtractor";
import { performOCR } from "./utils/ocr";

function App() {
  const [assignments, setAssignments] = useState([]);
  const [processing, setProcessing] = useState(false);

  const handleFileUpload = async (file) => {
    setProcessing(true);
    try {
      const text = await performOCR(file);
      const extracted = extractAssignments(text);
      setAssignments(extracted);
    } catch (err) {
      setAssignments([]);
      // Optionally handle OCR errors
    } finally {
      setProcessing(false);
    }
  };

  const handleAssignmentsEdit = (newAssignments) => {
    setAssignments(newAssignments);
  };

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 32 }}>
      <h1>Assignment Calendar Uploader</h1>
      <FileUpload onFileUpload={handleFileUpload} />
      {processing ? (
        <div style={{ margin: "24px 0", fontWeight: "bold" }}>
          Processing file, extracting assignments...
        </div>
      ) : (
        <AssignmentTable assignments={assignments} onEdit={handleAssignmentsEdit} />
      )}
      <GoogleCalendarButton assignments={assignments} />
    </div>
  );
}

export default App;