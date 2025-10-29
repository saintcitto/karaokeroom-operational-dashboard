import React, { useState } from 'react';

export default function UserLogin({ onLogin }) {
  const [selectedUser, setSelectedUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!selectedUser) {
      setError('Pilih pengguna terlebih dahulu');
      return;
    }
    if (selectedUser === 'Baya Ganteng' && password !== 'Farha281200') {
      setError('Password salah');
      return;
    }
    onLogin(selectedUser);
    localStorage.setItem('currentUser', selectedUser);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-80">
        <h2 className="text-xl font-bold mb-4 text-center text-pink-400">Masuk Sebagai</h2>
        <select
          value={selectedUser}
          onChange={(e) => {
            setSelectedUser(e.target.value);
            setError('');
          }}
          className="w-full p-2 mb-3 bg-gray-700 rounded"
        >
          <option value="">-- Pilih Pengguna --</option>
          <option value="Ayu">Ayu</option>
          <option value="Ridho">Ridho</option>
          <option value="Umi">Umi</option>
          <option value="Baya Ganteng">Baya Ganteng (Admin)</option>
        </select>

        {selectedUser === 'Baya Ganteng' && (
          <input
            type="password"
            value={password}
            placeholder="Masukkan Password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-3 bg-gray-700 rounded"
          />
        )}

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button
          onClick={handleLogin}
          className="w-full bg-pink-600 hover:bg-pink-700 py-2 rounded font-semibold"
        >
          Masuk
        </button>
      </div>
    </div>
  );
}
