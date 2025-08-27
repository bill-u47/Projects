// A simple fallback parser for OCR text
export function parseAssignments(text) {
  // Example: split by line, look for "due" or date patterns
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const results = [];
  lines.forEach(line => {
    // Example: look for MM/DD or Month DD
    const dateMatch = line.match(/(\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b|\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b)/);
    if (dateMatch) {
      results.push({
        dueDate: dateMatch[0],
        description: line.replace(dateMatch[0], '').trim(),
      });
    }
  });
  return results;
}