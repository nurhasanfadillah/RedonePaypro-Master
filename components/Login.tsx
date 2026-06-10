import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        const user = await DataService.login(username, password);
        if (user) {
            login(user);
        } else {
            setError('Username atau Password salah');
        }
    } catch (err) {
        setError('Terjadi kesalahan saat login.');
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-slate-200 dark:border-dark-border overflow-hidden animate-fade-in">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-8 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <span className="text-3xl font-bold text-white">R</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">RedonePaypro</h1>
            <p className="text-slate-300 text-sm">Sistem Manajemen Produksi Borongan</p>
        </div>
        
        <div className="p-8">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">Silahkan Login</h2>
            
            {error && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Masukkan username"
                        required
                        disabled={loading}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Masukkan password"
                        required
                        disabled={loading}
                    />
                </div>
                
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-600/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <><LogIn size={20} /> Login Masuk</>}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Login;