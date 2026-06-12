'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Wifi, LayoutDashboard, Users, CreditCard, LogOut, Sun, Moon } from 'lucide-react';

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        // Initialize theme
        const savedTheme = localStorage.getItem('wifi_theme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('wifi_theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    useEffect(() => {
        // Check current session
        const checkUser = async () => {
            const { data: { session } } = await db.getSession();
            if (!session) {
                router.replace('/');
            } else {
                setUser(session.user || session); // handles mock session too
                setLoading(false);
            }
        };

        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = db.onAuthStateChange((_event, session) => {
            if (!session) {
                router.replace('/');
            } else {
                setUser(session.user || session);
                setLoading(false);
            }
        });

        return () => {
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        };
    }, [router]);

    const handleLogout = async () => {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            await db.signOut();
            router.replace('/');
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: '#080c14',
                color: '#f8fafc',
                fontFamily: 'sans-serif'
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
                    <p style={{ fontWeight: 600 }}>Memeriksa hak akses...</p>
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
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', transition: 'background-color 0.3s ease' }}>
            {/* Mobile Header */}
            <header className="mobile-header">
                <Link href="/admin" className="mobile-header-logo">
                    <Wifi size={20} style={{ color: '#3b82f6' }} />
                    <span>WiFi-ID</span>
                </Link>
                <div className="mobile-header-actions">
                    <button 
                        onClick={toggleTheme} 
                        style={{ 
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px'
                        }}
                        title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                    >
                        {theme === 'dark' ? <Sun size={20} style={{ color: '#f59e0b' }} /> : <Moon size={20} />}
                    </button>
                    <button 
                        onClick={handleLogout} 
                        style={{ 
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px'
                        }}
                        title="Keluar"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Header & Navigation */}
            <nav className="navbar">
                <div className="nav-container">
                    <div className="logo">
                        <Wifi className="logo-icon" size={24} style={{ color: '#3b82f6' }} />
                        <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>
                            WiFi-ID <span className="badge" style={{ backgroundColor: '#3b82f6', color: 'white', fontSize: '0.6rem', padding: '2px 6px', marginLeft: '6px' }}>Admin</span>
                        </span>
                    </div>

                    <div className="nav-menu">
                        <Link href="/admin" className={`nav-link ${pathname === '/admin' ? 'active' : ''}`}>
                            <LayoutDashboard size={18} />
                            <span>Dashboard</span>
                        </Link>
                        <Link href="/admin/pelanggan" className={`nav-link ${pathname === '/admin/pelanggan' ? 'active' : ''}`}>
                            <Users size={18} />
                            <span>Pelanggan</span>
                        </Link>
                        <Link href="/admin/pembayaran" className={`nav-link ${pathname === '/admin/pembayaran' ? 'active' : ''}`}>
                            <CreditCard size={18} />
                            <span>Pembayaran</span>
                        </Link>
                    </div>

                    <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                            onClick={toggleTheme} 
                            className="btn btn-outline btn-sm" 
                            style={{ 
                                padding: '8px', 
                                minWidth: '38px', 
                                minHeight: '38px', 
                                borderRadius: 'var(--radius-sm)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center' 
                            }}
                            title={theme === 'dark' ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
                        >
                            {theme === 'dark' ? <Sun size={18} style={{ color: '#f59e0b' }} /> : <Moon size={18} />}
                        </button>
                        <button onClick={handleLogout} className="btn btn-outline btn-sm" style={{ borderColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
                            <LogOut size={16} />
                            <span>Keluar</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Bottom Nav for Mobile is already styled in global.css */}

            <main className="app-container">
                {children}
            </main>
        </div>
    );
}
