/**
 * Universal Academic Calendar OCR Extractor
 *
 * Goals:
 *  - Generalize across different calendar layouts, month spans, grid formats
 *  - Configurable phrase stripping vs classification
 *  - Flexible week distribution strategies
 *  - Structured tagging/classification
 *  - Extensible via mini "plugins"
 *
 * Usage:
 *   import { extractAssignmentsUniversal } from './assignmentExtractor';
 *   const { assignments, debug } = extractAssignmentsUniversal(ocrText, {
 *      includeHolidays: true,
 *      distribution: 'HYBRID'
 *   });
 *
 * Default remains compatible with your current calendar.
 */

//////////////////////////
// Configuration & Types
//////////////////////////

/**
 * Distribution strategies:
 *  STICKY      - All lines after a week grid stay on the currently pointed day unless pipes '|' cause advancement.
 *  PIPE_SPLIT  - Only pipe segments advance (default similar to current).
 *  ROUND_ROBIN - Every non-empty logical segment advances to the next day cyclically.
 *  HYBRID      - If a line has >=2 separators (pipes or strong splits) use PIPE_SPLIT advancement; else STICKY.
 */
const DISTRIBUTION_STRATEGIES = ['STICKY', 'PIPE_SPLIT', 'ROUND_ROBIN', 'HYBRID'];

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  debug: false,
  logToConsole: false,
  includeHolidays: true,
  includeAdministrative: true,
  includeEmptyDays: false,
  distribution: 'PIPE_SPLIT', // 'STICKY' | 'PIPE_SPLIT' | 'ROUND_ROBIN' | 'HYBRID'
  advanceOnPlainLineIfAlone: false, // helps in layouts with one line per column but no pipes
  clampSegments: true,

  // Recognize month names (English)
  months: [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ],

  // Phrases to classify (NOT just strip)
  holidayPatterns: [
    /Labor Day/i,
    /Autumn Break/i,
    /\b(No Classes?)\b/i,
    /Spring Break/i,
    /Thanksgiving/i
  ],
  adminPatterns: [
    /Last day to drop/i,
    /First day of Classes/i,
    /Final Exam/i,
    /Midterm\s*\d?/i,
    /Exam\b/i
  ],
  assessmentPatterns: [
    /\bCI:\s*Week\s*\d+/i,
    /Comp Test/i,
    /Midterm/i,
    /\bdue\b/i
  ],
  homeworkPatterns: [
    /\bHW:\s*/i
  ],
  worksheetPatterns: [
    /Worksheet:/i
  ],
  // Lecture / Topic patterns (applied after others)
  // (Leave empty for fallback classification)

  // Tokens that often imply separators if OCR lost pipes
  softSplitMarkers: [
    ' HW:', ' CI:', ' Worksheet:', 'Review', 'Applied', 'An Application'
  ],

  // Characters considered hard separators
  hardSeparators: ['|', '•', '·', '‧', '‖'],

  // Plugins (optional)
  plugins: {
    preNormalize: [],
    postLineTokenize: [],
    preBucketDistribution: [],
    postBucketDistribution: [],
    postClassification: []
  }
};

//////////////////////////
// Utility Functions
//////////////////////////

function createMonthIndex(months) {
  return months.reduce((acc, m, i) => {
    acc[m.toLowerCase()] = i;
    return acc;
  }, {});
}

function pad2(n){ return String(n).padStart(2,'0'); }
function isoDate(y,mIdx,d){ return `${y}-${pad2(mIdx+1)}-${pad2(d)}`; }

function detectYear(text) {
  const m = text.match(/\b(20\d{2})\b/);
  return m ? parseInt(m[1],10) : new Date().getFullYear();
}

function cleanRawLines(text) {
  return text
    .split(/\r?\n/)
    .map(l => l.replace(/\s+/g,' ').trim())
    .filter(l => l.length);
}

function isNumberToken(t){ return /^\d{1,2}$/.test(t); }
function isPureDaySequence(line) {
  return /^(\d{1,2})(\s+\d{1,2})+$/.test(line.trim());
}
function looksLikeGridNoise(line) {
  const tokens = line.split(/\s+/);
  const numeric = tokens.filter(isNumberToken);
  return numeric.length >= 3 && numeric.length / tokens.length >= 0.6;
}

