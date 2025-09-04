require('dotenv').config();
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(express.static('.'));
app.use(express.json());

const SUPABASE_URL = 'https://fjwpfesqfwtozaciphnc.supabase.co/functions/v1';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqd3BmZXNxZnd0b3phY2lwaG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Nzg5NDksImV4cCI6MjA3MjU1NDk0OX0.4JaHGc5ISuk7IywOeEbuaHGMBFMLJo3uK2MLFF8S6BE';

app.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    const text = (pdfData.text || '').slice(0, 12000);
    const profile = req.body.profile || 'Ukendt profil';

    const response = await fetch(`${SUPABASE_URL}/forslag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({ text, profile })
    });

    const data = await response.json();
    fs.unlink(req.file.path, () => {});
    res.json({ suggestion: data.suggestion || '' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Kunne ikke generere forslag.' });
  }
});

app.post('/summary', upload.single('pdf'), async (req, res) => {
  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    const text = (pdfData.text || '').slice(0, 12000);

    const response = await fetch(`${SUPABASE_URL}/opsummering`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({ text })
    });

    const data = await response.json();
    fs.unlink(req.file.path, () => {});
    res.json({ summary: data.summary || '' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Kunne ikke opsummere.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('✅ Server kører på port ' + PORT));