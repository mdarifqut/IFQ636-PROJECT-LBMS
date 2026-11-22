
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const BorrowingManagement = () => {
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('Pending');
  const [loading, setLoading] = useState(false);
  const [processingID, setProcessingID] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const isLibrarian = user?.role === 'Librarian';

  const authHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${user?.token}`,
    }),
    [user?.token]
  );

  const fetchRequests = useCallback(async () => {
    if (!isLibrarian || !user?.token) return;

    setLoading(true);

    try {
      const response = await axiosInstance.get(
        '/api/borrowing/requests',
        { headers: authHeaders() }
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
  }, [isLibrarian, user?.token, authHeaders]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async () => {
    if (!confirmAction) return;

    const { request, action } = confirmAction;
    setConfirmAction(null);
    setProcessingID(request._id);
    setSuccess('');
    setError('');

    try {
      await axiosInstance.put(
        `/api/borrowing/requests/${request._id}/${action}`,
        {},
        { headers: authHeaders() }
      );

      const messages = {
        approve: 'Borrowing request approved successfully.',
        reject: 'Borrowing request rejected successfully.',
        return: 'Book return recorded successfully.',
      };

      setSuccess(messages[action]);
      await fetchRequests();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        `Failed to ${action} borrowing request`
      );
    } finally {
      setProcessingID(null);
    }
  };

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString('en-AU') : '-';

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

  const filteredRequests = requests.filter(
    (request) => filter === 'All' || request.status === filter
  );

  const filters = ['Pending', 'Approved', 'Rejected', 'Returned', 'All'];

  const actionLabels = {
    approve: 'Approve',
    reject: 'Reject',
    return: 'Record Return',
  };

  if (!user) {
    return <div className="p-6">Please log in.</div>;
  }

  if (!isLibrarian) {
    return (
      <div className="p-6 text-red-600">
        Access denied. Librarian role required.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">
        Borrowing Management
      </h1>

      <p className="text-gray-600 mb-6">
        Review borrowing requests, approve or reject requests,
        view borrowed books and record returns.
      </p>

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

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`px-4 py-2 rounded ${
              filter === item
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {item} ({item === 'All'
              ? requests.length
              : requests.filter((r) => r.status === item).length})
          </button>
        ))}

        <button
          type="button"
          onClick={fetchRequests}
          disabled={loading}
          className="ml-auto px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p>Loading borrowing requests...</p>
      ) : filteredRequests.length === 0 ? (
        <p className="text-gray-500">
          No {filter === 'All' ? '' : filter.toLowerCase()} borrowing requests found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-3 text-left">Reader</th>
                <th className="border p-3 text-left">Book</th>
                <th className="border p-3 text-left">Requested</th>
                <th className="border p-3 text-left">Status</th>
                <th className="border p-3 text-left">Due Date</th>
                <th className="border p-3 text-left">Return Date</th>
                <th className="border p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request._id}>
                  <td className="border p-3">
                    <div className="font-semibold">
                      {request.readerID?.name || 'Unknown Reader'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.readerID?.email || ''}
                    </div>
                  </td>

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

                  <td className="border p-3">
                    <div className="flex flex-wrap gap-2">
                      {request.status === 'Pending' && (
                        <>
                          <button
                            type="button"
                            disabled={processingID !== null}
                            onClick={() =>
                              setConfirmAction({ request, action: 'approve' })
                            }
                            className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            disabled={processingID !== null}
                            onClick={() =>
                              setConfirmAction({ request, action: 'reject' })
                            }
                            className="px-3 py-2 bg-red-600 text-white rounded disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {request.status === 'Approved' && (
                        <button
                          type="button"
                          disabled={processingID !== null}
                          onClick={() =>
                            setConfirmAction({ request, action: 'return' })
                          }
                          className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                        >
                          Record Return
                        </button>
                      )}

                      {['Rejected', 'Returned'].includes(request.status) && (
                        <span className="text-gray-500">No actions</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="borrowing-confirm-title"
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
          >
            <h2
              id="borrowing-confirm-title"
              className="text-xl font-bold mb-3"
            >
              Confirm {actionLabels[confirmAction.action]}
            </h2>

            <p className="text-gray-700 mb-2">
              Are you sure you want to{' '}
              {confirmAction.action === 'return'
                ? 'record the return of'
                : confirmAction.action}{' '}
              <strong>
                {confirmAction.request.book?.title ||
                  confirmAction.request.bookCopyID}
              </strong>
              ?
            </p>

            <p className="text-sm text-gray-500 mb-6">
              Reader: {confirmAction.request.readerID?.name || 'Unknown Reader'}
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAction}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Yes, {actionLabels[confirmAction.action]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowingManagement;
