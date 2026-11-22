
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const initialForm = {
  isbn: '',
  title: '',
  author: '',
  genre: '',
  publicationYear: '',
  description: '',
  availabilityStatus: 'Available',
};

const inputClass = 'w-full p-2 border rounded';
const buttonClass = 'px-4 py-2 rounded text-white';

const BookManagement = () => {
  const { user } = useAuth();

  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ ...initialForm });
  const [editingBook, setEditingBook] = useState(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const isLibrarian = user?.role === 'Librarian';

  const authHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${user?.token}`,
    }),
    [user?.token]
  );

  const fetchBooks = useCallback(async (searchText = '') => {
    if (!isLibrarian || !user?.token) return;

    setFetching(true);

    try {
      const response = await axiosInstance.get('/api/books', {
        headers: authHeaders(),
        params: {
          search: searchText,
        },
      });

      setBooks(response.data);
      setError('');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to load books'
      );
    } finally {
      setFetching(false);
    }
  }, [isLibrarian, user?.token, authHeaders]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({ ...initialForm });
    setEditingBook(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSuccess('');
    await fetchBooks(search);
  };

  const handleClearSearch = async () => {
    setSearch('');
    setSuccess('');
    await fetchBooks('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setSuccess('');
    setError('');

    const payload = {
      ...formData,
      publicationYear: Number(formData.publicationYear),
    };

    try {
      if (editingBook) {
        await axiosInstance.put(
          `/api/books/${editingBook._id}`,
          payload,
          { headers: authHeaders() }
        );

        setSuccess('Book updated successfully!');
      } else {
        const response = await axiosInstance.post(
          '/api/books',
          payload,
          { headers: authHeaders() }
        );

        setSuccess(
          `Book added successfully! Book Copy ID: ${response.data.book.bookCopyID}`
        );
      }

      resetForm();
      await fetchBooks(search);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to save book. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book);

    setFormData({
      isbn: book.isbn || '',
      title: book.title || '',
      author: book.author || '',
      genre: book.genre || '',
      publicationYear: book.publicationYear ?? '',
      description: book.description || '',
      availabilityStatus: book.availabilityStatus || 'Available',
    });

    setSuccess('');
    setError('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (book) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${book.title}"?\n\n` +
      `Book Copy ID: ${book.bookCopyID}\n\n` +
      'This action cannot be undone.'
    );

    if (!confirmed) return;

    setLoading(true);
    setSuccess('');
    setError('');

    try {
      await axiosInstance.delete(
        `/api/books/${book._id}`,
        { headers: authHeaders() }
      );

      if (editingBook?._id === book._id) {
        resetForm();
      }

      setSuccess('Book deleted successfully!');
      await fetchBooks(search);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to delete book'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isLibrarian) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-6">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>Only Librarians can manage books.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-2">
        Book Management
      </h1>

      <p className="text-gray-600 mb-6">
        Manage physical book copies in the library catalogue.
      </p>

      {/* ADD / EDIT FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 shadow-md rounded mb-8"
      >
        <h2 className="text-xl font-semibold mb-4">
          {editingBook ? 'Edit Book' : 'Add Book'}
        </h2>

        <p className="text-sm text-gray-500 mb-4">
          {editingBook
            ? `Book Copy ID: ${editingBook.bookCopyID} (read-only)`
            : 'Book Copy ID will be generated automatically.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="isbn" className="block mb-1">
              ISBN *
            </label>
            <input
              id="isbn"
              name="isbn"
              type="text"
              required
              value={formData.isbn}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="title" className="block mb-1">
              Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="author" className="block mb-1">
              Author *
            </label>
            <input
              id="author"
              name="author"
              type="text"
              required
              value={formData.author}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="genre" className="block mb-1">
              Genre *
            </label>
            <input
              id="genre"
              name="genre"
              type="text"
              required
              value={formData.genre}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="publicationYear"
              className="block mb-1"
            >
              Publication Year *
            </label>
            <input
              id="publicationYear"
              name="publicationYear"
              type="number"
              min="0"
              required
              value={formData.publicationYear}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="availabilityStatus"
              className="block mb-1"
            >
              Availability Status
            </label>
            <select
              id="availabilityStatus"
              name="availabilityStatus"
              value={formData.availabilityStatus}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="Available">Available</option>
              <option value="Borrowed">Borrowed</option>
              <option value="Lost">Lost</option>
              <option value="Damaged">Damaged</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="description" className="block mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={loading}
            className={`${buttonClass} bg-blue-600 disabled:opacity-50`}
          >
            {loading
              ? 'Saving...'
              : editingBook
                ? 'Update Book'
                : 'Save Book'}
          </button>

          {editingBook && (
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="px-4 py-2 rounded border"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* RESULT MESSAGES */}
      {success && (
        <div
          role="status"
          className="mb-5 p-3 bg-green-100 text-green-800 rounded"
        >
          {success}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-5 p-3 bg-red-100 text-red-800 rounded"
        >
          {error}
        </div>
      )}

      {/* SEARCH AND CATALOGUE */}
      <section className="bg-white p-6 shadow-md rounded">
        <h2 className="text-xl font-semibold mb-4">
          Book Catalogue
        </h2>

        <form
          onSubmit={handleSearch}
          className="flex flex-wrap gap-3 mb-5"
        >
          <input
            type="search"
            placeholder="Search title, author, ISBN or Book Copy ID"
            aria-label="Search books"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-56 p-2 border rounded"
          />

          <button
            type="submit"
            disabled={fetching}
            className={`${buttonClass} bg-blue-600`}
          >
            Search
          </button>

          <button
            type="button"
            onClick={handleClearSearch}
            disabled={fetching}
            className="px-4 py-2 border rounded"
          >
            Clear
          </button>
        </form>

        {fetching ? (
          <p>Loading books...</p>
        ) : books.length === 0 ? (
          <p className="text-gray-500">
            No books found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 border">Book Copy ID</th>
                  <th className="p-3 border">Title</th>
                  <th className="p-3 border">Author</th>
                  <th className="p-3 border">ISBN</th>
                  <th className="p-3 border">Year</th>
                  <th className="p-3 border">Status</th>
                  <th className="p-3 border">Actions</th>
                </tr>
              </thead>

              <tbody>
                {books.map((book) => (
                  <tr key={book._id} className="hover:bg-gray-50">
                    <td className="p-3 border text-xs break-all">
                      {book.bookCopyID}
                    </td>
                    <td className="p-3 border">{book.title}</td>
                    <td className="p-3 border">{book.author}</td>
                    <td className="p-3 border">{book.isbn}</td>
                    <td className="p-3 border">
                      {book.publicationYear}
                    </td>
                    <td className="p-3 border">
                      {book.availabilityStatus}
                    </td>
                    <td className="p-3 border">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(book)}
                          disabled={loading}
                          className="px-3 py-1 bg-blue-600 text-white rounded"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(book)}
                          disabled={
                            loading ||
                            book.availabilityStatus === 'Borrowed'
                          }
                          title={
                            book.availabilityStatus === 'Borrowed'
                              ? 'Borrowed books cannot be deleted'
                              : 'Delete book'
                          }
                          className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-sm text-gray-500 mt-4">
          Showing {books.length} book copies (maximum 100).
        </p>
      </section>
    </div>
  );
};

export default BookManagement;
