
const express = require('express');

const {
  protect,
  authorize,
} = require('../middleware/authMiddleware');

const {
  addBook,
  getBooks,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');

const router = express.Router();

// All Book Management APIs require Librarian access.
router.use(protect, authorize('Librarian'));

// Add a new book copy.
router.post('/', addBook);

// View and search books.
router.get('/', getBooks);

// Update an existing book.
router.put('/:id', updateBook);

// Delete an existing book.
router.delete('/:id', deleteBook);

module.exports = router;
