// server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Get all skills
app.get('/api/skills', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM skills ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Search skills
app.get('/api/skills/search', async (req, res) => {
    const { term } = req.query;
    try {
        const { rows } = await pool.query(
            'SELECT * FROM skills WHERE name ILIKE $1 OR skill_set ILIKE $1',
            [`%${term}%`]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new skill
app.post('/api/skills', async (req, res) => {
    const { name, skillSet, level } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO skills (name, skill_set, level) VALUES ($1, $2, $3) RETURNING *',
            [name, skillSet, level]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
