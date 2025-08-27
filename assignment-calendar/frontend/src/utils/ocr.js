import Tesseract from "tesseract.js";

export async function performOCR(file) {
  const result = await Tesseract.recognize(file, "eng");
  return result.data.text;
}