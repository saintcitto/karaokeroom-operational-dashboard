import React from 'react';
import { AlertTriangle } from 'lucide-react';

// --- FIX: Komponen Error Boundary ---
// Menangkap error JavaScript di dalam tree komponen.
class KTVErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state agar render berikutnya menampilkan UI fallback.
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error ke konsol
    console.error("KTV Dashboard Error Boundary menangkap error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // UI Fallback kustom
      return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white flex-col p-8">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Terjadi Kesalahan</h1>
          <p className="text-gray-400 mb-4 text-center">
            Aplikasi KTV Dashboard mengalami error. Silakan refresh halaman.
          </p>
          <pre className="text-xs text-left bg-gray-800 p-4 rounded-md overflow-auto text-red-400">
            {this.state.error?.message || 'Error tidak diketahui'}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
// --- End of FIX ---

export default KTVErrorBoundary;
