import { useRef, useState, useEffect } from 'react';
import { Menu, Bell, ChevronDown, User2, Lock, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileModal from '../components/ui/ProfileModal';

interface Props { onMenuClick: () => void; title: string; }

function initials(name: string) {
  return name.split(' ').map((n) => n[0]?.toUpperCase() ?? '').join('').slice(0, 2);
}

export default function Header({ onMenuClick, title }: Props) {
  const { user, signOut } = useAuth();

  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [profileTab,    setProfileTab]    = useState<'profile' | 'password'>('profile');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function openProfile(tab: 'profile' | 'password') {
    setProfileTab(tab);
    setDropdownOpen(false);
    setProfileOpen(true);
  }

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 shrink-0 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.04)]">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block w-1 h-5 rounded-full bg-gradient-to-b from-[#0078D7] to-[#025DB6]" />
            <h1 className="font-semibold text-gray-900 text-base">{title}</h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          {/* Notification bell */}
          <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700">
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* User pill + dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((s) => !s)}
              className="flex items-center gap-2.5 pl-1 pr-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0078D7] to-[#025DB6] flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
                {user ? initials(user.fullName) : '?'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-gray-800 leading-none">{user?.fullName.split(' ')[0]}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
              <ChevronDown
                size={13}
                className={`text-gray-400 group-hover:text-gray-600 transition-all hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-[0_8px_30px_-4px_rgb(0_0_0_/_0.15)] border border-gray-100 z-50 overflow-hidden">
                {/* User info header */}
                <div className="px-4 py-3.5 bg-gradient-to-r from-[#e6f3fc] to-[#cce7f9]/50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0078D7] to-[#025DB6] flex items-center justify-center text-sm font-bold text-white shadow-sm flex-shrink-0">
                      {user ? initials(user.fullName) : '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{user?.fullName}</p>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1.5 px-1.5">
                  <button
                    onClick={() => openProfile('profile')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                      <User2 size={14} className="text-gray-500" />
                    </div>
                    Edit Profile
                  </button>

                  <button
                    onClick={() => openProfile('password')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Lock size={14} className="text-gray-500" />
                    </div>
                    Change Password
                  </button>

                  <div className="my-1.5 border-t border-gray-100 mx-1" />

                  <button
                    onClick={() => { setDropdownOpen(false); signOut(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                      <LogOut size={14} className="text-red-500" />
                    </div>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile modal */}
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        initialTab={profileTab}
      />
    </>
  );
}
