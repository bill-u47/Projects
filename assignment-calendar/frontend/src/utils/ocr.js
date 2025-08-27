import Tesseract from "tesseract.js";

// Enhanced OCR with basic error handling & optional progress callback.
export async function performOCR(file, { onProgress } = {}) {
  try {
    const result = await Tesseract.recognize(file, "eng", {
      logger: msg => {
        if (onProgress && msg.status) onProgress(msg);
      }
    });
    return result.data.text || "";
  } catch (err) {
    console.error("OCR failed:", err);
    return ""; // Return empty string so downstream code can handle gracefully
  }
}