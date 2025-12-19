import React, { useState, useMemo } from 'react';
import { User, Booking, BookingStatus } from '../types';

interface LodgeDashboardProps {
  user: User;
  logout: () => void;
  bookings: Booking[];
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  onLanguageChange: (lang: string) => void;
  t: (key: string) => string;
}

const LodgeDashboard: React.FC<LodgeDashboardProps> = ({ user, logout, bookings, onUpdateBooking }) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'guests'>('requests');
  const [roomInput, setRoomInput] = useState<{ [key: string]: string }>({});

  const requests = useMemo(() => bookings.filter(b => b.status === BookingStatus.PENDING), [bookings]);
  const guests = useMemo(() => bookings.filter(b => b.status === BookingStatus.ROOM_ASSIGNED), [bookings]);

  const handleCheckIn = (id: string) => {
    const room = roomInput[id];
    if (!room) return alert('Assign room #');
    onUpdateBooking(id, { status: BookingStatus.ROOM_ASSIGNED, roomNumber: room, receiptId: 'RCIPT-' + Math.random().toString(36).substr(2, 6).toUpperCase() });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <header className="px-5 py-6 bg-purple-700 text-white shadow-xl">
        <div className="flex justify-between items-center">
           <h2 className="text-xl font-black italic">Swensi Stays</h2>
           <button onClick={logout} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"><i className="fa-solid fa-power-off"></i></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {activeTab === 'requests' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase">Reservation Queue</h3>
            {requests.map(req => (
              <div key={req.id} className="bg-white dark:bg-slate-900 p-5 rounded-[32px] shadow-xl">
                 <h4 className="text-lg font-black text-secondary dark:text-white italic">{req.customerPhone}</h4>
                 <div className="flex gap-2 mt-4">
                    <input placeholder="Room #" value={roomInput[req.id] || ''} onChange={(e) => setRoomInput({...roomInput, [req.id]: e.target.value})} className="w-24 bg-slate-50 dark:bg-white/5 border rounded-2xl px-4 text-xs font-black text-slate-800 dark:text-white" />
                    <button onClick={() => handleCheckIn(req.id)} className="flex-1 bg-purple-600 text-white font-black py-4 rounded-2xl text-[9px] uppercase shadow-lg">Assign Room</button>
                 </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'guests' && (
          <div className="space-y-4 animate-fade-in">
            {guests.map(g => (
              <div key={g.id} className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border-l-[6px] border-purple-600 shadow-lg">
                <h4 className="text-xl font-black italic text-secondary dark:text-white">Room {g.roomNumber}</h4>
                <p className="text-[10px] text-slate-400 font-bold">{g.customerPhone}</p>
                <button onClick={() => onUpdateBooking(g.id, { status: BookingStatus.COMPLETED })} className="w-full bg-slate-100 dark:bg-white/5 py-3 rounded-xl text-[8px] uppercase mt-4">Check-out</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <nav className="absolute bottom-4 left-4 right-4 h-16 glass-nav rounded-3xl border border-white/10 flex justify-around items-center px-2 shadow-2xl z-50">
        <button onClick={() => setActiveTab('requests')} className={`flex-1 ${activeTab === 'requests' ? 'text-purple-600' : 'text-slate-400'}`}><i className="fa-solid fa-bell-concierge"></i></button>
        <button onClick={() => setActiveTab('guests')} className={`flex-1 ${activeTab === 'guests' ? 'text-purple-600' : 'text-slate-400'}`}><i className="fa-solid fa-key"></i></button>
      </nav>
    </div>
  );
};

export default LodgeDashboard;