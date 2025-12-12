import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, AlertTriangle } from "lucide-react";
import { useSession } from "../context/SessionContext";

export default function LoginScreen() {
	const [userId, setUserId] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { login } = useSession();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			await login(userId, password);
		} catch (err) {
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex items-center justify-center min-h-screen px-6 bg-gray-100 dark:bg-gray-900">
			<motion.div
				initial={{ y: -20, opacity: 0, scale: 0.95 }}
				animate={{ y: 0, opacity: 1, scale: 1 }}
				transition={{ duration: 0.45, ease: "easeOut" }}
				className="
          w-full max-w-sm 
          p-10 
          bg-white dark:bg-gray-800 
          rounded-3xl 
          shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)]
          border border-gray-200 dark:border-gray-700
        "
			>
				<div className="flex justify-center mb-8">
					<motion.div
						initial={{ rotate: -20, opacity: 0 }}
						animate={{ rotate: 0, opacity: 1 }}
						transition={{ duration: 0.4, delay: 0.2 }}
					>
						<Mic size={54} className="text-blue-500 drop-shadow-md" />
					</motion.div>
				</div>

				<h2 className="mb-2 text-3xl font-extrabold tracking-tight text-center text-gray-800 dark:text-white">
					Karaoke Dashboard
				</h2>
				<p className="mb-10 text-sm text-center text-gray-500 dark:text-gray-400">
					Silakan login untuk melanjutkan
				</p>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label
							htmlFor="userId"
							className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
						>
							User ID
						</label>

						<input
							id="userId"
							value={userId}
							onChange={(e) => setUserId(e.target.value)}
							type="text"
							className="
      w-full px-4 py-3.5 
      bg-gray-100 dark:bg-gray-700
      border border-gray-300 dark:border-gray-600 
      rounded-xl 
      text-gray-800 dark:text-white
      placeholder-gray-500 dark:placeholder-gray-400
      focus:outline-none 
      focus:ring-2 focus:ring-blue-500
    "
							placeholder="e.g., staff01"
						/>
					</div>

					<div>
						<label
							htmlFor="password"
							className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
						>
							Password
						</label>

						<input
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							type="password"
							className="
      w-full px-4 py-3.5 
      bg-gray-100 dark:bg-gray-700
      border border-gray-300 dark:border-gray-600 
      rounded-xl 
      text-gray-800 dark:text-white
      placeholder-gray-500 dark:placeholder-gray-400
      focus:outline-none 
      focus:ring-2 focus:ring-blue-500
    "
							placeholder="••••••••"
						/>
					</div>

					{error && (
						<motion.div
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							className="flex items-center p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg  dark:bg-red-900/30 dark:border-red-700 dark:text-red-300"
						>
							<AlertTriangle size={18} className="mr-2" />
							{error}
						</motion.div>
					)}

					<motion.button
						type="submit"
						whileTap={{ scale: 0.97 }}
						disabled={isLoading}
						className="
              w-full 
              bg-blue-600 hover:bg-blue-700 
              text-white 
              py-3.5 
              rounded-xl 
              font-semibold 
              shadow-lg shadow-blue-600/40
              transition-all 
              disabled:opacity-60
            "
					>
						{isLoading ? "Logging in..." : "Login"}
					</motion.button>
				</form>
			</motion.div>
		</div>
	);
}
