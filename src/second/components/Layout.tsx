import { Outlet, NavLink, useNavigate } from "react-router-dom";
import dashboardIcon from "../../assets/dashboard.png";
import dashboardIconActive from "../../assets/dashboard3.png";

import userIcon from "../../assets/user.png";
import userIconActive from "../../assets/user3.png";

import bookingIcon from "../../assets/booking.png";
import bookingIconActive from "../../assets/booking2.png";

import bookIcon from "../../assets/book.png";
import bookIconActive from "../../assets/book3.png";

import listIcon from "../../assets/list2.png";
import listIconActive from "../../assets/list.png";

import announcementIcon from "../../assets/announcement2.png";
import announcementIconActive from "../../assets/announcement1.png";

import logoutIcon from "../../assets/logout.png";
export default function Layout() {
  const navigate = useNavigate();

  const electronAPI =
    typeof window !== "undefined"
      ? (window as unknown as { electronAPI?: { logout?: () => void } }).electronAPI
      : undefined;

  const handleLogout = () => {
    if (electronAPI?.logout) {
      try {
        electronAPI.logout();
      } catch {
        /* ignore */
      }
    } else {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // ignore
      }
      navigate('/');
    }
  };

  return (
    <div className="flex h-screen bg-[#D9D9D9]">
      {/* Sidebar */}
      <aside className="w-60 bg-[#43435E] text-white flex flex-col items-center">
        <div className="p-8 text-2xl font-semibold">LIBROSYNC</div>

        {/* Sidebar content split into nav and logout */}
        <div className="flex flex-col justify-between flex-1 w-full">
          <nav className="px-6 space-y-4 flex flex-col w-[240px]">
            {/* Dashboard */}
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-2 px-6 py-2 rounded-[50px] transition-colors ${
                  isActive
                    ? "bg-[#D9D9D9] text-black mr-[-60px]"
                    : "text-white hover:bg-[#5A5A75]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <img
                    src={isActive ? dashboardIconActive  : dashboardIcon }
                    alt="Dashboard"
                    className="w-5 h-5"
                  />
                  <span className="text-lg">Dashboard</span>
                </>
              )}
            </NavLink>

            {/* Account */}
            <NavLink
              to="/account"
              className={({ isActive }) =>
                `flex items-center gap-2 px-6 py-2 rounded-[50px] transition-colors ${
                  isActive
                    ? "bg-[#D9D9D9] text-black mr-[-60px]"
                    : "text-white hover:bg-[#5A5A75]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <img src={isActive ? userIconActive  : userIcon } alt="Account" className="w-5 h-5" />
                  <span className="text-lg">Account</span>
                </>
              )}
            </NavLink>

            {/* Reservation */}
            <NavLink
              to="/reservation"
              className={({ isActive }) =>
                `flex items-center gap-2 px-6 py-2 rounded-[50px] transition-colors ${
                  isActive
                    ? "bg-[#D9D9D9] text-black mr-[-60px]"
                    : "text-white hover:bg-[#5A5A75]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <img src={isActive ? bookingIconActive  : bookingIcon } alt="Reservation" className="w-5 h-5" />
                  <span className="text-lg">Reservation</span>
                </>
              )}
            </NavLink>

            {/* Books */}
            <NavLink
              to="/books"
              className={({ isActive }) =>
                `flex items-center gap-2 px-6 py-2 rounded-[50px] transition-colors ${
                  isActive
                    ? "bg-[#D9D9D9] text-black mr-[-60px]"
                    : "text-white hover:bg-[#5A5A75]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <img src={isActive ? bookIconActive  : bookIcon } alt="Books" className="w-5 h-5" />
                  <span className="text-lg">Books</span>
                </>
              )}
            </NavLink>

            {/* Logs */}
            <NavLink
              to="/logs"
              className={({ isActive }) =>
                `flex items-center gap-2 px-6 py-2 rounded-[50px] transition-colors ${
                  isActive
                    ? "bg-[#D9D9D9] text-black mr-[-60px]"
                    : "text-white hover:bg-[#5A5A75]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <img src={isActive ? listIconActive  : listIcon } alt="Logs" className="w-5 h-5" />
                  <span className="text-lg">Logs</span>
                </>
              )}
            </NavLink>

            {/* Announcement */}
            <NavLink
              to="/announcement"
              className={({ isActive }) =>
                `flex items-center gap-2 px-6 py-2 rounded-[50px] transition-colors ${
                  isActive
                    ? "bg-[#D9D9D9] text-black mr-[-60px]"
                    : "text-white hover:bg-[#5A5A75]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <img src={isActive ? announcementIconActive  : announcementIcon } alt="Announcement" className="w-6 h-6" />
                  <span className="text-lg">Announcement</span>
                </>
              )}
            </NavLink>
          </nav>

          {/* Logout pinned to bottom */}
          <div className="px-6 py-6 flex justify-center">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-2 rounded-[50px] transition-colors text-white hover:bg-[#5A5A75]"
            >
              <img src={logoutIcon} alt="Logout" className="w-5 h-5" />
              <span className="text-lg text-red">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
