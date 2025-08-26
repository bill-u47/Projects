import chrono from 'chrono-node';

// Regex to match patterns like "August 25", "September 1", etc.
const dateRegex = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b/g;

/**
 * Extracts date-assignment pairs from OCR text.
 * Returns an array of objects: { date, assignments }
 */
export function extractCalendarAssignments(ocrText) {
  // Find all date positions
  const matches = [...ocrText.matchAll(dateRegex)];
  if (matches.length === 0) return [];

  // Split text into blocks by date
  const sections = ocrText.split(dateRegex);

  const results = [];
  for (let i = 0; i < matches.length; ++i) {
    const dateStr = matches[i][0];
    const content = sections[i + 1] ? sections[i + 1].trim() : '';
    // Parse date for this academic year
    const parsedDate = chrono.parseDate(dateStr + ' 2025');
    results.push({
      date: parsedDate ? parsedDate.toISOString().slice(0, 10) : dateStr,
      assignments: content.replace(/\n+/g, ' ').trim(),
    });
  }
  return results;
}