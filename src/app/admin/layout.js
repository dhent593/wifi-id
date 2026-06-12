'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Wifi, LayoutDashboard, Users, CreditCard, LogOut } from 'lucide-react';

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

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
        <div style={{ minHeight: '100vh', background: '#080c14' }}>
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

                    <div className="nav-actions">
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
