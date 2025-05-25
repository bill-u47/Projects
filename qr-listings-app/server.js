const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('db.sqlite');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('views', './views');
app.set('view engine', 'ejs');

// DB setup
db.run(`
  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    make TEXT,
    model TEXT,
    year INTEGER,
    features TEXT
  )
`);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/form.html'));
});

app.post('/submit', (req, res) => {
  const { make, model, year, features } = req.body;
  db.run(
    `INSERT INTO listings (make, model, year, features) VALUES (?, ?, ?, ?)`,
    [make, model, year, features],
    function (err) {
      if (err) return res.status(500).send("DB error");
      const id = this.lastID;
      const url = `http://localhost:3000/listing/${id}`;
      QRCode.toDataURL(url, (err, qr) => {
        if (err) return res.status(500).send("QR error");
        res.send(`<p>Listing created! Scan QR:</p><img src="${qr}"><br><a href="${url}">${url}</a>`);
      });
    }
  );
});

app.get('/listing/:id', (req, res) => {
  db.get(`SELECT * FROM listings WHERE id = ?`, [req.params.id], (err, row) => {
    if (!row) return res.status(404).send("Not found");
    res.sendFile(path.join(__dirname, '/public/listing.html'));
  });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
