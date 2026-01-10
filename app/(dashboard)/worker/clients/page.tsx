'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Search, Plus, UserPlus, X, Building2, Hash } from 'lucide-react';
import styles from './clients.module.css';

interface Client {
    id: string;
    full_name: string;
    uci_number: string | null;
    employer_worksite: string | null;
    coach_id: string;
    created_at: string;
}

export default function ClientsPage() {
    const supabase = createClient();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [newClient, setNewClient] = useState({
        full_name: '',
        uci_number: '',
        employer_worksite: '',
    });

    useEffect(() => {
        loadClients();
    }, []);

    async function loadClients() {
        try {
            const { data } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                setClients(data as Client[]);
            }
        } catch (error) {
            console.error('Failed to load clients:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error: insertError } = await supabase
                .from('clients')
                .insert({
                    full_name: newClient.full_name,
                    uci_number: newClient.uci_number || null,
                    employer_worksite: newClient.employer_worksite || null,
                    coach_id: user.id,
                });

            if (insertError) throw insertError;

            // Reset form and close modal
            setNewClient({ full_name: '', uci_number: '', employer_worksite: '' });
            setShowAddModal(false);
            loadClients();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add client');
        } finally {
            setSaving(false);
        }
    };

    const filteredClients = clients.filter(c =>
        c.full_name.toLowerCase().includes(search.toLowerCase()) ||
        c.uci_number?.toLowerCase().includes(search.toLowerCase()) ||
        c.employer_worksite?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>My Clients</h1>
                    <p className={styles.subtitle}>Manage your assigned clients</p>
                </div>
                <button onClick={() => setShowAddModal(true)} className={styles.addButton}>
                    <UserPlus size={18} />
                    Add Client
                </button>
            </div>

            {/* Search & Count */}
            <div className={styles.searchSection}>
                <div className={styles.searchContainer}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <p className={styles.clientCount}>{filteredClients.length} clients</p>
            </div>

            {/* Clients List */}
            <div className={styles.card}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Users size={32} />
                        </div>
                        <p className={styles.emptyTitle}>
                            {search ? 'No clients found' : 'No clients yet'}
                        </p>
                        <p className={styles.emptyText}>
                            {search ? 'Try a different search term' : 'Add your first client to get started'}
                        </p>
                        {!search && (
                            <button onClick={() => setShowAddModal(true)} className={styles.emptyButton}>
                                <Plus size={18} />
                                Add First Client
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={styles.clientList}>
                        {filteredClients.map((client) => (
                            <div key={client.id} className={styles.clientItem}>
                                <div className={styles.clientAvatar}>
                                    {client.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div className={styles.clientInfo}>
                                    <p className={styles.clientName}>{client.full_name}</p>
                                    <div className={styles.clientMeta}>
                                        {client.uci_number && (
                                            <span className={styles.metaItem}>
                                                <Hash size={12} />
                                                UCI: {client.uci_number}
                                            </span>
                                        )}
                                        {client.employer_worksite && (
                                            <span className={styles.metaItem}>
                                                <Building2 size={12} />
                                                {client.employer_worksite}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Client Modal */}
            {showAddModal && (
                <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Add New Client</h2>
                            <button onClick={() => setShowAddModal(false)} className={styles.closeButton}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddClient} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>Full Name *</label>
                                <input
                                    type="text"
                                    value={newClient.full_name}
                                    onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })}
                                    required
                                    placeholder="Enter client's full name"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>UCI # (Government ID)</label>
                                <input
                                    type="text"
                                    value={newClient.uci_number}
                                    onChange={(e) => setNewClient({ ...newClient, uci_number: e.target.value })}
                                    placeholder="Enter UCI number"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>Employer / Worksite</label>
                                <input
                                    type="text"
                                    value={newClient.employer_worksite}
                                    onChange={(e) => setNewClient({ ...newClient, employer_worksite: e.target.value })}
                                    placeholder="Enter employer or worksite"
                                    className={styles.input}
                                />
                            </div>

                            {error && (
                                <div className={styles.errorBox}>
                                    {error}
                                </div>
                            )}

                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowAddModal(false)} className={styles.cancelButton}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className={styles.submitButton}>
                                    {saving ? 'Adding...' : 'Add Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
