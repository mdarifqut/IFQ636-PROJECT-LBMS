
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
    {
        bookCopyID: {
            type: String,
            required: true,
            unique: true,
            immutable: true
        },
        isbn: {
            type: String,
            required: true,
            trim: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        author: {
            type: String,
            required: true,
            trim: true
        },
        genre: {
            type: String,
            required: true,
            trim: true
        },
        publicationYear: {
            type: Number,
            required: true,
            min: 0
        },
        description: {
            type: String,
            trim: true
        },
        availabilityStatus: {
            type: String,
            enum: ['Available', 'Borrowed', 'Lost', 'Damaged'],
            default: 'Available',
            required: true
        }
    },
    {
        timestamps: true,
        collection: 'books'
    }
);

// Generate BookCopyID automatically from MongoDB ObjectId
bookSchema.pre('validate', function (next) {
    if (this.isNew && !this.bookCopyID) {
        this.bookCopyID = `BC-${this._id.toString().toUpperCase()}`;
    }
    next();
});

module.exports = mongoose.model('Book', bookSchema);
