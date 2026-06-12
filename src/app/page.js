'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { Wifi, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // If already logged in, skip login screen
        const checkActiveSession = async () => {
            const { data: { session } } = await db.getSession();
            if (session) {
                router.replace('/admin');
            } else {
                setCheckingSession(false);
            }
        };
        checkActiveSession();
    }, [router]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const { data, error } = await db.signIn(email.trim(), password);

            if (error) {
                setErrorMsg(error.message || 'Email atau password salah!');
                setLoading(false);
            } else {
                router.push('/admin');
            }
        } catch (err) {
            setErrorMsg('Terjadi kesalahan koneksi. Coba lagi.');
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: '#080c14',
                color: '#f8fafc'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        border: '4px solid rgba(255,255,255,0.1)',
                        borderTop: '4px solid #3b82f6',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    <p style={{ fontWeight: 600 }}>Memuat halaman...</p>
                </div>
                <style jsx global>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="login-page-bg">
            {/* Animated Premium Background Glows */}
            <div className="login-glow-1"></div>
            <div className="login-glow-2"></div>

            <div className="login-card">
                <div className="login-header-section">
                    <div className="login-logo">
                        <Wifi size={32} />
                        <span>WiFi-ID</span>
                    </div>
                    <h2>Dashboard Admin</h2>
                    <p>Masuk dengan akun Supabase Anda untuk mengelola tagihan</p>
                </div>

                {errorMsg && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        marginBottom: '20px',
                        textAlign: 'center',
                        fontWeight: 600
                    }}>
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="email">Email Admin</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={18} />
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@email.com"
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '28px' }}>
                        <label htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={18} />
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Masukkan password"
                                required
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary btn-block">
                        <span>{loading ? 'Menghubungkan...' : 'Masuk ke Dashboard'}</span>
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
}
