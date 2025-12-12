import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
	const [toasts, setToasts] = useState([]);

	const addToast = useCallback((message, type = "success") => {
		const id = Date.now();
		setToasts((prev) => [...prev, { id, message, type }]);

		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 3000);
	}, []);

	const removeToast = (id) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	};

	return (
		<ToastContext.Provider value={{ addToast }}>
			{children}

			{/* Container Toast Mengambang */}
			<div className="fixed top-5 right-5 z-[1000] flex flex-col gap-3 pointer-events-none">
				<AnimatePresence>
					{toasts.map((toast) => (
						<motion.div
							key={toast.id}
							initial={{ opacity: 0, x: 50, scale: 0.9 }}
							animate={{ opacity: 1, x: 0, scale: 1 }}
							exit={{ opacity: 0, x: 50, scale: 0.9 }}
							layout
							className={`
                pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border w-80
                ${
									toast.type === "success"
										? "bg-white dark:bg-gray-800 border-green-500/50 text-gray-800 dark:text-white"
										: "bg-white dark:bg-gray-800 border-red-500/50 text-gray-800 dark:text-white"
								}
              `}
						>
							{toast.type === "success" ? (
								<CheckCircle className="text-green-500" size={20} />
							) : (
								<XCircle className="text-red-500" size={20} />
							)}
							<div className="flex-1 text-sm font-medium">{toast.message}</div>
							<button
								onClick={() => removeToast(toast.id)}
								className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
							>
								<X size={16} />
							</button>
						</motion.div>
					))}
				</AnimatePresence>
			</div>
		</ToastContext.Provider>
	);
};

export const useToast = () => useContext(ToastContext);
