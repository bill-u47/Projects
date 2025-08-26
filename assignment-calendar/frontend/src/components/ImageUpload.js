import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

function ImageUpload({ onOcrComplete }) {
  const [loading, setLoading] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    Tesseract.recognize(file, 'eng', { logger: m => {} })
      .then(({ data: { text } }) => {
        setLoading(false);
        onOcrComplete(text);
      });
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <input type="file" accept="image/*,application/pdf" onChange={handleImage} />
      {loading && <p>Extracting text with OCR...</p>}
    </div>
  );
}

export default ImageUpload;