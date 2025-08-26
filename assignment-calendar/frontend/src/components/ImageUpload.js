import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

function ImageUpload({ onOcrComplete }) {
  const [loading, setLoading] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert("Please upload a valid image file (JPG, PNG, BMP, etc.). PDFs are not supported.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLoading(true);
      Tesseract.recognize(reader.result, 'eng', { logger: m => {} })
        .then(({ data: { text } }) => {
          setLoading(false);
          onOcrComplete(text);
        })
        .catch(err => {
          setLoading(false);
          alert("OCR failed: " + err.message);
        });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <input type="file" accept="image/*" onChange={handleImage} />
      {loading && <p>Extracting text with OCR...</p>}
    </div>
  );
}

export default ImageUpload;