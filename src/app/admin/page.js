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

    useEffect(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0 - 11
        
        setCurrentYear(year);
        setCurrentMonthName(INDO_MONTHS[month]);

        const fetchDashboardData = async () => {
            try {
                // 1. Fetch active users
                const { data: allUsers, error: usersErr } = await db.getPelanggan();
                if (usersErr) throw usersErr;
                const usersData = (allUsers || []).filter(u => u.status === 'aktif');

                // 2. Fetch payments for this year
                const { data: paymentsData, error: paymentsErr } = await db.getPembayaran(year);
                if (paymentsErr) throw paymentsErr;
                
                // Filter current month payments
                const currentMonthPayments = (paymentsData || []).filter(p => p.month === month);

                // 3. Compute stats
                const activeUsers = usersData || [];

                let incomeThisMonth = 0;
                let unpaidThisMonth = 0;
                const debtors = [];

                activeUsers.forEach(user => {
                    const joinedDate = new Date(user.joined);
                    const joinedY = joinedDate.getFullYear();
                    const joinedM = joinedDate.getMonth();

                    // Client is billable if they joined in or before current month/year
                    if (year > joinedY || (year === joinedY && month >= joinedM)) {
                        const userPay = currentMonthPayments.find(p => p.pelanggan_id === user.id);
                        
                        if (userPay) {
                            incomeThisMonth += userPay.amount_paid;
                            const debt = Math.max(0, user.fee - userPay.amount_paid);
                            if (debt > 0) {
                                unpaidThisMonth += debt;
                                debtors.push({ user, debt });
                            }
                        } else {
                            unpaidThisMonth += user.fee;
                            debtors.push({ user, debt: user.fee });
                        }
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
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Berikut ringkasan status pembayaran jaringan WiFi bulan ini.</p>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px'
            }}>
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
                        <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>Total Pelanggan</h3>
                        <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.totalUsers}</p>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Pelanggan aktif terdaftar</span>
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
                        <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>Pendapatan Bulan Ini</h3>
                        <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{formatRupiah(stats.incomeThisMonth)}</p>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Bulan {currentMonthName}</span>
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
                        <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>Total Tunggakan</h3>
                        <p style={{ fontSize: '1.75rem', fontWeight: 800 }} className="text-danger">{formatRupiah(stats.unpaidThisMonth)}</p>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Belum lunas bulan berjalan</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Largest Unpaid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr',
                gap: '24px'
            }} className="dashboard-details">
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
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Tunggakan Bulan Ini</h2>
                    <div className="table-responsive">
                        {unpaidDebtors.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                                <UserCheck size={36} style={{ color: '#10b981', marginBottom: '8px' }} />
                                <p style={{ fontWeight: 600 }}>Hebat! Semua pelanggan bulan ini sudah lunas.</p>
                            </div>
                        ) : (
                            <table className="table">
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
                                            <td>
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
                                                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{debtor.user.address}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{debtor.user.phone}</td>
                                            <td><strong className="text-danger">{formatRupiah(debtor.debt)}</strong></td>
                                            <td>
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
