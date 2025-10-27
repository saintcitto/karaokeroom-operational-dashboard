import React from 'react';
import { List, Timer, AlertTriangle } from 'lucide-react';

const BookingGridHeader = ({ stats }) => {
  return (
    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gray-700/50 p-4 rounded-lg flex items-center gap-3 transition-all">
        <List size={24} className="text-blue-400 flex-shrink-0" />
        <div>
          <div className="text-xs text-gray-400 uppercase">Total Aktif</div>
          <div className="text-2xl font-bold">{stats.active}</div>
        </div>
      </div>
      <div className={`p-4 rounded-lg flex items-center gap-3 transition-all ${stats.warning > 0 ? 'bg-yellow-700/50' : 'bg-gray-700/50'}`}>
        <Timer size={24} className={`flex-shrink-0 ${stats.warning > 0 ? 'text-yellow-300' : 'text-gray-400'}`} />
        <div>
          <div className="text-xs text-gray-400 uppercase">Akan Habis</div>
          <div className={`text-2xl font-bold ${stats.warning > 0 ? 'text-yellow-300' : ''}`}>{stats.warning}</div>
        </div>
      </div>
      <div className={`p-4 rounded-lg flex items-center gap-3 transition-all ${stats.expired > 0 ? 'bg-red-700/50 animate-pulse' : 'bg-gray-700/50'}`}>
        <AlertTriangle size={24} className={`flex-shrink-0 ${stats.expired > 0 ? 'text-red-400' : 'text-gray-400'}`} />
        <div>
          <div className="text-xs text-gray-400 uppercase">Waktu Habis</div>
          <div className={`text-2xl font-bold ${stats.expired > 0 ? 'text-red-400' : ''}`}>{stats.expired}</div>
        </div>
      </div>
    </div>
  );
};

export default BookingGridHeader;