function stripEdgePipes(l){
  return l.replace(/^\|+|\|+$/g,'').trim();
}

function softSplitInject(line, config) {
  let mutated = line;
  config.softSplitMarkers.forEach(marker => {
    // Insert a sentinel if marker occurs not at start
    mutated = mutated.replace(new RegExp(`(?!^)${escapeReg(marker)}`,'g'), ' §SPLIT§ ' + marker.trim());
  });
  return mutated;
}
function escapeReg(s){
  return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
}

function splitHard(line, config) {
  const sepRegex = new RegExp(`[${config.hardSeparators.map(c=>escapeReg(c)).join('')}]`,'g');
  return line.split(sepRegex).map(s=>s.trim()).filter(Boolean);
}

//////////////////////////
// Classification
//////////////////////////

function classifyItem(text, config) {
  const t = text;
  const matchArray = (patterns) => patterns.some(rx => rx.test(t));
  if (matchArray(config.holidayPatterns)) return 'Holiday';
  if (matchArray(config.adminPatterns)) return 'Administrative';
  if (matchArray(config.assessmentPatterns)) return 'Assessment';
  if (matchArray(config.homeworkPatterns)) return 'Homework';
  if (matchArray(config.worksheetPatterns)) return 'Worksheet';
  // Fallback heuristics
  if (/Worksheet/i.test(t)) return 'Worksheet';
  if (/HW:/i.test(t)) return 'Homework';
  if (/CI:\s*Week/i.test(t)) return 'Assessment';
  return 'Lecture';
}

//////////////////////////
// Distribution Logic
//////////////////////////

function distributeSegments(segments, context, config, debugTrail) {
  // segments: array of candidate strings (already trimmed)
  const results = [];
  const days = context.weekDays || [];
  if (!days.length) {
    // no week grid context: put everything on current anchor date
    segments.forEach(seg => {
      if (seg) {
        results.push({ date: context.currentDate, text: seg });
      }
    });
    return results;
  }

  let ptr = context.weekPtr ?? 0;
  const strategy = config.distribution;

  const advance = () => {
    if (ptr < days.length - 1) ptr++;
  };

  const place = (seg, forcedDayIdx=null) => {
    const idx = forcedDayIdx !== null ? forcedDayIdx : ptr;
    const dateISO = days[idx];
    results.push({ date: dateISO, text: seg });
  };

  const hasPipes = context.currentRawLine.includes('|');

  switch (strategy) {
    case 'STICKY':
      segments.forEach(seg => {
        place(seg);
        if (hasPipes) advance(); // only advance when pipes present
      });
      break;
    case 'PIPE_SPLIT':
      segments.forEach(seg => {
        place(seg);
        advance();
      });
      break;
    case 'ROUND_ROBIN':
      segments.forEach(seg => {
        place(seg);
        advance();
        if (ptr === days.length - 1) {
          // Optional: wrap? For now stop advancing at last day.
        }
      });
      break;
    case 'HYBRID':
      // If we have >1 segment and pipes were present treat like PIPE_SPLIT; else STICKY
      if (hasPipes && segments.length > 1) {
        segments.forEach(seg => {
          place(seg);
          advance();
        });
      } else {
        segments.forEach(seg => {
          place(seg);
          // no advance
        });
      }
      break;
    default:
      // fallback: PIPE_SPLIT
      segments.forEach(seg => {
        place(seg);
        advance();
      });
  }

  context.weekPtr = ptr; // persist pointer
  if (debugTrail) {
    results.forEach(r => debugTrail.push({ phase: 'distribute', strategy, line: context.currentRawLine, segment: r.text, date: r.date }));
  }
  return results;
}

//////////////////////////
// Extraction Main
//////////////////////////

