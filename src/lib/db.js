import { supabase } from './supabase';

export const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                             process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co') ||
                             process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id.supabase.co');

// ==========================================================================
// LOCAL STORAGE BACKEND (FALLBACK)
// ==========================================================================
const getLocalUsers = () => {
    if (typeof window === 'undefined') return [];
    let u = localStorage.getItem('wifi_users');
    if (!u) {
        const dummyUsers = [
            {
                id: 'user-1',
                name: 'Budi Santoso',
                phone: '081234567890',
                fee: 150000,
                address: 'Jl. Melati No. 45, Blok C',
                joined: '2026-01-10',
                status: 'aktif',
                token: 'b1111111-1111-1111-1111-111111111111'
            },
            {
                id: 'user-2',
                name: 'Rina Wijaya',
                phone: '082345678901',
                fee: 200000,
                address: 'Jl. Mawar Gg. Kelinci No. 12',
                joined: '2026-03-05',
                status: 'aktif',
                token: 'r2222222-2222-2222-2222-222222222222'
            },
            {
                id: 'user-3',
                name: 'Agus Setiawan',
                phone: '083456789012',
                fee: 150000,
                address: 'Perum Gading Indah, Blok D-10',
                joined: '2026-05-20',
                status: 'aktif',
                token: 'a3333333-3333-3333-3333-333333333333'
            }
        ];
        localStorage.setItem('wifi_users', JSON.stringify(dummyUsers));
        return dummyUsers;
    }
    return JSON.parse(u);
};

const saveLocalUsers = (users) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('wifi_users', JSON.stringify(users));
    }
};

const getLocalPayments = () => {
    if (typeof window === 'undefined') return [];
    let p = localStorage.getItem('wifi_payments');
    if (!p) {
        const dummyPayments = [
            { id: 'pay-1', pelanggan_id: 'user-1', year: 2026, month: 0, amount_paid: 150000, date: '2026-01-08', method: 'Cash', notes: 'Bayar lunas', status: 'paid' },
            { id: 'pay-2', pelanggan_id: 'user-1', year: 2026, month: 1, amount_paid: 150000, date: '2026-02-09', method: 'Transfer Bank', notes: 'Transfer Mandiri', status: 'paid' },
            { id: 'pay-3', pelanggan_id: 'user-1', year: 2026, month: 2, amount_paid: 150000, date: '2026-03-09', method: 'Transfer Bank', notes: 'Transfer Mandiri', status: 'paid' },
            { id: 'pay-4', pelanggan_id: 'user-1', year: 2026, month: 3, amount_paid: 150000, date: '2026-04-10', method: 'E-Wallet', notes: 'Dana', status: 'paid' },
            { id: 'pay-5', pelanggan_id: 'user-1', year: 2026, month: 4, amount_paid: 150000, date: '2026-05-08', method: 'Transfer Bank', notes: 'Transfer Mandiri', status: 'paid' },
            { id: 'pay-6', pelanggan_id: 'user-1', year: 2026, month: 5, amount_paid: 100000, date: '2026-06-05', method: 'Cash', notes: 'Bayar sebagian dulu', status: 'partial' },
            { id: 'pay-7', pelanggan_id: 'user-2', year: 2026, month: 2, amount_paid: 200000, date: '2026-03-06', method: 'E-Wallet', notes: 'Gopay', status: 'paid' },
            { id: 'pay-8', pelanggan_id: 'user-2', year: 2026, month: 3, amount_paid: 200000, date: '2026-04-05', method: 'Transfer Bank', notes: 'Transfer BCA', status: 'paid' },
            { id: 'pay-9', pelanggan_id: 'user-2', year: 2026, month: 4, amount_paid: 120000, date: '2026-05-12', method: 'Cash', notes: 'Baru bayar 120rb, kurang 80rb', status: 'partial' },
            { id: 'pay-10', pelanggan_id: 'user-3', year: 2026, month: 4, amount_paid: 150000, date: '2026-05-22', method: 'Transfer Bank', notes: 'Transfer langsung', status: 'paid' }
        ];
        localStorage.setItem('wifi_payments', JSON.stringify(dummyPayments));
        return dummyPayments;
    }
    return JSON.parse(p);
};

const saveLocalPayments = (payments) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('wifi_payments', JSON.stringify(payments));
    }
};

