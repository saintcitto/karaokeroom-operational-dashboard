import React, { useState, useEffect } from "react";
import { start as ToneStart, context as ToneContext } from "tone";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

export default function UserLogin({ onLogin }) {
  const [adminMode, setAdminMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = getAuth();

  const users = [
    { name: "Baya Ganteng", role: "Admin" },
    { name: "Ayu", role: "Kasir" },
    { name: "Ridho", role: "Kasir" },
    { name: "Umi", role: "Kasir" },
    { name: "Faisal", role: "Petugas Karaoke" },
    { name: "Zahlul", role: "Petugas Karaoke" },
  ];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        console.log("✅ Firebase Admin Auth aktif:", firebaseUser.email);
      } else {
        console.warn("⚠️ Admin belum login ke Firebase Auth");
      }
    });
    return () => unsub();
  }, []);

  const unlockAudio = async (user) => {
    try {
      await ToneStart();
      await ToneContext.resume();
    } catch (err) {
      console.warn("Audio unlock failed:", err);
    }
    if (user === "Baya Ganteng") setAdminMode(true);
    else onLogin(user);
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("currentUser", "Baya Ganteng");
      onLogin("Baya Ganteng");
    } catch (err) {
      console.error("❌ Admin login failed:", err);
      setError("Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  if (adminMode) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <h2 className="text-xl font-semibold mb-4 text-pink-400">Login Admin</h2>
        <div className="w-72 space-y-3">
          <input
            type="email"
            placeholder="Email Admin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-pink-500 outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-pink-500 outline-none"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={handleAdminLogin}
            disabled={loading}
            className="w-full py-3 bg-pink-600 hover:bg-pink-700 rounded-lg font-semibold text-sm transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Login Admin"}
          </button>
          <button
            onClick={() => setAdminMode(false)}
            className="w-full text-xs text-gray-400 hover:text-gray-200 mt-2"
          >
            ← Kembali ke daftar pengguna
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-6 text-pink-400 tracking-wide">
        🎤 Karaoke Sonia Operational Dashboard
      </h1>
      <div className="grid grid-cols-2 gap-4 w-80">
        {users.map((user) => (
          <button
            key={user.name}
            onClick={() => unlockAudio(user.name)}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-pink-600 hover:border-pink-500 text-sm font-medium text-white transition-all duration-200 shadow-lg hover:shadow-pink-500/20"
          >
            {user.name}
            <div className="text-[11px] text-gray-400">{user.role}</div>
          </button>
        ))}
      </div>
      <footer className="absolute bottom-6 text-sm text-gray-500">sweet cherry pie 🍰</footer>
    </div>
  );
}
