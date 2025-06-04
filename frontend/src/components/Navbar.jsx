import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const Navbar = () => {
  const { user, logout } = useAuthStore()
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-primary-600 font-bold text-xl">
                VerbatimAI
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="relative">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">
                  {user?.businessName || user?.email}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar