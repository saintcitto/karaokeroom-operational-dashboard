import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { useSession } from "../../context/SessionContext";
import RoomCard from "./RoomCard";

const RoomDashboard = () => {
  const { rooms = [], sessions = {} } = useSession();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // console.debug("[RoomDashboard] rooms:", rooms?.length, "sessions keys:", Object.keys(sessions).length);

  const filteredRooms = useMemo(() => {
    if (!Array.isArray(rooms)) return [];
    const q = (filter || "").toString().trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((room) => {
      const name = (room?.name || room?.room_number || "").toString().toLowerCase();
      return name.includes(q);
    });
  }, [rooms, filter]);

  const fullyFilteredRooms = useMemo(() => {
    if (statusFilter === "all") return filteredRooms;
    const want = (statusFilter || "").toLowerCase();
    return filteredRooms.filter((room) => {
      const session = sessions?.[room?.id];
      const status = session?.status ? session.status.toString().toLowerCase() : "available";
      return status === want;
    });
  }, [filteredRooms, statusFilter, sessions]);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Room Dashboard</h1>
        <div className="flex space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Cari ruangan..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-48 pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-44 appearance-none pl-4 pr-12 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="ongoing">Ongoing</option>
              <option value="scheduled">Scheduled</option>
              <option value="expired">Expired</option>
            </select>

            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>

            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Filter size={16} />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {fullyFilteredRooms.map((room) => (
            <RoomCard key={room?.id ?? `${room?.room_number}_${Math.random()}`} room={room} />
          ))}
        </motion.div>
      </AnimatePresence>

      {fullyFilteredRooms.length === 0 && (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <Search size={48} className="mx-auto mb-4" />
          <h3 className="text-xl font-semibold">Tidak Ada Ruangan</h3>
          <p>Tidak ada ruangan yang cocok dengan filter Anda.</p>
        </div>
      )}
    </div>
  );
};

export default RoomDashboard;