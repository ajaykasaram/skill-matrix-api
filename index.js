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

// Get all employee skills
app.get('/api/matrix', async (req, res) => {
  try {
    const query = `
      SELECT 
        e.name as employee_name,
        s.name as skill_set,
        sl.name as level
      FROM employees e
      JOIN employee_skills es ON e.id = es.employee_id
      JOIN skills s ON s.id = es.skill_id
      JOIN skill_levels sl ON sl.id = es.skill_level_id
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new employee skill
app.post('/api/matrix', async (req, res) => {
  const { name, skillSet, level } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get or create employee
    let employeeResult = await client.query(
      'INSERT INTO employees (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
      [name]
    );
    const employeeId = employeeResult.rows[0].id;
    
    // Get or create skill
    let skillResult = await client.query(
      'INSERT INTO skills (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
      [skillSet]
    );
    const skillId = skillResult.rows[0].id;
    
    // Get or create skill level
    let levelResult = await client.query(
      'INSERT INTO skill_levels (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
      [level]
    );
    const levelId = levelResult.rows[0].id;
    
    // Create employee skill mapping
    await client.query(
      'INSERT INTO employee_skills (employee_id, skill_id, skill_level_id) VALUES ($1, $2, $3)',
      [employeeId, skillId, levelId]
    );
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
