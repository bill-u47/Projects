# Assignment Calendar Project

A free, open-source solution to extract assignments from schedule images and add them to Google Calendar.

## Features

- Upload schedule images (PDF/images)
- Extract assignments and due dates using Tesseract.js + Regex
- Review and edit assignments
- Add assignments to Google Calendar (OAuth2, free tier)

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Setup

#### 1. Backend

```bash
cd backend
npm install
npm run dev
```

- Configure Google OAuth in `backend/googleAuth.js` (see comments for setup)

#### 2. Frontend

```bash
cd frontend
npm install
npm start
```

#### 3. Google OAuth Setup

- Create a Google Cloud project
- Enable Calendar API
- Set OAuth2 credentials (redirect URI: `http://localhost:5000/auth/google/callback`)
- Paste credentials in `backend/googleAuth.js`

---

## How it Works

1. Upload your schedule image.
2. OCR & regex extract assignment names + dates.
3. Review/edit extracted data in a table.
4. Sign in with Google.
5. Add events to your Google Calendar.

---

## Customization

- Tweak `frontend/src/utils/assignmentParser.js` for your school’s format.
- Adjust frontend UI as needed.
- Fork, star, and contribute!

---