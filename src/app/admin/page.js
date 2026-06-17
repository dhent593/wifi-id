'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Users, HandCoins, AlertCircle, Calendar, Plus, Coins, UserCheck } from 'lucide-react';
import Link from 'next/link';

const INDO_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        incomeThisMonth: 0,
        unpaidThisMonth: 0
    });
    const [unpaidDebtors, setUnpaidDebtors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonthName, setCurrentMonthName] = useState('');
    const [currentYear, setCurrentYear] = useState(2026);
    const [isLocalMode, setIsLocalMode] = useState(false);
    const [hasLocalData, setHasLocalData] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');
    const [syncStatus, setSyncStatus] = useState('');

    useEffect(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0 - 11
        
        setCurrentYear(year);
        setCurrentMonthName(INDO_MONTHS[month]);
        setIsLocalMode(db.getMode() === 'local');
        setHasLocalData(db.hasLocalData());

        const fetchDashboardData = async () => {
            try {
                // 1. Fetch active users
                const { data: allUsers, error: usersErr } = await db.getPelanggan();
                if (usersErr) throw usersErr;
                const usersData = (allUsers || []).filter(u => u.status === 'aktif');

                // 2. Fetch payments for this year
                const { data: paymentsData, error: paymentsErr } = await db.getPembayaran(year);
                if (paymentsErr) throw paymentsErr;
                
                // Calculate current month's income
                let incomeThisMonth = 0;
                const currentMonthPayments = (paymentsData || []).filter(p => p.month === month);
                currentMonthPayments.forEach(p => {
                    incomeThisMonth += p.amount_paid;
                });

                // 3. Compute stats (accumulated unpaid debt from join month to current month)
                const activeUsers = usersData || [];
                let unpaidThisMonth = 0;
                const debtors = [];

                activeUsers.forEach(user => {
                    const joinedDate = new Date(user.joined);
                    const joinedY = joinedDate.getFullYear();
                    const joinedM = joinedDate.getMonth();

                    let userTotalDebt = 0;

                    // Loop from January (0) to current month of this year
                    for (let m = 0; m <= month; m++) {
                        const isJoined = year > joinedY || (year === joinedY && m >= joinedM);
                        if (isJoined) {
                            const pay = (paymentsData || []).find(p => p.pelanggan_id === user.id && p.month === m);
                            if (pay) {
                                const debt = Math.max(0, user.fee - pay.amount_paid);
                                userTotalDebt += debt;
                            } else {
                                userTotalDebt += user.fee;
                            }
                        }
                    }

                    if (userTotalDebt > 0) {
                        unpaidThisMonth += userTotalDebt;
                        debtors.push({ user, debt: userTotalDebt });
                    }
                });

                // Sort debtors by largest debt descending
                debtors.sort((a, b) => b.debt - a.debt);

                setStats({
                    totalUsers: activeUsers.length,
                    incomeThisMonth,
                    unpaidThisMonth
                });
                setUnpaidDebtors(debtors);
                setLoading(false);
            } catch (err) {
                console.error('Gagal mengambil data dashboard:', err);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleSyncData = async () => {
        if (!confirm('Apakah Anda yakin ingin menyinkronkan data lokal ke database cloud? Setelah sinkronisasi berhasil, data lokal di browser ini akan dibersihkan.')) {
            return;
        }

        setSyncing(true);
        setSyncMessage('');
        setSyncStatus('');

        try {
            const res = await db.syncLocalDataToCloud();
            if (res.success) {
                setSyncStatus('success');
                setSyncMessage(`Sinkronisasi sukses! ${res.usersCount} pelanggan dan ${res.paymentsCount} pembayaran berhasil diunggah ke cloud.`);
                setHasLocalData(false);
                
                // Refresh dashboard data
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            } else {
                setSyncStatus('error');
                setSyncMessage(`Gagal menyinkronkan data: ${res.error}`);
            }
        } catch (err) {
            setSyncStatus('error');
            setSyncMessage(`Terjadi kesalahan sistem: ${err.message || err}`);
        } finally {
            setSyncing(false);
        }
    };

    const formatRupiah = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
                <p>Memuat data dasbor...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Welcome Banner */}
            <div className="card" style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                padding: '28px'
            }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>Halo Admin, Selamat Datang!</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Berikut ringkasan status pembayaran jaringan WiFi bulan ini.</p>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'var(--bg-input)',
                    padding: '8px 16px',
                    borderRadius: '30px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: '1px solid var(--border-color)'
                }}>
                    <Calendar size={16} />
                    <span>{currentMonthName} {currentYear}</span>
                </div>
            </div>

            {/* Warning Banner for Local Fallback Mode */}
            {isLocalMode && (
                <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px 24px',
                    color: 'var(--warning)',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: 'var(--warning)' }}>
                        <AlertCircle size={20} />
                        Perhatian: Aplikasi Berjalan dalam Mode Fallback Lokal (Penyimpanan Sementara)
                    </strong>
                    <p style={{ margin: 0, color: 'var(--text-primary)' }}>
                        Saat ini data Anda disimpan di memori browser lokal perangkat ini. <strong>Link tagihan pelanggan tidak akan dapat diakses dari perangkat lain, browser lain, atau dalam mode Incognito/Samaran.</strong>
                    </p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <strong>Penyebab:</strong> Anda masuk menggunakan kredensial cadangan lokal atau autentikasi cloud gagal/belum terkonfigurasi.
                    </p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <strong>Solusi:</strong> Hubungkan database cloud dengan membuat user admin baru ber-email <code>admin@gmail.com</code> dan password <code>palamana</code> di menu <strong>Authentication -&gt; Users</strong> di dashboard Supabase proyek Anda. Setelah dibuat, klik <strong>Keluar</strong> di pojok kanan atas aplikasi ini, lalu login kembali menggunakan kredensial tersebut untuk mengaktifkan sinkronisasi database cloud secara otomatis.
                    </p>
                </div>
            )}

            {/* Sync Local Data Banner */}
            {!isLocalMode && hasLocalData && (
                <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px 24px',
                    color: 'var(--success)',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: 'var(--success)' }}>
                        <Coins size={20} />
                        Sinkronisasi Data Lokal Ditemukan!
                    </strong>
                    <p style={{ margin: 0, color: 'var(--text-primary)' }}>
                        Terdapat data pelanggan dan pembayaran yang tersimpan secara lokal di browser ini (dari sesi offline/fallback sebelumnya). 
                        Anda dapat menyinkronkan data tersebut ke database cloud Supabase agar pelanggan dapat mengakses tautan tagihan mereka di mana saja dan kapan saja.
                    </p>
                    {syncMessage && (
                        <div style={{ 
                            padding: '8px 12px', 
                            backgroundColor: syncStatus === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: syncStatus === 'error' ? '#ef4444' : '#10b981',
                            borderRadius: '6px',
                            fontSize: '0.85rem'
                        }}>
                            {syncMessage}
                        </div>
                    )}
                    <div>
                        <button 
                            className="btn btn-success" 
                            disabled={syncing}
                            onClick={handleSyncData}
                            style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                textDecoration: 'none',
                                border: 'none',
                                cursor: syncing ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {syncing ? 'Menyinkronkan...' : 'Sinkronkan Data ke Cloud Sekarang'}
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Users size={26} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Total Pelanggan</h3>
                        <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.totalUsers}</p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pelanggan aktif terdaftar</span>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        backgroundColor: 'var(--success-light)',
                        color: 'var(--success)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <HandCoins size={26} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Pendapatan Bulan Ini</h3>
                        <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{formatRupiah(stats.incomeThisMonth)}</p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bulan {currentMonthName}</span>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        backgroundColor: 'var(--danger-light)',
                        color: 'var(--danger)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <AlertCircle size={26} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Total Tunggakan</h3>
                        <p style={{ fontSize: '1.75rem', fontWeight: 800 }} className="text-danger">{formatRupiah(stats.unpaidThisMonth)}</p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total tunggakan belum lunas</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Largest Unpaid */}
            <div className="dashboard-details">
                {/* Quick Actions */}
                <div className="card" style={{ height: 'fit-content' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Aksi Cepat</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <Link href="/admin/pelanggan" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                            <Plus size={18} />
                            <span>Kelola Pelanggan</span>
                        </Link>
                        <Link href="/admin/pembayaran" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                            <Coins size={18} />
                            <span>Catat Pembayaran</span>
                        </Link>
                    </div>
                </div>

                {/* Largest Unpaid Users */}
                <div className="card">
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Daftar Tunggakan Pelanggan</h2>
                    <div className="table-responsive">
                        {unpaidDebtors.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                                <UserCheck size={36} style={{ color: '#10b981', marginBottom: '8px' }} />
                                <p style={{ fontWeight: 600 }}>Hebat! Semua tagihan pelanggan lunas.</p>
                            </div>
                        ) : (
                            <table className="table mobile-card-table">
                                <thead>
                                    <tr>
                                        <th>Pelanggan</th>
                                        <th>No. HP</th>
                                        <th>Tunggakan</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unpaidDebtors.map(debtor => (
                                        <tr key={debtor.user.id}>
                                            <td data-label="Pelanggan">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        backgroundColor: 'var(--primary-light)',
                                                        color: 'var(--primary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700,
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {debtor.user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{debtor.user.name}</strong>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{debtor.user.address}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="No. HP">{debtor.user.phone}</td>
                                            <td data-label="Tunggakan"><strong className="text-danger">{formatRupiah(debtor.debt)}</strong></td>
                                            <td data-label="Aksi">
                                                <Link href="/admin/pembayaran" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                                                    Bayar
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
