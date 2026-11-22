
const Book = require('../models/Book');
const BorrowingTransaction = require('../models/BorrowingTransaction');

// Escape special characters used in regular expressions.
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/books
// Librarian: Add a physical book copy.
const addBook = async (req, res) => {
  try {
    const {
      isbn,
      title,
      author,
      genre,
      publicationYear,
      description,
      availabilityStatus,
    } = req.body;

    if (
      typeof isbn !== 'string' || !isbn.trim() ||
      typeof title !== 'string' || !title.trim() ||
      typeof author !== 'string' || !author.trim() ||
      typeof genre !== 'string' || !genre.trim() ||
      publicationYear === undefined ||
      publicationYear === null ||
      publicationYear === ''
    ) {
      return res.status(400).json({
        message: 'Please provide all required book fields',
      });
    }

    const book = await Book.create({
      isbn,
      title,
      author,
      genre,
      publicationYear,
      description,
      availabilityStatus: availabilityStatus || 'Available',
    });

    return res.status(201).json({
      message: 'Book added successfully',
      book,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Duplicate book identifier',
      });
    }

    if (
      error.name === 'ValidationError' ||
      error.name === 'CastError'
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error('Add book error:', error);
    return res.status(500).json({
      message: 'Server error while adding book',
    });
  }
};

// GET /api/books?search=...
// Librarian: View and search books.
const getBooks = async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();

    if (search.length > 100) {
      return res.status(400).json({
        message: 'Search text must be 100 characters or fewer',
      });
    }

    const filter = search
      ? {
          $or: ['title', 'author', 'isbn', 'bookCopyID'].map(
            (field) => ({
              [field]: {
                $regex: escapeRegex(search),
                $options: 'i',
              },
            })
          ),
        }
      : {};

    const books = await Book.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(100);

    return res.status(200).json(books);
  } catch (error) {
    console.error('Get books error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve books',
    });
  }
};

// PUT /api/books/:id
// Librarian: Update book details.
const updateBook = async (req, res) => {
  try {
    const allowedFields = [
      'isbn',
      'title',
      'author',
      'genre',
      'publicationYear',
      'description',
      'availabilityStatus',
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'No valid fields provided for update',
      });
    }

    for (const field of ['isbn', 'title', 'author', 'genre']) {
      if (
        Object.prototype.hasOwnProperty.call(updates, field) &&
        (typeof updates[field] !== 'string' || !updates[field].trim())
      ) {
        return res.status(400).json({
          message: `${field} is required`,
        });
      }
    }

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        message: 'Book not found',
      });
    }

    // Prevent manual availability changes while a borrowing
    // request or loan is active.
    if (
      Object.prototype.hasOwnProperty.call(
        updates,
        'availabilityStatus'
      )
    ) {
      const activeRequest = await BorrowingTransaction.exists({
        bookCopyID: book.bookCopyID,
        status: { $in: ['Pending', 'Approved'] },
      });

      if (activeRequest) {
        return res.status(409).json({
          message:
            'Cannot manually change availability while a borrowing request or loan is active',
        });
      }
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedBook) {
      return res.status(404).json({
        message: 'Book not found',
      });
    }

    return res.status(200).json({
      message: 'Book updated successfully',
      book: updatedBook,
    });
  } catch (error) {
    if (
      error.name === 'ValidationError' ||
      error.name === 'CastError'
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Duplicate book identifier',
      });
    }

    console.error('Update book error:', error);
    return res.status(500).json({
      message: 'Failed to update book',
    });
  }
};

// DELETE /api/books/:id
// Librarian: Delete a book with no borrowing history.
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        message: 'Book not found',
      });
    }

    if (book.availabilityStatus === 'Borrowed') {
      return res.status(409).json({
        message: 'Cannot delete a borrowed book',
      });
    }

    // Preserve borrowing history and prevent deletion
    // while a request is pending.
    const borrowingHistory = await BorrowingTransaction.exists({
      bookCopyID: book.bookCopyID,
    });

    if (borrowingHistory) {
      return res.status(409).json({
        message: 'Cannot delete a book with borrowing history',
      });
    }

    await book.deleteOne();

    return res.status(200).json({
      message: 'Book deleted successfully',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid book ID',
      });
    }

    console.error('Delete book error:', error);
    return res.status(500).json({
      message: 'Failed to delete book',
    });
  }
};

module.exports = {
  addBook,
  getBooks,
  updateBook,
  deleteBook,
};
