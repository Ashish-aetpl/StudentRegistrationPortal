import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load backend/.env if present (Node 20.12+ built-in, no dotenv needed)
const envPath = path.join(__dirname, '.env');
if (existsSync(envPath)) process.loadEnvFile(envPath);

const PORT = process.env.PORT || 5000;
const DATA_FILE = path.resolve(__dirname, process.env.DATA_FILE || 'registrations.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const MAX_PARTICIPANTS = Number(process.env.MAX_PARTICIPANTS) || 150;
const EVENTS = ['Poster Making', 'Elocution'];
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // admin session: 8 hours

if (!ADMIN_PASSWORD) {
  console.warn('ADMIN_PASSWORD is not set in backend/.env — admin login is disabled.');
}

const app = express();
app.use(cors(process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN.split(',') } : undefined));
app.use(express.json({ limit: '20kb' }));

// =====================================================
// FILE STORAGE
// =====================================================

// Returns [] when the file does not exist yet. A corrupt file throws,
// so we never silently overwrite existing registrations with an empty list.
const readRegistrations = async () => {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    if (!raw.trim()) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
};

// Write to a temp file, then rename over the real one, so a crash
// mid-write can never leave a half-written registrations file.
const writeRegistrations = async (list) => {
  const tmpFile = `${DATA_FILE}.tmp`;
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(tmpFile, JSON.stringify(list, null, 2), 'utf8');

  // On Windows the rename can briefly fail if another program has the file open
  for (let attempt = 1; ; attempt++) {
    try {
      await fs.rename(tmpFile, DATA_FILE);
      return;
    } catch (err) {
      if (!['EPERM', 'EBUSY', 'EACCES'].includes(err.code) || attempt >= 5) throw err;
      await new Promise((r) => setTimeout(r, 50 * attempt));
    }
  }
};

// Run read-modify-write operations one at a time so two simultaneous
// submissions can't overwrite each other.
let writeQueue = Promise.resolve();
const withWriteLock = (task) => {
  const run = writeQueue.then(task, task);
  writeQueue = run.catch(() => { });
  return run;
};

// =====================================================
// VALIDATION
// =====================================================

