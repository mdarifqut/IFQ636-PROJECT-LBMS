
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <div>
        <Link to="/" className="text-xl font-bold">
          Library Book Management System
        </Link>

        {user && (
          <div className="text-sm text-blue-100 mt-1">
            <strong>
              {user.name} [role:{user.role || 'Unknown'}]
            </strong>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            {user.role === 'Librarian' && (
              <>
                <Link to="/books" className="hover:underline">
                  Catalogue
                </Link>

                <Link
                  to="/borrowing-management"
                  className="hover:underline"
                >
                  Borrowing Management
                </Link>
              </>
            )}

            {user.role === 'Reader' && (
              <Link to="/request-book" className="hover:underline">
                Borrow
              </Link>
            )}

            <Link to="/profile" className="hover:underline">
              Profile
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline">
              Login
            </Link>

            <Link
              to="/register"
              className="bg-green-500 px-4 py-2 rounded hover:bg-green-700"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