export function extractAssignmentsUniversal(rawText, options = {}) {
  const config = {
    ...DEFAULT_CONFIG,
    ...options,
    distribution: options.distribution || DEFAULT_CONFIG.distribution
  };
  if (!DISTRIBUTION_STRATEGIES.includes(config.distribution)) {
    config.distribution = DEFAULT_CONFIG.distribution;
  }
  const debugTrail = [];
  const monthIndex = createMonthIndex(config.months);

  const year = detectYear(rawText);
  const lines = cleanRawLines(rawText).map(stripEdgePipes);

  let currentMonth = null;
  let currentDay = null;
  let currentDate = null;

  // Week context
  let weekDays = [];     // array of ISO dates for the current grid
  let weekPtr = 0;

  // day -> array of raw content strings
  const dayBuckets = new Map();

  // Utility ensure bucket
  const ensureBucket = (dateISO) => {
    if (!dayBuckets.has(dateISO)) dayBuckets.set(dateISO, []);
  };

  const logDebug = (obj) => {
    if (config.debug) debugTrail.push(obj);
    if (config.logToConsole) console.log(obj);
  };

  for (const rawLineOriginal of lines) {
    if (!rawLineOriginal) continue;

    let rawLine = rawLineOriginal;

    // Detect bridge or month + day start
    let bridgeMonth = null;
    let bridgeDays = [];

    // Pattern: Month followed by at least one day number
    const monthDayStart = rawLine.match(new RegExp(`^(${config.months.join('|')})\\s+(\\d{1,2})(.*)$`, 'i'));
    if (monthDayStart) {
      const monthName = monthDayStart[1];
      const firstDay = parseInt(monthDayStart[2],10);
      let remainder = monthDayStart[3].trim();
      currentMonth = monthIndex[monthName.toLowerCase()];
      currentDay = firstDay;
      currentDate = isoDate(year, currentMonth, currentDay);

      // Collect additional day numbers at start of remainder
      const daySeqMatch = remainder.match(/^((\d{1,2}\s+){1,}\d{1,2})/);
      let additionalDays = [];
      if (daySeqMatch) {
        additionalDays = daySeqMatch[0].trim().split(/\s+/).map(n=>parseInt(n,10));
        remainder = remainder.slice(daySeqMatch[0].length).trim();
      }
      // Initialize weekDays grid
      weekDays = [currentDate];
      additionalDays.forEach(d => {
        weekDays.push(isoDate(year, currentMonth, d));
      });
      weekPtr = 0;
      ensureBucket(currentDate);
      additionalDays.forEach(d => ensureBucket(isoDate(year, currentMonth, d)));

      logDebug({ phase: 'anchor-month', line: rawLineOriginal, month: monthName, firstDay, additionalDays, weekDays: [...weekDays] });

      if (!remainder) continue;
      rawLine = remainder;
    } else if (isPureDaySequence(rawLine) && currentMonth !== null) {
      // New week grid without month
      const dayNums = rawLine.split(/\s+/).map(n=>parseInt(n,10));
      weekDays = dayNums.map(d => {
        ensureBucket(isoDate(year, currentMonth, d));
        return isoDate(year, currentMonth, d);
      });
      weekPtr = 0;
      currentDay = dayNums[0];
      currentDate = weekDays[0];
      logDebug({ phase: 'week-grid', line: rawLineOriginal, weekDays: [...weekDays] });
      continue;
    } else {
      // Bridge line like "29 30 October 1 2 3"
      const tokens = rawLine.split(/\s+/);
      const monthPos = tokens.findIndex(t => monthIndex.hasOwnProperty(t.toLowerCase()));
      if (monthPos !== -1) {
        const before = tokens.slice(0, monthPos).filter(isNumberToken).map(n=>parseInt(n,10));
        const newMonthName = tokens[monthPos];
        const after = tokens.slice(monthPos+1).filter(isNumberToken).map(n=>parseInt(n,10));
        if ((before.length || after.length) && currentMonth !== null) {
          // finalize previous month last day
          before.forEach(d => {
            ensureBucket(isoDate(year, currentMonth, d));
          });
        }
        bridgeMonth = monthIndex[newMonthName.toLowerCase()];
        bridgeDays = after;
        if (bridgeMonth !== null) {
          currentMonth = bridgeMonth;
          if (after.length) {
            currentDay = after[0];
            currentDate = isoDate(year, currentMonth, currentDay);
          }
          // set new week grid if 'after' length > 1
          if (after.length > 1) {
            weekDays = after.map(d => {
              const dateISO = isoDate(year, currentMonth, d);
              ensureBucket(dateISO);
              return dateISO;
            });
            weekPtr = 0;
          }
          logDebug({ phase: 'bridge', line: rawLineOriginal, bridgeMonth: newMonthName, afterDays: after, weekDays: [...weekDays] });
          continue;
        }
      }
    }

    // At this point rawLine holds content (maybe containing days but not anchor)
    // Strip classification phrases but keep them if config wants them
    const classificationPreserve = [];

    const stripIf = (patterns, typeLabel) => {
      patterns.forEach(rx => {
        rawLine = rawLine.replace(rx, (m) => {
          classificationPreserve.push({ text: m.trim(), type: typeLabel });
          return ' ';
        });
      });
    };

    // We only pre-extract holidays/admin if we plan to include them; else treat them as hidden
    if (config.includeHolidays) stripIf(config.holidayPatterns, 'Holiday');
    if (config.includeAdministrative) stripIf(config.adminPatterns, 'Administrative');

    rawLine = rawLine.replace(/\s+/g,' ').trim();
    if (!rawLine && classificationPreserve.length === 0) continue;

    // Split by hard separators first
    let segments = [];
    if (rawLine) {
      const hardSplit = splitHard(softSplitInject(rawLine, config), config)
        .flatMap(seg => seg.split(/§SPLIT§/))
        .map(s => s.trim())
        .filter(Boolean);

      // If no hard splits, keep rawLine as single segment
      segments = hardSplit.length ? hardSplit : [rawLine];
    }

    // Expand classification preserved items as their own segments (ensures they get date)
    classificationPreserve.forEach(cp => segments.unshift(`[${cp.type}] ${cp.text}`));

    // If we have a week grid, decide distribution
    let distributed;
    const context = {
      weekDays,
      weekPtr,
      currentDate: currentDate || (currentMonth != null && currentDay != null ? isoDate(year, currentMonth, currentDay) : null),
      currentRawLine: rawLineOriginal
    };

    // Secondary splitting inside each segment: break "HW: A HW: B" etc.
    const finalSegments = [];
    segments.forEach(seg => {
      // Additional splits for multiple HW or CI occurrences
      seg.split(/(?=HW:\s)|(?=CI:\s*Week\s*\d+)/i).forEach(part => {
        const trimmed = part.trim();
        if (trimmed) finalSegments.push(trimmed);
      });
    });

    // Distribution
    if (weekDays.length && finalSegments.length) {
      distributed = distributeSegments(
        finalSegments,
        context,
        config,
        debugTrail
      );
      weekPtr = context.weekPtr;
    } else {
      distributed = (finalSegments.length ? finalSegments : segments).map(seg => ({
        date: context.currentDate,
        text: seg
      }));
    }

    // Store in buckets
    distributed.forEach(({ date, text }) => {
      if (!date) {
        // If no date context, skip (or could buffer)
        logDebug({ phase: 'no-date-skip', line: rawLineOriginal, segment: text });
        return;
      }
      ensureBucket(date);
      dayBuckets.get(date).push(text);
      logDebug({ phase: 'bucket-add', date, segment: text });
    });
  }

  // Build assignment objects
  const assignments = [];
  dayBuckets.forEach((segments, date) => {
    if (!segments.length && !config.includeEmptyDays) return;
    segments.forEach(seg => {
      const name = seg.replace(/\s+/g,' ').trim();
      if (!name) return;
      const type = classifyItem(name, config);
      if ((type === 'Holiday' && !config.includeHolidays) ||
          (type === 'Administrative' && !config.includeAdministrative)) {
        return;
      }
      assignments.push({
        name,
        date,
        type
      });
    });
  });

  // Deduplicate
  const seen = new Set();
  const deduped = [];
  assignments.forEach(a => {
    const key = `${a.date}|${a.name.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(a);
  });

  // Sort
  deduped.sort((a,b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

  if (config.debug && config.logToConsole) {
    console.log('=== UNIVERSAL EXTRACT DEBUG TRAIL ===');
    console.table(debugTrail);
    console.log('=== UNIVERSAL ASSIGNMENTS ===');
    console.table(deduped);
  }

  return {
    assignments: deduped,
    debug: config.debug ? debugTrail : undefined,
    meta: {
      year,
      strategy: config.distribution
    }
  };
}

//////////////////////////
// Backward Compatible Export
//////////////////////////

// If existing code imports { extractAssignments }, keep an alias
export function extractAssignments(text) {
  return extractAssignmentsUniversal(text, { debug: false }).assignments;
}