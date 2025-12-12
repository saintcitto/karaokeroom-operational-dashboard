import React, { useEffect, useState } from "react";
import { Mic, List, Database, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "../../context/SessionContext";
import { ToastProvider } from "../../context/ToastContext";
import RoomDashboard from "../dashboard/RoomDashboard";
import AdminDashboard from "../dashboard/AdminDashboard";
import ToggleDarkMode from "../ui/ToggleDarkMode";

const MainLayout = () => {
	const { user, logout } = useSession();
	const [view, setView] = useState("dashboard");
	const [darkMode, setDarkMode] = useState(
		() => localStorage.getItem("karaoke_theme") === "dark"
	);

	const isAdmin =
		!!user &&
		(user === "admin" ||
			user === "admin01" ||
			String(user).toLowerCase().includes("admin"));

	useEffect(() => {
		const root = document.documentElement;
		if (darkMode) {
			root.classList.add("dark");
			localStorage.setItem("karaoke_theme", "dark");
		} else {
			root.classList.remove("dark");
			localStorage.setItem("karaoke_theme", "light");
		}
	}, [darkMode]);

	const NavButton = ({ icon: Icon, label, onClick, isActive }) => (
		<button
			onClick={onClick}
			className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
				isActive
					? "bg-blue-500 text-white shadow-md"
					: "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
			}`}
		>
			<Icon size={20} className="mr-3" />
			<span className="font-semibold">{label}</span>
		</button>
	);

	return (
		<ToastProvider>
			<div className="flex h-screen text-gray-900 bg-gray-100 dark:bg-gray-900 dark:text-gray-100">
				<div className="flex flex-col flex-shrink-0 w-64 bg-white shadow-lg dark:bg-gray-800">
					<div className="flex items-center justify-center h-20 border-b dark:border-gray-700">
						<Mic size={28} className="text-blue-500" />
						<span className="ml-2 text-xl font-bold text-gray-800 dark:text-white">
							Sonia Karaoke
						</span>
					</div>

					<nav className="flex-1 p-4 space-y-2">
						<NavButton
							icon={List}
							label="Room Dashboard"
							isActive={view === "dashboard"}
							onClick={() => setView("dashboard")}
						/>
						{isAdmin && (
							<NavButton
								icon={Database}
								label="Admin"
								isActive={view === "admin"}
								onClick={() => setView("admin")}
							/>
						)}
					</nav>

					<div className="p-4 border-t dark:border-gray-700">
						<div className="flex items-center justify-between mb-4">
							<div className="flex flex-col">
								<span className="font-semibold text-gray-800 dark:text-white">
									{user}
								</span>
								<span className="text-xs text-gray-500 dark:text-gray-400">
									{isAdmin ? "Administrator" : "Staff"}
								</span>
							</div>

							<ToggleDarkMode darkMode={darkMode} setDarkMode={setDarkMode} />
						</div>

						<button
							onClick={logout}
							className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg font-semibold text-red-500 bg-red-100 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
						>
							<LogOut size={18} className="mr-2" />
							Logout
						</button>
					</div>
				</div>

				<main className="flex-1 overflow-y-auto">
					<AnimatePresence mode="wait">
						<motion.div
							key={view}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2 }}
						>
							{view === "dashboard" ? <RoomDashboard /> : <AdminDashboard />}
						</motion.div>
					</AnimatePresence>
				</main>
			</div>
		</ToastProvider>
	);
};

export default MainLayout;
