import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  const navItems = [
    { to: '/dashboard', name: 'Dashboard', icon: 'chart-pie' },
    { to: '/feedback', name: 'Feedback List', icon: 'list' },
    { to: '/upload', name: 'Upload Feedback', icon: 'upload' },
    { to: '/settings', name: 'Settings', icon: 'cog' },
  ]
  
  return (
    <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)]">
      <div className="p-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar