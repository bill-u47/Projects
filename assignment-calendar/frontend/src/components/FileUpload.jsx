import React, { useState } from "react";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/gif",
  "image/bmp",
  "image/webp",
];

export default function FileUpload({ onFileUpload }) {
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Invalid file type. Please upload an image file (no PDFs).");
      return;
    }

    setError("");
    onFileUpload(file);
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ marginBottom: 8 }}
      />
      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
    </div>
  );
}