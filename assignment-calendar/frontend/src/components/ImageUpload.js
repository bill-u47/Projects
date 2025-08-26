import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import { extractCalendarAssignments } from '../utils/calendarExtractor';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import 'pdfjs-dist/build/pdf.worker.entry';

function ImageUpload({ onCalendarExtracted }) {
  const [loading, setLoading] = useState(false);

  // Helper to OCR an image
  const ocrImage = async (imgDataUrl) => {
    const { data: { text } } = await Tesseract.recognize(imgDataUrl, 'eng', { logger: m => {} });
    return text;
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    try {
      let fullText = '';

      if (file.type === "application/pdf") {
        // PDF: process all pages
        const reader = new FileReader();
        reader.onload = async function () {
          const typedarray = new Uint8Array(this.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;
            const imgDataUrl = canvas.toDataURL();
            fullText += await ocrImage(imgDataUrl) + '\n';
          }
          setLoading(false);
          const calendar = extractCalendarAssignments(fullText);
          onCalendarExtracted(calendar);
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      if (file.type.startsWith('image/')) {
        // Image
        const reader = new FileReader();
        reader.onload = async function () {
          fullText = await ocrImage(reader.result);
          setLoading(false);
          const calendar = extractCalendarAssignments(fullText);
          onCalendarExtracted(calendar);
        };
        reader.readAsDataURL(file);
        return;
      }

      setLoading(false);
      alert("Please upload a valid image or PDF file.");
    } catch (err) {
      setLoading(false);
      alert("Error during extraction: " + err.message);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*,application/pdf" onChange={handleFile} />
      {loading && <p>Extracting calendar... Please wait.</p>}
    </div>
  );
}

export default ImageUpload;