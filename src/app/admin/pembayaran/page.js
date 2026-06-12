'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { Calendar, Check, X, CreditCard, ChevronRight, HelpCircle, Save } from 'lucide-react';

const INDO_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function PembayaranPage() {
    const [users, setUsers] = useState([]);
    const [payments, setPayments] = useState([]);
    const [selectedYear, setSelectedYear] = useState(2026);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    
    // Form states
    const [formData, setFormData] = useState({
        amountPaid: '',
        date: '',
        method: 'Transfer Bank',
        notes: ''
    });

    const [toastMsg, setToastMsg] = useState('');
    const [toastType, setToastType] = useState('success');

    useEffect(() => {
        fetchData();
    }, [selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch users
            const { data: usersData, error: usersErr } = await db.getPelanggan();

            if (usersErr) throw usersErr;
            setUsers(usersData || []);

            // 2. Fetch payments for selected year
            const { data: paymentsData, error: paymentsErr } = await db.getPembayaran(selectedYear);

            if (paymentsErr) throw paymentsErr;
            setPayments(paymentsData || []);
        } catch (err) {
            console.error('Error fetching data:', err);
            showToast('Gagal memuat data pembayaran', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg, type = 'success') => {
        setToastMsg(msg);
        setToastType(type);
        setTimeout(() => setToastMsg(''), 3000);
    };

    const formatRupiah = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getPaymentRecord = (userId, month) => {
        return payments.find(p => p.pelanggan_id === userId && p.month === month);
    };

    // Open Modal
    const openPaymentModal = (user, month) => {
        // Validate if client was already joined during this month
        const joinedDate = new Date(user.joined);
        const joinedY = joinedDate.getFullYear();
        const joinedM = joinedDate.getMonth();

        const isJoined = selectedYear > joinedY || (selectedYear === joinedY && month >= joinedM);
        if (!isJoined || user.status === 'nonaktif') return; // Cannot edit N/A months

        setSelectedUser(user);
        setSelectedMonth(month);

        const existingRecord = getPaymentRecord(user.id, month);

        if (existingRecord) {
            setFormData({
                amountPaid: existingRecord.amount_paid,
                date: existingRecord.date,
                method: existingRecord.method,
                notes: existingRecord.notes || ''
            });
        } else {
            setFormData({
                amountPaid: '',
                date: new Date().toISOString().substring(0, 10),
                method: 'Transfer Bank',
                notes: ''
            });
        }

        setModalOpen(true);
    };

    // Quick pay full amount helper
    const handlePayFull = () => {
        if (selectedUser) {
            setFormData({
                ...formData,
                amountPaid: selectedUser.fee
            });
        }
    };

    // Submit payment
    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        try {
            const amountPaid = parseInt(formData.amountPaid);
            let status = 'unpaid';
            if (amountPaid >= selectedUser.fee) {
                status = 'paid';
            } else if (amountPaid > 0) {
                status = 'partial';
            }

            const payload = {
                pelanggan_id: selectedUser.id,
                year: selectedYear,
                month: selectedMonth,
                amount_paid: amountPaid,
                date: formData.date,
                method: formData.method,
                notes: formData.notes.trim(),
                status
            };

            const { error } = await db.savePembayaran(payload);
            if (error) throw error;
            showToast(`Pembayaran bulan ${INDO_MONTHS[selectedMonth]} berhasil disimpan!`, 'success');

            setModalOpen(false);
            fetchData();
        } catch (err) {
            console.error('Error saving payment:', err);
            showToast('Gagal menyimpan catatan pembayaran', 'danger');
        }
    };

    // Mark as unpaid (undo payment)
    const handleMarkUnpaid = async () => {
        if (!selectedUser || selectedMonth === null) return;

        const confirmMsg = `Apakah Anda yakin ingin menghapus catatan pembayaran bulan ${INDO_MONTHS[selectedMonth]} ${selectedYear} untuk ${selectedUser.name}?\nStatus pembayaran akan dikembalikan menjadi Belum Bayar.`;
        
        if (window.confirm(confirmMsg)) {
            try {
                const { error } = await db.deletePembayaran(selectedUser.id, selectedYear, selectedMonth);
                if (error) throw error;
                
                showToast(`Pembayaran bulan ${INDO_MONTHS[selectedMonth]} berhasil dihapus.`, 'success');
                setModalOpen(false);
                fetchData();
            } catch (err) {
                console.error('Error deleting payment:', err);
                showToast('Gagal menghapus catatan pembayaran', 'danger');
            }
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Page Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Pencatatan Pembayaran</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Pantau status dan input pembayaran bulanan pelanggan.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                        className="form-control select-year"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    >
                        <option value="2025">Tahun 2025</option>
                        <option value="2026">Tahun 2026</option>
                        <option value="2027">Tahun 2027</option>
                    </select>
                </div>
            </div>

            {/* Legend card */}
            <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <HelpCircle size={16} />
                        Petunjuk: Klik kotak bulan untuk mencatat atau mengubah transaksi.
                    </span>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <span className="badge badge-paid"><Check size={12} /> Lunas</span>
                        <span className="badge badge-partial"><ChevronRight size={12} /> Kurang</span>
                        <span className="badge badge-unpaid"><X size={12} /> Belum Bayar</span>
                        <span className="badge badge-inactive">N/A (Belum Gabung)</span>
                    </div>
                </div>
            </div>

            {/* Payment Desktop Grid (Hidden on Mobile) */}
            <div className="card hidden-mobile-table" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="table-responsive">
                    {loading ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                            Memuat data pembayaran...
                        </div>
                    ) : users.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                            Belum ada pelanggan terdaftar.
                        </div>
                    ) : (
                        <table className="table" style={{ minWidth: '950px' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '220px', position: 'sticky', left: 0, zIndex: 10, background: 'var(--bg-table-sticky)' }}>Nama Pelanggan</th>
                                    {INDO_MONTHS.map(m => (
                                        <th key={m} style={{ textAlign: 'center' }}>{m.substring(0, 3)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => {
                                    const joinedDate = new Date(user.joined);
                                    const joinedY = joinedDate.getFullYear();
                                    const joinedM = joinedDate.getMonth();

                                    return (
                                        <tr key={user.id}>
                                            <td style={{
                                                position: 'sticky',
                                                left: 0,
                                                zIndex: 10,
                                                background: 'var(--bg-table-sticky)',
                                                borderRight: '1px solid var(--border-color)',
                                                fontWeight: 600
                                            }}>
                                                <div>{user.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                                    {formatRupiah(user.fee)}/bln
                                                </div>
                                            </td>

                                            {INDO_MONTHS.map((_, monthIdx) => {
                                                const isJoined = selectedYear > joinedY || (selectedYear === joinedY && monthIdx >= joinedM);
                                                
                                                if (!isJoined || user.status === 'nonaktif') {
                                                    return (
                                                        <td key={monthIdx} style={{ textAlign: 'center' }}>
                                                            <div className="month-box inactive">-</div>
                                                        </td>
                                                    );
                                                }

                                                const record = getPaymentRecord(user.id, monthIdx);
                                                const today = new Date();
                                                const thisYear = today.getFullYear();
                                                const thisMonth = today.getMonth();
                                                const isFutureMonth = selectedYear > thisYear || (selectedYear === thisYear && monthIdx > thisMonth);

                                                let cellClass = 'unpaid';
                                                let cellText = '❌';
                                                let cellTitle = 'Belum dibayar';

                                                if (record) {
                                                    if (record.status === 'paid') {
                                                        cellClass = 'paid';
                                                        cellText = '✓';
                                                        cellTitle = `Lunas - Rp ${formatRupiah(record.amount_paid)}`;
                                                    } else if (record.status === 'partial') {
                                                        cellClass = 'partial';
                                                        cellText = '⚡';
                                                        cellTitle = `Kurang Rp ${formatRupiah(user.fee - record.amount_paid)}`;
                                                    }
                                                } else if (isFutureMonth) {
                                                    cellClass = 'future';
                                                    cellText = '-';
                                                    cellTitle = 'Belum jatuh tempo';
                                                }

                                                return (
                                                    <td key={monthIdx} style={{ textAlign: 'center' }}>
                                                        <div
                                                            className={`month-box ${cellClass}`}
                                                            onClick={() => openPaymentModal(user, monthIdx)}
                                                            title={cellTitle}
                                                        >
                                                            {cellText}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Mobile Payment Grid (Converted to user-focused cards, Hidden on Desktop) */}
            <div className="visible-mobile-grid">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        Memuat data pembayaran...
                    </div>
                ) : users.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        Belum ada pelanggan terdaftar.
                    </div>
                ) : (
                    <div className="payment-grid-mobile">
                        {users.map(user => {
                            const joinedDate = new Date(user.joined);
                            const joinedY = joinedDate.getFullYear();
                            const joinedM = joinedDate.getMonth();

                            return (
                                <div key={user.id} className="payment-mobile-card">
                                    <div className="payment-mobile-card-header">
                                        <div>
                                            <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text-primary)' }}>{user.name}</strong>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tarif: {formatRupiah(user.fee)}/bulan</span>
                                        </div>
                                    </div>

                                    {/* Monthly Flex Grid - 4 columns */}
                                    <div className="months-flex-grid">
                                        {INDO_MONTHS.map((m, monthIdx) => {
                                            const isJoined = selectedYear > joinedY || (selectedYear === joinedY && monthIdx >= joinedM);
                                            
                                            if (!isJoined || user.status === 'nonaktif') {
                                                return (
                                                    <div key={monthIdx} className="month-box inactive" title="N/A">
                                                        <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{m.substring(0, 3)}</span>
                                                        <span>N/A</span>
                                                    </div>
                                                );
                                            }

                                            const record = getPaymentRecord(user.id, monthIdx);
                                            const today = new Date();
                                            const thisYear = today.getFullYear();
                                            const thisMonth = today.getMonth();
                                            const isFutureMonth = selectedYear > thisYear || (selectedYear === thisYear && monthIdx > thisMonth);

                                            let cellClass = 'unpaid';
                                            let cellLabel = '❌';

                                            if (record) {
                                                if (record.status === 'paid') {
                                                    cellClass = 'paid';
                                                    cellLabel = '✓';
                                                } else if (record.status === 'partial') {
                                                    cellClass = 'partial';
                                                    cellLabel = '⚡';
                                                }
                                            } else if (isFutureMonth) {
                                                cellClass = 'future';
                                                cellLabel = '-';
                                            }

                                            return (
                                                <div
                                                    key={monthIdx}
                                                    className={`month-box ${cellClass}`}
                                                    onClick={() => openPaymentModal(user, monthIdx)}
                                                >
                                                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.8 }}>{m.substring(0, 3)}</span>
                                                    <span style={{ fontSize: '0.85rem' }}>{cellLabel}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal Dialog Form Catat Pembayaran */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Catat Pembayaran WiFi</h2>
                            <button onClick={() => setModalOpen(false)} style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handlePaymentSubmit} style={{ padding: '24px' }}>
                            <div style={{
                                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                                border: '1px solid rgba(59, 130, 246, 0.15)',
                                padding: '16px',
                                borderRadius: '8px',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                                gap: '12px',
                                marginBottom: '24px'
                            }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Pelanggan</span>
                                    <strong style={{ fontSize: '0.9rem' }}>{selectedUser?.name}</strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Periode</span>
                                    <strong style={{ fontSize: '0.9rem' }}>{INDO_MONTHS[selectedMonth]} {selectedYear}</strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Tarif Tagihan</span>
                                    <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{formatRupiah(selectedUser?.fee)}</strong>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="pay-amount">Jumlah Bayar (Rp)</label>
                                    <input
                                        type="number"
                                        id="pay-amount"
                                        value={formData.amountPaid}
                                        onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                                        required
                                        min="0"
                                        placeholder="Contoh: 150000"
                                    />
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                        <button
                                            type="button"
                                            onClick={handlePayFull}
                                            style={{
                                                fontSize: '0.8rem',
                                                fontWeight: '600',
                                                padding: '6px 12px',
                                                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                                                border: '1px solid rgba(59, 130, 246, 0.25)',
                                                color: '#3b82f6',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                lineHeight: '1.2',
                                                height: 'auto',
                                                minHeight: 'unset'
                                            }}
                                        >
                                            Bayar Lunas
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="pay-method">Metode Pembayaran</label>
                                    <select
                                        id="pay-method"
                                        className="form-control"
                                        value={formData.method}
                                        onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                                    >
                                        <option value="Transfer Bank">Transfer Bank</option>
                                        <option value="Cash">Cash (Tunai)</option>
                                        <option value="E-Wallet">E-Wallet (Dana/OVO/Gopay)</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="pay-date">Tanggal Transaksi</label>
                                <input
                                    type="date"
                                    id="pay-date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="pay-notes">Keterangan / Memo</label>
                                <textarea
                                    id="pay-notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="2"
                                    placeholder="Contoh: Transfer ke Mandiri Admin, atau Bayar setengah dulu"
                                ></textarea>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '12px',
                                marginTop: '24px',
                                paddingTop: '20px',
                                borderTop: '1px solid var(--border-color)'
                            }}>
                                {selectedUser && getPaymentRecord(selectedUser.id, selectedMonth) && (
                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        style={{ marginRight: 'auto' }}
                                        onClick={handleMarkUnpaid}
                                    >
                                        Tandai Belum Lunas
                                    </button>
                                )}
                                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Save size={16} />
                                    <span>Simpan Transaksi</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Responsive Table CSS Helper */}
            <style jsx>{`
                @media (max-width: 767px) {
                    .hidden-mobile-table {
                        display: none !important;
                    }
                    .visible-mobile-grid {
                        display: block !important;
                    }
                }
                @media (min-width: 768px) {
                    .hidden-mobile-table {
                        display: block !important;
                    }
                    .visible-mobile-grid {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Toast */}
            {toastMsg && (
                <div className="toast-container">
                    <div className={`toast toast-${toastType}`}>
                        <Check size={18} className="toast-icon" />
                        <span className="toast-message">{toastMsg}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
