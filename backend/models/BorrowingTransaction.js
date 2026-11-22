
const mongoose = require('mongoose');

const borrowingTransactionSchema = new mongoose.Schema(
    {
        bookCopyID: {
            type: String,
            required: true,
            ref: 'Book'
        },
        readerID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected', 'Returned'],
            default: 'Pending',
            required: true
        },
        requestDate: {
            type: Date,
            default: Date.now
        },
        approvalDate: {
            type: Date,
            default: null
        },
        dueDate: {
            type: Date,
            default: null
        },
        returnDate: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        collection: 'borrowingTransactions'
    }
);

// Prevent more than one active request or loan
// for the same physical book copy.
borrowingTransactionSchema.index(
    { bookCopyID: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: { $in: ['Pending', 'Approved'] }
        }
    }
);

module.exports = mongoose.model(
    'BorrowingTransaction',
    borrowingTransactionSchema
);
