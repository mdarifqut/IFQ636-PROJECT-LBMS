
const express = require('express');

const { protect, authorize } = require('../middleware/authMiddleware');

const {
    getAvailableBooks,
    requestBook,
    getMyRequests,
    getAllRequests,
    approveRequest,
    rejectRequest,
    returnBook
} = require('../controllers/borrowingController');

const router = express.Router();

// All borrowing routes require authentication.
router.use(protect);

// Reader operations
router.get('/books', authorize('Reader'), getAvailableBooks);
router.post('/requests', authorize('Reader'), requestBook);
router.get('/my-requests', authorize('Reader'), getMyRequests);

// Librarian operations
router.get('/requests', authorize('Librarian'), getAllRequests);
router.put('/requests/:id/approve', authorize('Librarian'), approveRequest);
router.put('/requests/:id/reject', authorize('Librarian'), rejectRequest);
router.put('/requests/:id/return', authorize('Librarian'), returnBook);

module.exports = router;
