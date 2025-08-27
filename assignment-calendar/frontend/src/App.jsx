import React, { useState, useRef } from "react";
import FileUpload from "./components/FileUpload";
import AssignmentTable from "./components/AssignmentTable";
import GoogleCalendarButton from "./components/GoogleCalendarButton";
import { extractAssignments } from "./utils/assignmentExtractor";
import { performOCR } from "./utils/ocr";

function App() {
  const [assignments, setAssignments] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(null);
  // Token to avoid race conditions if multiple uploads happen quickly
  const activeJob = useRef(0);

  const handleFileUpload = async (file) => {
    setError("");
    setProgress(null);
    setProcessing(true);
    const jobId = ++activeJob.current;

    const text = await performOCR(file, {
      onProgress: (p) => {
        if (activeJob.current === jobId) setProgress(p);
      }
    });

    if (activeJob.current !== jobId) {
      // A newer job started; ignore this result
      return;
    }

    try {
      const extracted = extractAssignments(text);
      setAssignments(extracted);
      if (!extracted.length) {
        setError("No assignments were detected. You may need a clearer image or to adjust parsing rules.");
      }
    } catch (e) {
      console.error(e);
      setAssignments([]);
      setError("An error occurred while extracting assignments.");
    } finally {
      if (activeJob.current === jobId) setProcessing(false);
    }
  };

  const handleAssignmentsEdit = (newAssignments) => {
    setAssignments(newAssignments);
  };

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 32 }}>
      <h1>Assignment Calendar Uploader</h1>
      <FileUpload onFileUpload={handleFileUpload} />
      {processing && (
        <div style={{ margin: "16px 0" }}>
          <strong>Processing file...</strong>
          {progress?.status && (
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {progress.status} {progress.progress ? `(${Math.round(progress.progress * 100)}%)` : ""}
            </div>
          )}
        </div>
      )}
      {error && (
        <div style={{ color: "darkred", margin: "12px 0" }}>
          {error}
        </div>
      )}
      {!processing && (
        <AssignmentTable assignments={assignments} onEdit={handleAssignmentsEdit} />
      )}
      <GoogleCalendarButton assignments={assignments} />
    </div>
  );
}

export default App;