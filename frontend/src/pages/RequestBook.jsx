
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const RequestBook = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('available');
  const [books, setBooks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [requestingID, setRequestingID] = useState(null);
  const [bookToRequest, setBookToRequest] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const isReader = user?.role === 'Reader';

  const authHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${user?.token}`,
    }),
    [user?.token]
  );

  const fetchAvailableBooks = useCallback(async (searchText = '') => {
    if (!isReader || !user?.token) return;

    setLoading(true);

    try {
      const response = await axiosInstance.get(
        '/api/borrowing/books',
        {
          headers: authHeaders(),
          params: { search: searchText },
        }
      );

      setBooks(response.data);
      setError('');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to load available books'
      );
    } finally {
      setLoading(false);
    }
  }, [isReader, user?.token, authHeaders]);

  const fetchMyRequests = useCallback(async () => {
    if (!isReader || !user?.token) return;

    setLoading(true);

    try {
      const response = await axiosInstance.get(
        '/api/borrowing/my-requests',
        {
          headers: authHeaders(),
        }
      );

      setRequests(response.data);
      setError('');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to load borrowing requests'
      );
    } finally {
      setLoading(false);
    }
  }, [isReader, user?.token, authHeaders]);

  useEffect(() => {
    if (activeTab === 'available') {
      fetchAvailableBooks();
    } else {
      fetchMyRequests();
    }
  }, [activeTab, fetchAvailableBooks, fetchMyRequests]);

  const handleSearch = (event) => {
    event.preventDefault();
    setSuccess('');
    fetchAvailableBooks(search);
  };

  const handleRequest = async (bookCopyID) => {
    setRequestingID(bookCopyID);
    setError('');
    setSuccess('');

    try {
      await axiosInstance.post(
        '/api/borrowing/requests',
        { bookCopyID },
        { headers: authHeaders() }
      );

      setSuccess(
        'Borrowing request submitted successfully. Waiting for Librarian approval.'
      );

      await fetchAvailableBooks(search);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to submit borrowing request'
      );
    } finally {
      setRequestingID(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-AU');
  };

  const statusClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Returned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <p>Please log in to request books.</p>
      </div>
    );
  }

  if (!isReader) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          Access denied. Reader role required.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">
        Borrow Books
      </h1>

      <p className="text-gray-600 mb-6">
        Search available books, submit borrowing requests,
        and track your borrowed books.
      </p>

      <div className="flex gap-3 border-b mb-6">
        <button
          type="button"
          onClick={() => {
            setActiveTab('available');
            setError('');
            setSuccess('');
          }}
          className={`px-4 py-2 ${
            activeTab === 'available'
              ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
              : 'text-gray-600'
          }`}
        >
          Available Books
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('requests');
            setError('');
            setSuccess('');
          }}
          className={`px-4 py-2 ${
            activeTab === 'requests'
              ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
              : 'text-gray-600'
          }`}
        >
          My Requests / Borrowed Books
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}

      {activeTab === 'available' && (
        <>
          <form
            onSubmit={handleSearch}
            className="flex gap-2 mb-6"
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, ISBN or Book Copy ID"
              maxLength={100}
              className="flex-1 p-2 border rounded"
            />

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Search
            </button>

            <button
              type="button"
              onClick={() => {
                setSearch('');
                fetchAvailableBooks('');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded"
            >
              Clear
            </button>
          </form>

          <h2 className="text-xl font-semibold mb-4">
            Available Books
          </h2>

          {loading ? (
            <p>Loading books...</p>
          ) : books.length === 0 ? (
            <p className="text-gray-500">
              No available books found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-3 text-left">Title</th>
                    <th className="border p-3 text-left">Author</th>
                    <th className="border p-3 text-left">ISBN</th>
                    <th className="border p-3 text-left">Book Copy ID</th>
                    <th className="border p-3 text-left">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {books.map((book) => (
                    <tr key={book._id}>
                      <td className="border p-3">{book.title}</td>
                      <td className="border p-3">{book.author}</td>
                      <td className="border p-3">{book.isbn}</td>
                      <td className="border p-3 text-sm">
                        {book.bookCopyID}
                      </td>
                      <td className="border p-3">
                        <button
                          type="button"
                          disabled={requestingID !== null}
                          onClick={() => setBookToRequest(book)}
                          className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                        >
                          {requestingID === book.bookCopyID
                            ? 'Requesting...'
                            : 'Request Book'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'requests' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              My Borrowing Requests
            </h2>

            <button
              type="button"
              onClick={fetchMyRequests}
              className="px-4 py-2 bg-gray-600 text-white rounded"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p>Loading requests...</p>
          ) : requests.length === 0 ? (
            <p className="text-gray-500">
              You have not requested any books yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-3 text-left">Book</th>
                    <th className="border p-3 text-left">Request Date</th>
                    <th className="border p-3 text-left">Status</th>
                    <th className="border p-3 text-left">Due Date</th>
                    <th className="border p-3 text-left">Return Date</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request) => (
                    <tr key={request._id}>
                      <td className="border p-3">
                        <div className="font-semibold">
                          {request.book?.title || 'Book unavailable'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.bookCopyID}
                        </div>
                      </td>

                      <td className="border p-3">
                        {formatDate(request.requestDate)}
                      </td>

                      <td className="border p-3">
                        <span
                          className={`px-2 py-1 rounded text-sm ${statusClass(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                      </td>

                      <td className="border p-3">
                        {formatDate(request.dueDate)}
                      </td>

                      <td className="border p-3">
                        {formatDate(request.returnDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {bookToRequest && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="presentation"
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-request-title"
          >
            <h2
              id="confirm-request-title"
              className="text-xl font-bold mb-3"
            >
              Confirm Book Request
            </h2>

            <p className="text-gray-700 mb-2">
              Are you sure you want to request
              <strong> {bookToRequest.title}</strong>?
            </p>

            <p className="text-sm text-gray-500 mb-6">
              Your request will be sent to the librarian for approval.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setBookToRequest(null)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  const bookCopyID = bookToRequest.bookCopyID;
                  setBookToRequest(null);
                  handleRequest(bookCopyID);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Yes, Request Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestBook;
