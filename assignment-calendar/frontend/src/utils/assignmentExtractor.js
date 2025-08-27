export function extractAssignments(text) {
  const lines = text.split('\n').map(l => l.trim());

  // Helper: Looks like a valid assignment?
  function isLikelyAssignment(line) {
    // Too short or empty
    if (!line || line.length < 8) return false;
    // Mostly numbers, single letters, or week/day numbers
    if (/^\d+\s*$/.test(line)) return false;
    if (/^[A-Z]{1,3}$/.test(line)) return false;
    // Looks like a date (e.g. "August 25")
    if (/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/.test(line)) return false;
    // Looks like a week (e.g. "Week 2")
    if (/Week\s*\d+/i.test(line)) return false;
    // Looks like "No Classes", "Autumn Break", etc. (can keep or skip, your choice)
    if (/No Classes|Break/i.test(line)) return false;
    // Otherwise, it's likely an assignment
    return true;
  }

  // Date regex to store context
  const dateRegex = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/;
  let currentDate = "";
  let assignments = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // If line is a date, update context
    if (dateRegex.test(line)) {
      currentDate = line.match(dateRegex)[0];
      continue;
    }
    // If line is likely an assignment, save it
    if (isLikelyAssignment(line)) {
      assignments.push({
        name: line,
        date: currentDate,
        notes: ""
      });
    }
  }

  // Remove duplicates
  const seen = new Set();
  assignments = assignments.filter(a => {
    const key = a.name + "|" + a.date;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return assignments;
}