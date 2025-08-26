// Example regex for your schedule format. Tweak as needed!
export function parseAssignments(text) {
  const lines = text.split('\n');
  const assignments = [];
  const datePattern = /([A-Za-z]+ \d{1,2})/; // e.g., September 29
  const hwPattern = /(HW: [A-Z ,]+|Worksheet: [A-Z, ]+|Midterm \d|Final Exam|Comp Test)/i;

  let currentDate = null;
  for (const line of lines) {
    const dateMatch = datePattern.exec(line);
    if (dateMatch) {
      currentDate = dateMatch[0];
      continue; // skip to next line for assignments
    }

    const hwMatch = hwPattern.exec(line);
    if (hwMatch && currentDate) {
      // Try to parse date to yyyy-mm-dd:
      let date = new Date(`${currentDate}, 2025`);
      if (!isNaN(date)) {
        date = date.toISOString().slice(0, 10);
      } else {
        date = '';
      }
      assignments.push({
        name: hwMatch[0],
        date,
        notes: ''
      });
    }
  }
  return assignments;
}