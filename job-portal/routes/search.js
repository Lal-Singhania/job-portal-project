import express from 'express';
import db from '../config/dbclient.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', isAuthenticated, async (req, res) => {
  try {
    const searchTerm = req.query.q || ''; // e.g., "web dev"

    const query = `
      SELECT * FROM jobs 
      WHERE title ILIKE $1 OR description ILIKE $1
    `;
    const values = [`%${searchTerm}%`];

    const result = await db.query(query, values);
    const jobs = result.rows;

    res.render('all-jobs', {
      jobs,
      searchTerm
    });

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).send('Server Error');
  }
});

export default router;
