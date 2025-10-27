interface TopbarProps {
  userName?: string;
  userRole?: string;
}

export default function Topbar({ userName = 'User', userRole = 'Guest' }: TopbarProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-12 md:px-6 py-3 md:py-4 flex justify-between items-center">
        <div>
          <h2 className="text-sm md:text-xl font-semibold text-gray-800 truncate">Welcome back, {userName}!</h2>
          <p className="text-xs md:text-sm text-gray-500 hidden sm:block">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <button className="relative p-2 text-gray-600 hover:text-gray-900">
            <span className="text-xl md:text-2xl">🔔</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

