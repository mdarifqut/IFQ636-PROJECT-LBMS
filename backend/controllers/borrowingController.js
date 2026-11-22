
const mongoose = require('mongoose');
const Book = require('../models/Book');
const BorrowingTransaction = require('../models/BorrowingTransaction');

const ACTIVE_STATUSES = ['Pending', 'Approved'];
const LOAN_DAYS = 14;

const handleError = (res, error) => {
    if (error.code === 11000) {
        return res.status(409).json({
            message: 'This book already has an active borrowing request or loan'
        });
    }

    if (error.name === 'ValidationError' ||
        error.name === 'CastError') {
        return res.status(400).json({
            message: error.message
        });
    }

    console.error('Borrowing error:', error);

    return res.status(500).json({
        message: 'Failed to process borrowing operation'
    });
};

const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/borrowing/books?search=
// LBMS-12: Reader searches available books.
const getAvailableBooks = async (req, res) => {
    try {
        const search = String(req.query.search || '').trim();

        if (search.length > 100) {
            return res.status(400).json({
                message: 'Search text must be 100 characters or fewer'
            });
        }

        const filter = { availabilityStatus: 'Available' };

        if (search) {
            filter.$or = ['title', 'author', 'isbn', 'bookCopyID']
                .map(field => ({
                    [field]: {
                        $regex: escapeRegex(search),
                        $options: 'i'
                    }
                }));
        }

        const books = await Book.find(filter)
            .sort({ title: 1 })
            .limit(100)
            .lean();

        const activeRequests = await BorrowingTransaction.find({
            bookCopyID: { $in: books.map(book => book.bookCopyID) },
            status: { $in: ACTIVE_STATUSES }
        }).select('bookCopyID').lean();

        const reserved = new Set(
            activeRequests.map(request => request.bookCopyID)
        );

        return res.status(200).json(
            books.filter(book => !reserved.has(book.bookCopyID))
        );

    } catch (error) {
        return handleError(res, error);
    }
};

// POST /api/borrowing/requests
// LBMS-12: Reader requests a book.
const requestBook = async (req, res) => {
    try {
        const { bookCopyID } = req.body;

        if (typeof bookCopyID !== 'string' || !bookCopyID.trim()) {
            return res.status(400).json({
                message: 'Book Copy ID is required'
            });
        }

        const book = await Book.findOne({
            bookCopyID: bookCopyID.trim()
        });

        if (!book) {
            return res.status(404).json({
                message: 'Book not found'
            });
        }

        if (book.availabilityStatus !== 'Available') {
            return res.status(409).json({
                message: 'Book is not available'
            });
        }

        const existing = await BorrowingTransaction.findOne({
            bookCopyID: book.bookCopyID,
            status: { $in: ACTIVE_STATUSES }
        });

        if (existing) {
            return res.status(409).json({
                message: 'Book already has an active request or loan'
            });
        }

        const transaction = await BorrowingTransaction.create({
            bookCopyID: book.bookCopyID,
            readerID: req.user._id,
            status: 'Pending'
        });

        return res.status(201).json({
            message: 'Borrowing request submitted successfully',
            transaction
        });

    } catch (error) {
        return handleError(res, error);
    }
};

// GET /api/borrowing/my-requests
// LBMS-13: Reader views their borrowing records.
const getMyRequests = async (req, res) => {
    try {
        const requests = await BorrowingTransaction.find({
            readerID: req.user._id
        }).sort({ requestDate: -1 }).lean();

        const books = await Book.find({
            bookCopyID: { $in: requests.map(r => r.bookCopyID) }
        }).lean();

        const bookMap = new Map(
            books.map(book => [book.bookCopyID, book])
        );

        const result = requests.map(request => ({
            ...request,
            book: bookMap.get(request.bookCopyID) || null
        }));

        return res.status(200).json(result);

    } catch (error) {
        return handleError(res, error);
    }
};