const calculateCategory = (dob) => {
  const birth = new Date(`${dob}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;

  if (age < 10) return 'Sub Junior (Below 10 years)';
  if (age <= 15) return 'Junior (10 - 15 years)';
  return 'Senior (Above 15 years)';
};

const cleanText = (value) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '');

// Accepts "9876543210", "+91 98765 43210", "098765-43210" → "9876543210"
const normalizePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2)
    : digits.length === 11 && digits.startsWith('0') ? digits.slice(1)
      : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
};

const validateRegistration = (body = {}) => {
  const errors = {};

  const fullName = cleanText(body.fullName);
  if (fullName.length < 2 || fullName.length > 100) {
    errors.fullName = 'Enter the student\'s full name (2–100 characters).';
  }

  // Must be a real calendar date in YYYY-MM-DD form (rejects e.g. 2015-02-30)
  const dob = typeof body.dob === 'string' ? body.dob : '';
  const [year, month, day] = dob.split('-').map(Number);
  const dobDate = new Date(year, month - 1, day);
  const isRealDate = /^\d{4}-\d{2}-\d{2}$/.test(dob)
    && dobDate.getFullYear() === year && dobDate.getMonth() === month - 1 && dobDate.getDate() === day;
  if (!isRealDate) {
    errors.dob = 'Select a valid date of birth.';
  } else if (dobDate > new Date()) {
    errors.dob = 'Date of birth cannot be in the future.';
  }

  const schoolName = cleanText(body.schoolName);
  if (schoolName.length < 2 || schoolName.length > 150) {
    errors.schoolName = 'Enter the school / institution name.';
  }

  const contactNumber = normalizePhone(body.contactNumber);
  if (!contactNumber) {
    errors.contactNumber = 'Enter a valid 10-digit mobile number.';
  }

  const parentNames = (Array.isArray(body.parentNames) ? body.parentNames : [])
    .slice(0, 2)
    .map(cleanText)
    .filter(Boolean);
  if (parentNames.some((name) => name.length > 100)) {
    errors.parentNames = 'Parent / guardian names must be under 100 characters.';
  }

  const participation = [...new Set(Array.isArray(body.participation) ? body.participation : [])]
    .filter((event) => EVENTS.includes(event));
  if (participation.length === 0) {
    errors.participation = 'Select at least one event.';
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    entry: {
      fullName,
      dob,
      category: calculateCategory(dob),
      schoolName,
      contactNumber,
      parentNames,
      participation
    }
  };
};

// =====================================================
// ADMIN AUTH
// =====================================================

const sessions = new Map(); // token -> expiry timestamp
const failedLogins = new Map(); // ip -> { count, resetAt }

const passwordMatches = (input) => {
  // Compare fixed-length hashes so the comparison time doesn't leak anything
  const a = crypto.createHash('sha256').update(String(input || '')).digest();
  const b = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
  return crypto.timingSafeEqual(a, b);
};

const requireAdmin = (req, res, next) => {
  const token = (req.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const expiresAt = sessions.get(token);

  if (!token || !expiresAt || expiresAt < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ success: false, message: 'Admin session expired. Please log in again.' });
  }
  next();
};

app.post('/api/admin/login', (req, res) => {
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({ success: false, message: 'Admin login is not configured on the server.' });
  }

  const ip = req.ip;
  const record = failedLogins.get(ip);
  if (record && record.resetAt > Date.now() && record.count >= 5) {
    return res.status(429).json({ success: false, message: 'Too many failed attempts. Try again in 15 minutes.' });
  }

  if (!passwordMatches(req.body?.password)) {
    const fresh = !record || record.resetAt < Date.now();
    failedLogins.set(ip, {
      count: fresh ? 1 : record.count + 1,
      resetAt: fresh ? Date.now() + 15 * 60 * 1000 : record.resetAt
    });
    return res.status(401).json({ success: false, message: 'Invalid administrator password.' });
  }

  failedLogins.delete(ip);
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  sessions.set(token, expiresAt);

  res.json({ success: true, token, expiresAt });
});

app.post('/api/admin/logout', (req, res) => {
  sessions.delete((req.get('Authorization') || '').replace(/^Bearer\s+/i, ''));
  res.json({ success: true });
});

// =====================================================
// PUBLIC ROUTES
// =====================================================

// Seats remaining (shown on the notice board)
app.get('/api/stats', async (req, res) => {
  try {
    const count = (await readRegistrations()).length;
    res.json({
      success: true,
      data: { count, max: MAX_PARTICIPANTS, remaining: Math.max(MAX_PARTICIPANTS - count, 0), open: count < MAX_PARTICIPANTS }
    });
  } catch (err) {
    console.error('Stats Error:', err);
    res.status(500).json({ success: false, message: 'Could not read registrations.' });
  }
});

app.post('/api/register', async (req, res) => {
  const { entry, errors } = validateRegistration(req.body);
  if (errors) {
    return res.status(400).json({ success: false, message: 'Please correct the highlighted fields.', errors });
  }

  try {
    const saved = await withWriteLock(async () => {
      const list = await readRegistrations();

      if (list.length >= MAX_PARTICIPANTS) {
        return { status: 409, message: `Registration is closed — all ${MAX_PARTICIPANTS} seats are filled.` };
      }

      const duplicate = list.some((r) =>
        r.contactNumber === entry.contactNumber
        && r.dob === entry.dob
        && String(r.fullName).toLowerCase() === entry.fullName.toLowerCase());
      if (duplicate) {
        return { status: 409, message: 'This student is already registered.' };
      }

      const record = {
        id: `REG-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
        ...entry,
        registeredAt: new Date().toISOString()
      };

      list.unshift(record);
      await writeRegistrations(list);
      return { record };
    });

    if (!saved.record) {
      return res.status(saved.status).json({ success: false, message: saved.message });
    }

    res.status(201).json({ success: true, data: saved.record });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ success: false, message: 'Could not save the registration. Please try again.' });
  }
});

// =====================================================
// ADMIN ROUTES
// =====================================================

app.get('/api/registrations', requireAdmin, async (req, res) => {
  try {
    const list = await readRegistrations();
    list.sort((a, b) => String(b.registeredAt).localeCompare(String(a.registeredAt)));
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ success: false, message: 'Could not read registrations.' });
  }
});

// Spreadsheet-safe CSV cell: quote it, and neutralise leading = + - @ (formula injection)
const csvCell = (value) => {
  let text = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

app.get('/api/registrations/export.csv', requireAdmin, async (req, res) => {
  try {
    const list = await readRegistrations();
    const header = ['Registration ID', 'Student Name', 'Date of Birth', 'Category', 'School / Institution',
      'Contact Number', 'Parents / Guardians', 'Events', 'Registered At'];
    const rows = list.map((r) => [
      r.id, r.fullName, r.dob, r.category, r.schoolName, r.contactNumber,
      r.parentNames || r.guardians || [], r.participation || [], r.registeredAt
    ].map(csvCell).join(','));

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="registrations.csv"');
    // BOM so Excel opens UTF-8 names correctly
    res.send('﻿' + [header.map(csvCell).join(','), ...rows].join('\r\n'));
  } catch (err) {
    console.error('Export Error:', err);
    res.status(500).json({ success: false, message: 'Could not export registrations.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Saving registrations to ${DATA_FILE}`);
});