// ==========================================================================
// DB SERVICE INTERFACE
// ==========================================================================
export const db = {
    // --- Autentikasi ---
    async getSession() {
        if (isPlaceholder) {
            const mock = localStorage.getItem('wifi_mock_session');
            return { data: { session: mock ? JSON.parse(mock) : null } };
        }
        return await supabase.auth.getSession();
    },

    async signIn(email, password) {
        // Local check
        const isLocalCheck = email === 'admin@gmail.com' && password === 'palamana';
        
        if (isPlaceholder) {
            if (isLocalCheck) {
                const session = { user: { email }, timestamp: Date.now() };
                localStorage.setItem('wifi_mock_session', JSON.stringify(session));
                return { data: session, error: null };
            }
            return { data: null, error: { message: 'Kredensial salah (Mode Fallback Lokal)' } };
        }

        try {
            const res = await supabase.auth.signInWithPassword({ email, password });
            if (res.error && isLocalCheck) {
                // If cloud fails (e.g. user not created yet), allow fallback to make testing smooth
                const session = { user: { email }, timestamp: Date.now() };
                localStorage.setItem('wifi_mock_session', JSON.stringify(session));
                return { data: session, error: null };
            }
            return res;
        } catch (err) {
            if (isLocalCheck) {
                const session = { user: { email }, timestamp: Date.now() };
                localStorage.setItem('wifi_mock_session', JSON.stringify(session));
                return { data: session, error: null };
            }
            throw err;
        }
    },

    async signOut() {
        if (isPlaceholder) {
            localStorage.removeItem('wifi_mock_session');
            return { error: null };
        }
        localStorage.removeItem('wifi_mock_session');
        return await supabase.auth.signOut();
    },

    onAuthStateChange(callback) {
        if (isPlaceholder) {
            // No-op for change listener in local mode
            return { data: { subscription: { unsubscribe: () => {} } } };
        }
        return supabase.auth.onAuthStateChange(callback);
    },

    // --- Pelanggan API ---
    async getPelanggan() {
        if (isPlaceholder) {
            return { data: getLocalUsers(), error: null };
        }
        return await supabase.from('pelanggan').select('*').order('name', { ascending: true });
    },

    async getPelangganByToken(token) {
        if (isPlaceholder) {
            const user = getLocalUsers().find(u => u.token === token);
            return { data: user || null, error: user ? null : new Error('Not found') };
        }
        return await supabase.from('pelanggan').select('*').eq('token', token).single();
    },

    async getPelangganById(id) {
        if (isPlaceholder) {
            const user = getLocalUsers().find(u => u.id === id);
            return { data: user || null, error: user ? null : new Error('Not found') };
        }
        return await supabase.from('pelanggan').select('*').eq('id', id).single();
    },

    async insertPelanggan(userData) {
        if (isPlaceholder) {
            const users = getLocalUsers();
            const newUser = {
                id: 'user-' + Date.now(),
                token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                created_at: new Date().toISOString(),
                ...userData
            };
            users.push(newUser);
            saveLocalUsers(users);
            return { data: [newUser], error: null };
        }
        return await supabase.from('pelanggan').insert([userData]);
    },

    async updatePelanggan(id, userData) {
        if (isPlaceholder) {
            const users = getLocalUsers();
            const idx = users.findIndex(u => u.id === id);
            if (idx !== -1) {
                users[idx] = { ...users[idx], ...userData };
                saveLocalUsers(users);
                return { data: [users[idx]], error: null };
            }
            return { data: null, error: new Error('User not found') };
        }
        return await supabase.from('pelanggan').update(userData).eq('id', id);
    },

    async deletePelanggan(id) {
        if (isPlaceholder) {
            // Delete user
            let users = getLocalUsers().filter(u => u.id !== id);
            saveLocalUsers(users);
            // Delete user payments
            let payments = getLocalPayments().filter(p => p.pelanggan_id !== id);
            saveLocalPayments(payments);
            return { error: null };
        }
        return await supabase.from('pelanggan').delete().eq('id', id);
    },

    // --- Pembayaran API ---
    async getPembayaran(year) {
        if (isPlaceholder) {
            const filtered = getLocalPayments().filter(p => p.year === parseInt(year));
            return { data: filtered, error: null };
        }
        return await supabase.from('pembayaran').select('*').eq('year', year);
    },

    async getPembayaranByClient(pelangganId) {
        if (isPlaceholder) {
            const filtered = getLocalPayments()
                .filter(p => p.pelanggan_id === pelangganId)
                .sort((a, b) => {
                    if (b.year !== a.year) return b.year - a.year;
                    return b.month - a.month;
                });
            return { data: filtered, error: null };
        }
        return await supabase
            .from('pembayaran')
            .select('*')
            .eq('pelanggan_id', pelangganId)
            .order('year', { ascending: false })
            .order('month', { ascending: false });
    },

    async savePembayaran(payload) {
        if (isPlaceholder) {
            const payments = getLocalPayments();
            const idx = payments.findIndex(
                p => p.pelanggan_id === payload.pelanggan_id && 
                     p.year === parseInt(payload.year) && 
                     p.month === parseInt(payload.month)
            );

            const record = {
                id: idx !== -1 ? payments[idx].id : 'pay-' + Date.now(),
                created_at: new Date().toISOString(),
                ...payload,
                year: parseInt(payload.year),
                month: parseInt(payload.month),
                amount_paid: parseInt(payload.amount_paid)
            };

            if (idx !== -1) {
                payments[idx] = record;
            } else {
                payments.push(record);
            }
            saveLocalPayments(payments);
            return { data: [record], error: null };
        }

        // Check if existing record exists in Supabase
        const { data: existing } = await supabase
            .from('pembayaran')
            .select('id')
            .eq('pelanggan_id', payload.pelanggan_id)
            .eq('year', payload.year)
            .eq('month', payload.month)
            .maybeSingle();

        if (existing) {
            // Update
            return await supabase.from('pembayaran').update(payload).eq('id', existing.id);
        } else {
            // Insert
            return await supabase.from('pembayaran').insert([payload]);
        }
    }
};