// GET /api/borrowing/requests
// LBMS-14: Librarian views borrowing records.
const getAllRequests = async (req, res) => {
    try {
        const requests = await BorrowingTransaction.find()
            .populate('readerID', 'name email')
            .sort({ requestDate: -1 })
            .limit(200)
            .lean();

        const books = await Book.find({
            bookCopyID: { $in: requests.map(r => r.bookCopyID) }
        }).lean();

        const bookMap = new Map(
            books.map(book => [book.bookCopyID, book])
        );

        const result = requests.map(request => ({
            ...request,
            book: bookMap.get(request.bookCopyID) || null
        }));

        return res.status(200).json(result);

    } catch (error) {
        return handleError(res, error);
    }
};

// PUT /api/borrowing/requests/:id/approve
// LBMS-15: Librarian approves a request.
const approveRequest = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
            message: 'Invalid borrowing request ID'
        });
    }

    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            const request = await BorrowingTransaction.findById(
                req.params.id
            ).session(session);

            if (!request || request.status !== 'Pending') {
                const error = new Error('Pending request not found');
                error.statusCode = 409;
                throw error;
            }

            const book = await Book.findOneAndUpdate(
                {
                    bookCopyID: request.bookCopyID,
                    availabilityStatus: 'Available'
                },
                { $set: { availabilityStatus: 'Borrowed' } },
                { new: true, session }
            );

            if (!book) {
                const error = new Error('Book is no longer available');
                error.statusCode = 409;
                throw error;
            }

            const now = new Date();
            const dueDate = new Date(now);
            dueDate.setDate(dueDate.getDate() + LOAN_DAYS);

            const updated = await BorrowingTransaction.findOneAndUpdate(
                { _id: request._id, status: 'Pending' },
                {
                    $set: {
                        status: 'Approved',
                        approvalDate: now,
                        dueDate
                    }
                },
                { new: true, session, runValidators: true }
            );

            if (!updated) {
                const error = new Error('Request status changed');
                error.statusCode = 409;
                throw error;
            }

            result = updated;
        });

        return res.status(200).json({
            message: 'Borrowing request approved',
            transaction: result
        });

    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message
            });
        }
        return handleError(res, error);
    } finally {
        await session.endSession();
    }
};

// PUT /api/borrowing/requests/:id/reject
// LBMS-15: Librarian rejects a request.
const rejectRequest = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid borrowing request ID'
            });
        }

        const transaction = await BorrowingTransaction.findOneAndUpdate(
            {
                _id: req.params.id,
                status: 'Pending'
            },
            { $set: { status: 'Rejected' } },
            { new: true, runValidators: true }
        );

        if (!transaction) {
            return res.status(409).json({
                message: 'Pending request not found'
            });
        }

        return res.status(200).json({
            message: 'Borrowing request rejected',
            transaction
        });

    } catch (error) {
        return handleError(res, error);
    }
};

// PUT /api/borrowing/requests/:id/return
// LBMS-16: Librarian records book return.
const returnBook = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
            message: 'Invalid borrowing request ID'
        });
    }

    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            const request = await BorrowingTransaction.findById(
                req.params.id
            ).session(session);

            if (!request || request.status !== 'Approved') {
                const error = new Error('Active loan not found');
                error.statusCode = 409;
                throw error;
            }

            const book = await Book.findOneAndUpdate(
                {
                    bookCopyID: request.bookCopyID,
                    availabilityStatus: 'Borrowed'
                },
                { $set: { availabilityStatus: 'Available' } },
                { new: true, session }
            );

            if (!book) {
                const error = new Error('Borrowed book not found');
                error.statusCode = 409;
                throw error;
            }

            const updated = await BorrowingTransaction.findOneAndUpdate(
                { _id: request._id, status: 'Approved' },
                {
                    $set: {
                        status: 'Returned',
                        returnDate: new Date()
                    }
                },
                { new: true, session, runValidators: true }
            );

            if (!updated) {
                const error = new Error('Loan status changed');
                error.statusCode = 409;
                throw error;
            }

            result = updated;
        });

        return res.status(200).json({
            message: 'Book returned successfully',
            transaction: result
        });

    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message
            });
        }
        return handleError(res, error);
    } finally {
        await session.endSession();
    }
};

module.exports = {
    getAvailableBooks,
    requestBook,
    getMyRequests,
    getAllRequests,
    approveRequest,
    rejectRequest,
    returnBook
};
