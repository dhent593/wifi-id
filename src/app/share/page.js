'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/db';
import { Wifi, Printer, CheckCircle, AlertCircle, HelpCircle, MapPin, CalendarDays, Receipt, X } from 'lucide-react';

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
                background: '#080c14',
                color: '#f8fafc'
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
                background: '#080c14',
                padding: '16px'
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
        <div style={{ minHeight: '100vh', background: '#080c14' }}>
            {/* Header */}
            <header className="client-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wifi size={24} style={{ color: '#3b82f6' }} />
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>WiFi-ID</span>
                </div>
                <div>
                    <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                        <Printer size={16} />
                        <span>Cetak Bukti</span>
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
                        <div>
                            <h1 id="client-name" style={{ fontSize: '1.5rem', fontWeight: 800 }}>{user.name}</h1>
                            <p id="client-address" style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>
                                <MapPin size={14} style={{ marginRight: '4px' }} /> {user.address}
                            </p>
                            <p id="client-joined" style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
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
                            <table className="table">
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
                                                <td><strong>{payDateText}</strong></td>
                                                <td>{INDO_MONTHS[pay.month]} {pay.year}</td>
                                                <td><span className="text-muted">{pay.method}</span></td>
                                                <td><strong className="text-success">{formatRupiah(pay.amount_paid)}</strong></td>
                                                <td><span className={debt > 0 ? 'text-danger font-weight-bold' : 'text-muted'}>{formatRupiah(debt)}</span></td>
                                                <td style={{ maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={pay.notes}>
                                                    {pay.notes || '-'}
                                                </td>
                                                <td>
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
                    <p style={{ color: '#f8fafc', fontWeight: 600 }}>Terima kasih telah berlangganan layanan WiFi kami.</p>
                    <p className="small text-muted" style={{ fontSize: '0.75rem' }}>Jika Anda menemukan kesalahan pencatatan, silakan hubungi Admin.</p>
                </footer>
            </div>
        </div>
    );
}

export default function ClientSharePage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#080c14', color: '#f8fafc' }}>
                <p>Memuat halaman tagihan...</p>
            </div>
        }>
            <ClientShareContent />
        </Suspense>
    );
}
