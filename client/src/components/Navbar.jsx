import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <nav className="bg-blue-500 text-white p-4">
      <div className="container mx-auto flex justify-between">
        <Link to="/" className="text-xl font-bold">TaskFlow</Link>
        {user && (
          <div>
            <span className="mr-4">{user.email}</span>
            <button onClick={handleLogout} className="bg-red-500 p-2 rounded">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;