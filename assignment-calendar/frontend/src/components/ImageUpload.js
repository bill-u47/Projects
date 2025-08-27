import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import { extractCalendarAssignments } from '../utils/calendarExtractor';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// Set PDF.js worker using CDN for compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function ImageUpload({ onOcrComplete, onCalendarExtracted }) {
  const [loading, setLoading] = useState(false);

  // OCR helper
  const ocrImage = async (imgDataUrl) => {
    const { data: { text } } = await Tesseract.recognize(imgDataUrl, 'eng', { logger: m => {} });
    console.log("OCR TEXT:", text); // Debug
    return text;
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);

    try {
      let fullText = '';

      if (file.type === "application/pdf") {
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
          console.log("PDF OCR TEXT:", fullText); // Debug
          const calendar = extractCalendarAssignments(fullText);
          console.log("EXTRACTED ASSIGNMENTS:", calendar); // Debug
          if (calendar.length && onCalendarExtracted) {
            onCalendarExtracted(calendar);
          } else if (onOcrComplete) {
            onOcrComplete(fullText);
          }
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async function () {
          fullText = await ocrImage(reader.result);
          setLoading(false);
          console.log("Image OCR TEXT:", fullText); // Debug
          const calendar = extractCalendarAssignments(fullText);
          console.log("EXTRACTED ASSIGNMENTS:", calendar); // Debug
          if (calendar.length && onCalendarExtracted) {
            onCalendarExtracted(calendar);
          } else if (onOcrComplete) {
            onOcrComplete(fullText);
          }
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