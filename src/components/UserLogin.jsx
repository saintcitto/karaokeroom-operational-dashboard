import React, { useState } from "react";
import { start as ToneStart, context as ToneContext } from "tone";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function UserLogin({ onLogin }) {
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const users = [
    { id: 1, name: "Baya Ganteng", role: "Admin" },
    { id: 2, name: "Ayu", role: "Kasir" },
    { id: 3, name: "Ridho", role: "Kasir" },
    { id: 4, name: "Umi", role: "Kasir" },
    { id: 5, name: "Faisal", role: "Petugas Karaoke" },
    { id: 6, name: "Zahlul", role: "Petugas Karaoke" }
  ];

  const unlockAudio = async () => {
    try {
      await ToneStart();
      await ToneContext.resume();
      setAudioUnlocked(true);
    } catch {}
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("currentUser", "Baya Ganteng");
      onLogin("Baya Ganteng");
    } catch {
      setError("Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  if (!audioUnlocked) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <h1 className="text-2xl font-bold mb-4 text-pink-400">🎤 Karaoke Sonia Operational Dashboard</h1>
        <button
          onClick={unlockAudio}
          className="px-5 py-3 bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-600 hover:to-pink-700 rounded-lg text-white font-semibold shadow-md transition-all duration-300"
        >
          🔊 Aktifkan Audio
        </button>
        <p className="text-sm text-gray-400 mt-3">Klik untuk aktifkan sistem audio</p>
      </div>
    );
  }

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
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white relative overflow-hidden">
      <h1 className="text-2xl font-bold mb-6 text-pink-400 tracking-wide">🎤 Karaoke Sonia Operational Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 w-80">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => {
              if (user.name === "Baya Ganteng") setAdminMode(true);
              else {
                localStorage.setItem("currentUser", user.name);
                onLogin(user.name);
              }
            }}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-pink-600 hover:border-pink-500 text-sm font-medium text-white transition-all duration-200 shadow-lg hover:shadow-pink-500/20"
          >
            {user.name}
            <div className="text-[11px] text-gray-400">{user.role}</div>
          </button>
        ))}
      </div>
      <motionFooter />
    </div>
  );
}

function motionFooter() {
  return (
    <div className="absolute bottom-10 w-full flex flex-col items-center justify-center text-gray-400 select-none">
      <div className="text-sm font-light tracking-[0.2em]">
        {"sweet cherry pie".split("").map((c, i) => (
          <span key={i} className={c === " " ? "inline-block w-1" : "inline-block"} style={{ display: "inline-block", transformOrigin: "center" }}>
            {c}
          </span>
        ))}
        <span className="inline-block ml-2 text-pink-400" style={{ display: "inline-block" }}>🍰</span>
      </div>
      <div className="mt-2 w-36 h-[1px] bg-gradient-to-r from-transparent via-pink-400/40 to-transparent blur-[2px]" />
    </div>
  );
}
