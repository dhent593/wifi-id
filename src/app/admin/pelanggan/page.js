'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { Search, UserPlus, Share2, Pencil, Trash, X, Check, RotateCcw } from 'lucide-react';

export default function PelangganPage() {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [toastMsg, setToastMsg] = useState('');
    const [toastType, setToastType] = useState('success');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editUserId, setEditUserId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        fee: '',
        address: '',
        joined: '',
        status: 'aktif'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await db.getPelanggan();

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            showToast('Gagal memuat data pelanggan', 'danger');
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

    // Open modal for add
    const openAddModal = () => {
        setEditUserId(null);
        setFormData({
            name: '',
            phone: '',
            fee: '',
            address: '',
            joined: new Date().toISOString().substring(0, 10),
            status: 'aktif'
        });
        setModalOpen(true);
    };

    // Open modal for edit
    const openEditModal = (user) => {
        setEditUserId(user.id);
        setFormData({
            name: user.name,
            phone: user.phone,
            fee: user.fee,
            address: user.address,
            joined: user.joined,
            status: user.status
        });
        setModalOpen(true);
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                fee: parseInt(formData.fee),
                address: formData.address.trim(),
                joined: formData.joined,
                status: formData.status
            };

            if (editUserId) {
                // Update
                const { error } = await db.updatePelanggan(editUserId, payload);

                if (error) throw error;
                showToast('Data pelanggan berhasil diperbarui!', 'success');
            } else {
                // Create
                const { error } = await db.insertPelanggan(payload);

                if (error) throw error;
                showToast('Pelanggan baru berhasil ditambahkan!', 'success');
            }

            setModalOpen(false);
            fetchUsers();
        } catch (err) {
            console.error('Error saving user:', err);
            showToast('Gagal menyimpan data pelanggan', 'danger');
        }
    };

    // Delete user
    const handleDelete = async (id, name) => {
        if (confirm(`Apakah Anda yakin ingin menghapus "${name}"? Semua data transaksi juga akan ikut terhapus.`)) {
            try {
                const { error } = await db.deletePelanggan(id);

                if (error) throw error;
                showToast('Pelanggan berhasil dihapus.', 'info');
                fetchUsers();
            } catch (err) {
                console.error('Error deleting user:', err);
                showToast('Gagal menghapus pelanggan', 'danger');
            }
        }
    };

    // Reset user payments
    const handleResetPayments = async (id, name) => {
        if (confirm(`Apakah Anda yakin ingin me-reset data riwayat pembayaran pelanggan "${name}"?\nSemua catatan pembayaran akan dihapus permanen untuk mengosongkan database.`)) {
            try {
                const { error } = await db.resetPelangganPembayaran(id);

                if (error) throw error;
                showToast(`Riwayat pembayaran ${name} berhasil di-reset.`, 'success');
                fetchUsers();
            } catch (err) {
                console.error('Error resetting payments:', err);
                showToast('Gagal me-reset riwayat pembayaran', 'danger');
            }
        }
    };

    // Copy sharing link
    const handleCopyLink = (token) => {
        const shareLink = `${window.location.origin}/share?token=${token}`;
        navigator.clipboard.writeText(shareLink).then(() => {
            showToast('Link tagihan pelanggan berhasil disalin!', 'success');
        }).catch(() => {
            showToast('Gagal menyalin link', 'danger');
        });
    };

    // Filtered list
    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Manajemen Pelanggan</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Kelola daftar pelanggan, tarif WiFi bulanan, dan salin link tagihan mereka.</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal}>
                    <UserPlus size={18} />
                    <span>Tambah Pelanggan</span>
                </button>
            </div>

            {/* Toolbar & Search */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div className="search-box" style={{ maxWidth: '360px' }}>
                        <Search className="search-icon" size={16} />
                        <input
                            type="text"
                            placeholder="Cari nama atau alamat pelanggan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                            Memuat data pelanggan...
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                            Tidak ada pelanggan yang cocok dengan pencarian.
                        </div>
                    ) : (
                        <table className="table mobile-card-table">
                            <thead>
                                <tr>
                                    <th>Nama / Alamat</th>
                                    <th>Nomor Kontak</th>
                                    <th>Tarif Bulanan</th>
                                    <th>Tanggal Gabung</th>
                                    <th>Status</th>
                                    <th>Aksi & Sharing</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => {
                                    const joinedText = new Date(user.joined).toLocaleDateString('id-ID', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    });

                                    return (
                                        <tr key={user.id}>
                                            <td data-label="Pelanggan">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '50%',
                                                        backgroundColor: 'var(--primary-light)',
                                                        color: 'var(--primary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700
                                                    }}>
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{user.name}</strong>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.address}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Kontak">
                                                <span style={{ fontWeight: 500 }}>{user.phone}</span>
                                            </td>
                                            <td data-label="Tarif Bulanan">
                                                <strong className="text-primary">{formatRupiah(user.fee)}</strong>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / bulan</span>
                                            </td>
                                            <td data-label="Joined">
                                                <span>{joinedText}</span>
                                            </td>
                                            <td data-label="Status">
                                                <span className={`badge ${user.status === 'aktif' ? 'badge-paid' : 'badge-inactive'}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td data-label="Aksi">
                                                <div className="user-actions">
                                                    <button className="btn btn-secondary btn-sm" onClick={() => handleCopyLink(user.token)}>
                                                        <Share2 size={14} />
                                                        <span>Salin Link</span>
                                                    </button>
                                                    <button className="btn btn-outline btn-sm" onClick={() => openEditModal(user)} title="Edit Profil">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button className="btn btn-outline btn-sm" onClick={() => handleResetPayments(user.id, user.name)} title="Reset Riwayat Pembayaran" style={{ color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                                                        <RotateCcw size={14} />
                                                    </button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id, user.name)} title="Hapus Pelanggan">
                                                        <Trash size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal Dialog Form Pelanggan */}
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
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                                {editUserId ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
                            </h2>
                            <button onClick={() => setModalOpen(false)} style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                            <div className="form-group">
                                <label htmlFor="modal-name">Nama Lengkap</label>
                                <input
                                    type="text"
                                    id="modal-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Masukkan nama lengkap pelanggan"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="modal-phone">Nomor HP / WhatsApp</label>
                                    <input
                                        type="tel"
                                        id="modal-phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                        placeholder="Contoh: 08123456789"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="modal-fee">Biaya Bulanan (Rp)</label>
                                    <input
                                        type="number"
                                        id="modal-fee"
                                        value={formData.fee}
                                        onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                                        required
                                        min="0"
                                        placeholder="Contoh: 150000"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="modal-address">Alamat Rumah / Lokasi Pasang</label>
                                <textarea
                                    id="modal-address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    required
                                    rows="2"
                                    placeholder="Masukkan alamat lengkap rumah pelanggan"
                                ></textarea>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="modal-joined">Tanggal Gabung</label>
                                    <input
                                        type="date"
                                        id="modal-joined"
                                        value={formData.joined}
                                        onChange={(e) => setFormData({ ...formData, joined: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="modal-status">Status Jaringan</label>
                                    <select
                                        id="modal-status"
                                        className="form-control"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="aktif">Aktif</option>
                                        <option value="nonaktif">Nonaktif</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '12px',
                                marginTop: '24px',
                                paddingTop: '20px',
                                borderTop: '1px solid var(--border-color)'
                            }}>
                                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Simpan Pelanggan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Action Button for Mobile */}
            <button className="fab" onClick={openAddModal} title="Tambah Pelanggan">
                <UserPlus size={24} />
            </button>

            {/* Toast Notification */}
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
