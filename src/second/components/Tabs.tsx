import { NavLink } from 'react-router-dom';

export default function Tabs() {
  const tabs = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/account', label: 'Account' },
    { path: '/reservation', label: 'Reservation' },
    { path: '/books', label: 'Books' },
    { path: '/logs', label: 'Logs' },
    { path: '/announcement', label: 'Announcement' },
  ];

  return (
    <nav className="flex space-x-6 border-b border-gray-700 bg-[#2D2D44] px-6">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `py-3 ${
              isActive
                ? 'border-b-2 border-blue-400 text-blue-400 font-semibold'
                : 'text-gray-300 hover:text-white'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
