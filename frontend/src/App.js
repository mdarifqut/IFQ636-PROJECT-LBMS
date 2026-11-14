
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import BookManagement from './pages/BookManagement';
import RequestBook from './pages/RequestBook';

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />

        <Route
          path="/books"
          element={<BookManagement />}
        />

        <Route
          path="/request-book"
          element={<RequestBook />}
        />
      </Routes>
    </Router>
  );
}

export default App;
