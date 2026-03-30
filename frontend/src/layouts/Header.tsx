import { Menu, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props { onMenuClick: () => void; title: string; }

function initials(name: string) {
  return name.split(' ').map((n) => n[0]?.toUpperCase() ?? '').join('').slice(0, 2);
}

export default function Header({ onMenuClick, title }: Props) {
  const { user } = useAuth();

  return (
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

        {/* User pill */}
        <button className="flex items-center gap-2.5 pl-1 pr-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0078D7] to-[#025DB6] flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
            {user ? initials(user.fullName) : '?'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-gray-800 leading-none">{user?.fullName.split(' ')[0]}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
          <ChevronDown size={13} className="text-gray-400 group-hover:text-gray-600 transition-colors hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
