// Flexible extractor: matches month/day formats and attaches assignment lines to previous date
const dateRegex = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b|\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/gi;

export function extractCalendarAssignments(ocrText) {
  const lines = ocrText.split('\n').map(l => l.trim()).filter(Boolean);

  const assignments = [];
  let currentDate = null;

  lines.forEach((line) => {
    const dateMatches = [...line.matchAll(dateRegex)];
    if (dateMatches.length > 0) {
      // If this line is ONLY dates (e.g. "August 25 26 27 28 29")
      if (line.replace(dateRegex, '').trim() === '') {
        // Add each date as a new assignment with empty details for now
        dateMatches.forEach(match => {
          assignments.push({
            date: match[0],
            assignments: ''
          });
        });
        // Mark the last date for further assignment lines
        currentDate = assignments.length - 1;
      } else {
        // Line contains both date and assignment
        dateMatches.forEach(match => {
          assignments.push({
            date: match[0],
            assignments: line.replace(match[0], '').trim()
          });
        });
        currentDate = assignments.length - 1;
      }
    } else if (currentDate !== null) {
      // Attach this line to the last seen date's assignment
      assignments[currentDate].assignments += (assignments[currentDate].assignments ? ' | ' : '') + line;
    }
  });

  // Remove any assignment objects with neither date nor assignment line (just in case)
  return assignments.filter(a => a.date || a.assignments);
}