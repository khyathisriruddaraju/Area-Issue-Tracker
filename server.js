/**
 * server.js
 * Backend API for Area Issue Tracker
 * Using Express to provide REST APIs for issue reporting and management
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

// PostgreSQL pool setup (update with your credentials)
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'postgres',
  port: 5432,
});


const issuesFilePath = path.join(__dirname, 'issues.json');

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files from public directory and root for html pages
app.use(express.static('public'));
app.use(express.static('.'));

// Helper function to read issues from issues.json
function readIssues() {
  try {
    const data = fs.readFileSync(issuesFilePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading issues.json:', err);
    return [];
  }
}

// Helper function to write issues to issues.json
function writeIssues(issues) {
  try {
    fs.writeFileSync(issuesFilePath, JSON.stringify(issues, null, 2));
  } catch (err) {
    console.error('Error writing issues.json:', err);
  }
}

// GET /issues - Get all reported issues
app.get('/issues', (req, res) => {
  const issues = readIssues();
  res.json(issues);
});

// GET /issues - Get all reported issues from PostgreSQL
app.get('/v2/issues', async (req, res) => {
  console.log('test');
  try {
    const result = await pool.query('SELECT * FROM issues ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching issues:', err);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// POST /issues - Create a new issue report
app.post('/issues', (req, res) => {
  const issues = readIssues();    

  const { title, description, area, reporter, type } = req.body;

  if (!title || !description || !area || !reporter || !type) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  // Create new issue object
  const newIssue = {
    id: Date.now().toString(),  // unique id based on timestamp
    title,
    description,
    area,
    reporter,
    type,
    status: 'Pending',  // Default status
    createdAt: new Date().toISOString()
  };

  issues.push(newIssue);
  writeIssues(issues);

  res.status(201).json(newIssue);
});

// PUT /issues/:id - Update issue status by ID (e.g. mark resolved)
app.put('/issues/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Missing status field.' });
  }

  const issues = readIssues();

  const issueIndex = issues.findIndex(i => i.id === id);
  if (issueIndex === -1) {
    return res.status(404).json({ message: 'Issue not found.' });
  }

  issues[issueIndex].status = status;
  issues[issueIndex].updatedAt = new Date().toISOString();

  writeIssues(issues);
  res.json(issues[issueIndex]);
});

// Start server
app.listen(PORT, () => {
  console.log(`Area Issue Tracker backend running at http://localhost:${PORT}`);
});

