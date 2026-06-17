'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/db';
import { Wifi, Printer, CheckCircle, AlertCircle, HelpCircle, MapPin, CalendarDays, Receipt, X, Sun, Moon } from 'lucide-react';

const INDO_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function ClientShareContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [user, setUser] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [currentYear, setCurrentYear] = useState(2026);
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
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
        const today = new Date();
        setCurrentYear(today.getFullYear());

        if (!token) {
            setErrorMsg('Token akses tidak ditemukan. Periksa kembali link yang dibagikan oleh Admin.');
            setLoading(false);
            return;
        }

        const fetchClientData = async () => {
            try {
                // 1. Fetch user by token
                const { data: userData, error: userErr } = await db.getPelangganByToken(token);

                if (userErr || !userData) {
                    setErrorMsg('Tautan tidak valid atau pelanggan tidak ditemukan. Hubungi Admin Anda.');
                    setLoading(false);
                    return;
                }

                setUser(userData);

                // 2. Fetch payments for this user
                const { data: paymentsData, error: paymentsErr } = await db.getPembayaranByClient(userData.id);

                if (paymentsErr) throw paymentsErr;
                setPayments(paymentsData || []);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching client data:', err);
                setErrorMsg('Terjadi kesalahan saat memuat data tagihan.');
                setLoading(false);
            }
        };

        fetchClientData();
    }, [token]);

    const formatRupiah = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'var(--bg-app)',
                color: 'var(--text-primary)',
                transition: 'background-color 0.3s ease, color 0.3s ease'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        border: '4px solid rgba(255,255,255,0.1)',
                        borderTop: '4px solid #3b82f6',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 12px'
                    }}></div>
                    <p style={{ fontWeight: 600 }}>Memuat data tagihan WiFi...</p>
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

    if (errorMsg) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'var(--bg-app)',
                padding: '16px',
                transition: 'background-color 0.3s ease'
            }}>
                <div className="card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '36px 24px' }}>
                    <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px', display: 'inline-block' }} />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px' }}>Akses Ditolak / Gagal</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6 }}>{errorMsg}</p>
                </div>
            </div>
        );
    }

    // Calculations
    const joinedDate = new Date(user.joined);
    const joinedYear = joinedDate.getFullYear();
    const joinedMonth = joinedDate.getMonth();

    const today = new Date();
    const thisYear = today.getFullYear();
    const thisMonth = today.getMonth();

    let totalPaid = 0;
    let totalDebt = 0;

    // We calculate current year summary
    const monthsStatusList = INDO_MONTHS.map((monthName, monthIdx) => {
        const isJoined = currentYear > joinedYear || (currentYear === joinedYear && monthIdx >= joinedMonth);
        
        if (!isJoined || user.status === 'nonaktif') {
            return { monthIdx, status: 'inactive', label: 'N/A', debt: 0, paid: 0 };
        }

        const record = payments.find(p => p.year === currentYear && p.month === monthIdx);
        const isFutureMonth = currentYear > thisYear || (currentYear === thisYear && monthIdx > thisMonth);
        
        if (record) {
            totalPaid += record.amount_paid;
            const debt = Math.max(0, user.fee - record.amount_paid);
            if (!isFutureMonth) {
                totalDebt += debt;
            }
            return {
                monthIdx,
                status: record.status, // 'paid' or 'partial'
                label: record.status === 'paid' ? 'LUNAS' : `KURANG ${formatRupiah(debt)}`,
                debt,
                paid: record.amount_paid
            };
        } else {
            if (isFutureMonth) {
                return {
                    monthIdx,
                    status: 'future',
                    label: 'BELUM TEMPO',
                    debt: 0,
                    paid: 0
                };
            } else {
                totalDebt += user.fee;
                return {
                    monthIdx,
                    status: 'unpaid',
                    label: 'BELUM BAYAR',
                    debt: user.fee,
                    paid: 0
                };
            }
        }
    });

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', transition: 'background-color 0.3s ease' }}>
            {/* Header */}
            <header className="client-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wifi size={24} style={{ color: '#3b82f6' }} />
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>WiFi-ID</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                        title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                    >
                        {theme === 'dark' ? <Sun size={18} style={{ color: '#f59e0b' }} /> : <Moon size={18} />}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                        <Printer size={16} />
                        <span className="hidden-mobile">Cetak Bukti</span>
                    </button>
                </div>
            </header>

            <div className="client-container" style={{ paddingBottom: '32px' }}>
                {/* Client Profile Summary Card */}
                <div className="client-profile-card">
                    <div className="profile-main">
                        <div className="avatar">
                            <Wifi size={28} />
                        </div>
                        <div className="profile-info">
                            <h1 id="client-name" style={{ fontSize: '1.5rem', fontWeight: 800 }}>{user.name}</h1>
                            <p id="client-address" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                                <MapPin size={14} style={{ marginRight: '4px' }} /> {user.address}
                            </p>
                            <p id="client-joined" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                                <CalendarDays size={14} style={{ marginRight: '4px' }} /> Bergabung sejak: {joinedDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div className="profile-status-summary">
                        <div className="p-status-item">
                            <span className="label">Biaya Paket</span>
                            <span className="value" style={{ color: '#3b82f6' }}>{formatRupiah(user.fee)}</span>
                        </div>
                        <div className="p-status-item">
                            <span className="label">Total Terbayar</span>
                            <span className="value text-success">{formatRupiah(totalPaid)}</span>
                        </div>
                        <div className="p-status-item highlight">
                            <span className="label" style={{ color: '#ef4444' }}>Sisa Tunggakan</span>
                            <span className="value text-danger">{formatRupiah(totalDebt)}</span>
                        </div>
                    </div>
                </div>

                {/* Rincian Tunggakan alert if any */}
                {totalDebt > 0 && (
                    <div className="card" style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px 20px',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <AlertCircle size={18} />
                            Rincian Bulan Belum Lunas
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', margin: '0 0 8px 0' }}>
                            Silakan lakukan pelunasan untuk tagihan bulan-bulan berikut:
                        </p>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {(() => {
                                const unpaidList = [];
                                const maxMonthToCheck = currentYear < thisYear ? 11 : (currentYear === thisYear ? thisMonth : -1);
                                for (let m = 0; m <= maxMonthToCheck; m++) {
                                    const isJoined = currentYear > joinedYear || (currentYear === joinedYear && m >= joinedMonth);
                                    if (isJoined) {
                                        const pay = payments.find(p => p.year === currentYear && p.month === m);
                                        if (!pay) {
                                            unpaidList.push({ name: INDO_MONTHS[m], debt: user.fee });
                                        } else if (pay.status === 'partial') {
                                            const debt = Math.max(0, user.fee - pay.amount_paid);
                                            unpaidList.push({ name: INDO_MONTHS[m], debt, partial: true });
                                        }
                                    }
                                }
                                return unpaidList.map((m, idx) => (
                                    <li key={idx} style={{ marginBottom: '4px' }}>
                                        <strong>{m.name} {currentYear}</strong>: {m.partial ? `Kurang ${formatRupiah(m.debt)}` : `Belum Bayar (${formatRupiah(m.debt)})`}
                                    </li>
                                ));
                            })()}
                        </ul>
                    </div>
                )}

                {/* Timeline Grid */}
                <div className="card-box card">
                    <div className="card-box-header" style={{ marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Status Pembayaran Tahun {currentYear}</h2>
                    </div>
                    <div className="client-months-grid">
                        {monthsStatusList.map((m) => {
                            let statusClass = 'inactive';
                            let icon = <HelpCircle size={22} />;

                            if (m.status === 'paid') {
                                statusClass = 'paid';
                                icon = <CheckCircle size={22} />;
                            } else if (m.status === 'partial') {
                                statusClass = 'partial';
                                icon = <AlertCircle size={22} />;
                            } else if (m.status === 'unpaid') {
                                statusClass = 'unpaid';
                                icon = <X size={22} />;
                            } else if (m.status === 'future') {
                                statusClass = 'future';
                                icon = <CalendarDays size={22} />;
                            }

                            return (
                                <div key={m.monthIdx} className={`client-month-card ${statusClass}`}>
                                    <span className="month-name" style={{ fontSize: '0.8rem', fontWeight: 700 }}>{INDO_MONTHS[m.monthIdx]}</span>
                                    <div className="status-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {icon}
                                    </div>
                                    <span className="status-text" style={{ fontSize: '0.7rem' }}>{m.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* History Table */}
                <div className="card-box card">
                    <div className="card-box-header" style={{ marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Semua Riwayat Transaksi</h2>
                    </div>
                    <div className="table-responsive">
                        {payments.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                                <Receipt size={32} style={{ marginBottom: '8px', color: '#64748b' }} />
                                <p>Belum ada riwayat transaksi pembayaran.</p>
                            </div>
                        ) : (
                            <table className="table mobile-card-table">
                                <thead>
                                    <tr>
                                        <th>Tanggal Bayar</th>
                                        <th>Bulan Tagihan</th>
                                        <th>Metode</th>
                                        <th>Jumlah Bayar</th>
                                        <th>Kekurangan</th>
                                        <th>Keterangan</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map(pay => {
                                        const payDateText = new Date(pay.date).toLocaleDateString('id-ID', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        });

                                        const debt = Math.max(0, user.fee - pay.amount_paid);

                                        return (
                                            <tr key={pay.id}>
                                                <td data-label="Tanggal"><strong>{payDateText}</strong></td>
                                                <td data-label="Bulan">{INDO_MONTHS[pay.month]} {pay.year}</td>
                                                <td data-label="Metode"><span className="text-muted">{pay.method}</span></td>
                                                <td data-label="Jumlah"><strong className="text-success">{formatRupiah(pay.amount_paid)}</strong></td>
                                                <td data-label="Kekurangan"><span className={debt > 0 ? 'text-danger font-weight-bold' : 'text-muted'}>{formatRupiah(debt)}</span></td>
                                                <td data-label="Keterangan" style={{ maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={pay.notes}>
                                                    {pay.notes || '-'}
                                                </td>
                                                <td data-label="Status">
                                                    <span className={`badge ${pay.status === 'paid' ? 'badge-paid' : 'badge-partial'}`}>
                                                        {pay.status === 'paid' ? 'Lunas' : 'Kurang'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <footer className="client-footer" style={{ marginTop: '24px' }}>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Terima kasih telah berlangganan layanan WiFi kami.</p>
                    <p className="small text-muted" style={{ fontSize: '0.75rem' }}>Jika Anda menemukan kesalahan pencatatan, silakan hubungi Admin.</p>
                </footer>
            </div>

            {/* Invoice Print Layout (Print Only - Formal IndiHome style) */}
            <div className="invoice-print-layout">
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #ef4444', paddingBottom: '16px', marginBottom: '24px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ width: '32px', height: '32px', backgroundColor: '#ef4444', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>WF</div>
                            <span style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b', letterSpacing: '-0.03em' }}>WiFi-<span style={{ color: '#ef4444' }}>ID</span></span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Layanan Internet Cepat & Stabil</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ef4444', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lembar Tagihan</h2>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>No: INV/{currentYear}/WF-{user.token}</span>
                    </div>
                </div>

                {/* Info Metadata & Status Stamp */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
                    {/* Billing Info */}
                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Detail Tagihan</h3>
                        <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '6px 0', color: '#64748b', fontWeight: 500 }}>Periode Tagihan</td>
                                    <td style={{ padding: '6px 0', fontWeight: 700, color: '#1e293b', textAlign: 'right' }}>{INDO_MONTHS[thisMonth]} {thisYear}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '6px 0', color: '#64748b', fontWeight: 500 }}>Tanggal Cetak</td>
                                    <td style={{ padding: '6px 0', fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>{new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '6px 0', color: '#64748b', fontWeight: 500 }}>Jatuh Tempo</td>
                                    <td style={{ padding: '6px 0', fontWeight: 700, color: '#ef4444', textAlign: 'right' }}>Tanggal 20 {INDO_MONTHS[thisMonth]} {thisYear}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Status Stamp */}
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: totalDebt === 0 ? '3px double #10b981' : '3px double #ef4444',
                        backgroundColor: totalDebt === 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center'
                    }}>
                        <span style={{ 
                            fontSize: '0.8rem', 
                            fontWeight: 700, 
                            color: totalDebt === 0 ? '#10b981' : '#ef4444', 
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: '4px'
                        }}>Status Pembayaran</span>
                        <strong style={{ 
                            fontSize: '1.8rem', 
                            fontWeight: 900, 
                            color: totalDebt === 0 ? '#10b981' : '#ef4444',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            {totalDebt === 0 ? 'Lunas' : 'Belum Lunas'}
                        </strong>
                    </div>
                </div>

                {/* Customer Info Section */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', marginBottom: '28px' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>Data Pelanggan</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '0.85rem' }}>
                        <div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '4px 0', color: '#64748b', width: '120px' }}>ID Pelanggan</td>
                                        <td style={{ padding: '4px 0', fontWeight: 700, color: '#1e293b' }}>WF-{user.token}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '4px 0', color: '#64748b' }}>Nama Pelanggan</td>
                                        <td style={{ padding: '4px 0', fontWeight: 600, color: '#1e293b' }}>{user.name}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '4px 0', color: '#64748b' }}>No. HP</td>
                                        <td style={{ padding: '4px 0', color: '#1e293b' }}>{user.phone}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '4px 0', color: '#64748b', verticalAlign: 'top', width: '120px' }}>Alamat Instalasi</td>
                                        <td style={{ padding: '4px 0', color: '#1e293b', fontWeight: 500, lineHeight: 1.4 }}>{user.address}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '4px 0', color: '#64748b' }}>Tanggal Pasang</td>
                                        <td style={{ padding: '4px 0', color: '#1e293b' }}>{joinedDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Items Breakdown Table */}
                <div style={{ marginBottom: '28px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontWeight: 700, width: '40px' }}>No</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Deskripsi Layanan</th>
                                <th style={{ padding: '10px 12px', textAlign: 'right', color: '#475569', fontWeight: 700, width: '150px' }}>Jumlah</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '12px', color: '#64748b', verticalAlign: 'top' }}>1</td>
                                <td style={{ padding: '12px' }}>
                                    <strong style={{ display: 'block', color: '#1e293b' }}>Biaya Layanan Internet WiFi-ID</strong>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Paket Bulanan WiFi 150Mbps - Periode {INDO_MONTHS[thisMonth]} {thisYear}</span>
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#ef4444', verticalAlign: 'top' }}>{formatRupiah(user.fee)}</td>
                            </tr>
                            {/* Previous Unpaid Debt */}
                            {(() => {
                                const currentMonthRecord = payments.find(p => p.year === thisYear && p.month === thisMonth);
                                const currentMonthPaid = currentMonthRecord ? currentMonthRecord.amount_paid : 0;
                                const previousMonthsDebt = totalDebt - (user.fee - currentMonthPaid);

                                if (previousMonthsDebt > 0) {
                                    // Cari daftar bulan lalu yang belum lunas
                                    const unpaidMonthsList = [];
                                    for (let m = 0; m < thisMonth; m++) {
                                        const isJoined = thisYear > joinedYear || (thisYear === joinedYear && m >= joinedMonth);
                                        if (isJoined) {
                                            const pay = payments.find(p => p.year === thisYear && p.month === m);
                                            if (!pay) {
                                                unpaidMonthsList.push(`${INDO_MONTHS[m]} ${thisYear}`);
                                            } else if (pay.status === 'partial') {
                                                const debt = Math.max(0, user.fee - pay.amount_paid);
                                                unpaidMonthsList.push(`${INDO_MONTHS[m]} ${thisYear} (Kurang ${formatRupiah(debt)})`);
                                            }
                                        }
                                    }

                                    const unpaidMonthsText = unpaidMonthsList.length > 0 
                                        ? `: ${unpaidMonthsList.join(', ')}` 
                                        : '';

                                    return (
                                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '12px', color: '#64748b', verticalAlign: 'top' }}>2</td>
                                            <td style={{ padding: '12px' }}>
                                                <strong style={{ display: 'block', color: '#1e293b' }}>Tunggakan Tagihan Sebelumnya</strong>
                                                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>
                                                    Akumulasi tagihan bulan-bulan sebelumnya yang belum dilunasi{unpaidMonthsText}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#ef4444', verticalAlign: 'top' }}>{formatRupiah(previousMonthsDebt)}</td>
                                        </tr>
                                    );
                                }
                                return null;
                            })()}
                        </tbody>
                    </table>
                </div>

                {/* Payment Breakdown Calculation Section */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
                    <div style={{ width: '320px', fontSize: '0.85rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '6px 0', color: '#64748b' }}>Total Tagihan</td>
                                    <td style={{ padding: '6px 0', fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>
                                        {(() => {
                                            const currentMonthRecord = payments.find(p => p.year === thisYear && p.month === thisMonth);
                                            const currentMonthPaid = currentMonthRecord ? currentMonthRecord.amount_paid : 0;
                                            const previousMonthsDebt = totalDebt - (user.fee - currentMonthPaid);
                                            return formatRupiah(user.fee + (previousMonthsDebt > 0 ? previousMonthsDebt : 0));
                                        })()}
                                    </td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                    <td style={{ padding: '6px 0', color: '#64748b' }}>Total Terbayar</td>
                                    <td style={{ padding: '6px 0', fontWeight: 600, color: '#10b981', textAlign: 'right' }}>
                                        {(() => {
                                            const currentMonthRecord = payments.find(p => p.year === thisYear && p.month === thisMonth);
                                            const currentMonthPaid = currentMonthRecord ? currentMonthRecord.amount_paid : 0;
                                            return formatRupiah(currentMonthPaid);
                                        })()}
                                    </td>
                                </tr>
                                <tr style={{ fontSize: '1.05rem' }}>
                                    <td style={{ padding: '12px 0 6px', fontWeight: 700, color: '#1e293b' }}>Sisa Pembayaran</td>
                                    <td style={{ padding: '12px 0 6px', fontWeight: 800, color: totalDebt === 0 ? '#10b981' : '#ef4444', textAlign: 'right' }}>
                                        {formatRupiah(totalDebt)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment Instructions & Footer */}
                <div style={{ borderTop: '2px solid #cbd5e1', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', fontSize: '0.8rem', color: '#475569' }}>
                    <div>
                        <h4 style={{ fontWeight: 700, color: '#1e293b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Metode Pembayaran Resmi</h4>
                        <p style={{ margin: '0 0 6px', lineHeight: 1.4 }}>1. **Transfer Bank / Virtual Account** (Mandiri/BCA/BNI/BRI):</p>
                        <p style={{ margin: '0 0 10px 14px', fontWeight: 600, color: '#1e293b' }}>Hubungi Admin WiFi-ID untuk detail Nomor Rekening Resmi.</p>
                        <p style={{ margin: '0 0 6px', lineHeight: 1.4 }}>2. **Pembayaran Tunai (Cash)**:</p>
                        <p style={{ margin: '0 0 10px 14px', lineHeight: 1.4 }}>Silakan membayar langsung ke Admin WiFi-ID resmi di kantor/lokasi instalasi terdekat.</p>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontStyle: 'italic', margin: 0, lineHeight: 1.4 }}>"Lembar tagihan ini diterbitkan secara resmi oleh sistem WiFi-ID. Mohon lakukan pembayaran tepat waktu."</p>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <div style={{ borderTop: '1px solid #cbd5e1', display: 'inline-block', width: '160px', padding: '4px 0 0', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                                WiFi-ID Billing System
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ClientSharePage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-app)', color: 'var(--text-primary)', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
                <p>Memuat halaman tagihan...</p>
            </div>
        }>
            <ClientShareContent />
        </Suspense>
    );
}
