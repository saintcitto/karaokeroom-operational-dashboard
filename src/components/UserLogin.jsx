import React, { useEffect } from "react";
import { Synth } from "tone";

export default function UserLogin({ onLogin }) {
  const users = [
    { name: "Baya Ganteng", role: "Admin" },
    { name: "Ayu", role: "Kasir" },
    { name: "Ridho", role: "Kasir" },
    { name: "Umi", role: "Kasir" },
    { name: "Faisal", role: "Petugas Karaoke" },
    { name: "Zahlul", role: "Petugas Karaoke" },
  ];

  useEffect(() => {
    const body = document.querySelector("body");
    body.style.background = "radial-gradient(circle at center, #1e1e2f, #0e0e15)";
    body.style.transition = "background 0.8s ease-in-out";
    return () => {
      body.style.background = "";
    };
  }, []);

  const playClickSound = () => {
    try {
      const synth = new Synth().toDestination();
      synth.triggerAttackRelease("E5", "16n");
    } catch (e) {
      console.warn("Sound init failed:", e);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-blue-900/10 via-fuchsia-900/10 to-indigo-900/10 blur-3xl"></div>

      {/* Main Card */}
      <div className="relative bg-gray-800/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-[22rem] border border-gray-700/60 text-center animate-fadeIn">
        <h1 className="text-3xl font-extrabold mb-4 bg-gradient-to-r from-fuchsia-400 via-pink-400 to-purple-400 text-transparent bg-clip-text drop-shadow-lg">
          Karaoke Room Dashboard
        </h1>
        <p className="text-gray-400 text-sm mb-6 tracking-wide">
          Pilih akun untuk masuk sistem operasional
        </p>

        <div className="space-y-3">
          {users.map((user) => (
            <button
              key={user.name}
              onClick={() => {
                playClickSound();
                onLogin(user.name);
              }}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 hover:from-fuchsia-600 hover:to-pink-600 
                text-white rounded-lg font-semibold tracking-wide shadow-md hover:shadow-xl hover:scale-[1.02]
                transition-all duration-300 ease-out focus:ring-2 focus:ring-pink-500/50"
            >
              {user.name}
              <span className="text-xs text-gray-200 font-normal"> ({user.role})</span>
            </button>
          ))}
        </div>

        <p className="mt-8 text-xs text-gray-500 tracking-wider opacity-80">
          © {new Date().getFullYear()} Sunwiha Systems — v1.0
        </p>
      </div>

      {/* Subtle Glow Layer */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-fuchsia-500/5 to-blue-600/5 animate-gradientMove"></div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradientMove {
          background-size: 200% 200%;
          animation: gradientMove 12s ease infinite;
        }
      `}</style>
    </div>
  );
}
