'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Search, Plus, UserPlus, X, Building2, Hash, Phone, Target, Calendar, Shield, Copy, Check, Link2 } from 'lucide-react';
import styles from './clients.module.css';

interface Client {
    id: string;
    full_name: string;
    uci_number: string | null;
    employer_worksite: string | null;
    client_goals: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    program_start_date: string | null;
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

    // Safety Link state
    const [safetyLinkModal, setSafetyLinkModal] = useState<{show: boolean; link: string; clientName: string}>({show: false, link: '', clientName: ''});
    const [generatingLink, setGeneratingLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Form state with new fields
    const [newClient, setNewClient] = useState({
        full_name: '',
        uci_number: '',
        employer_worksite: '',
        client_goals: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        program_start_date: '',
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
                    client_goals: newClient.client_goals || null,
                    emergency_contact_name: newClient.emergency_contact_name || null,
                    emergency_contact_phone: newClient.emergency_contact_phone || null,
                    program_start_date: newClient.program_start_date || null,
                    coach_id: user.id,
                });

            if (insertError) throw insertError;

            // Reset form and close modal
            setNewClient({ 
                full_name: '', 
                uci_number: '', 
                employer_worksite: '',
                client_goals: '',
                emergency_contact_name: '',
                emergency_contact_phone: '',
                program_start_date: '',
            });
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

    const handleGenerateSafetyLink = async (clientId: string, clientName: string) => {
        setGeneratingLink(clientId);
        try {
            const response = await fetch('/api/safety-link/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId }),
            });
            const data = await response.json();
            if (data.success) {
                setSafetyLinkModal({ show: true, link: data.link, clientName });
            } else {
                setError(data.error || 'Failed to generate link');
            }
        } catch (err) {
            setError('Failed to generate safety link');
        } finally {
            setGeneratingLink(null);
        }
    };

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(safetyLinkModal.link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
                                <button
                                    className={styles.safetyLinkButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerateSafetyLink(client.id, client.full_name);
                                    }}
                                    disabled={generatingLink === client.id}
                                >
                                    {generatingLink === client.id ? (
                                        <div className={styles.smallSpinner}></div>
                                    ) : (
                                        <>
                                            <Shield size={16} />
                                            <span>Safety Link</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Client Intake Form Modal */}
            {showAddModal && (
                <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Client Intake Form</h2>
                            <button onClick={() => setShowAddModal(false)} className={styles.closeButton}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddClient} className={styles.form}>
                            {/* Basic Info Section */}
                            <div className={styles.formSection}>
                                <h3 className={styles.sectionTitle}>Basic Information</h3>
                                
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

                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel}>
                                        <Calendar size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                        Program Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={newClient.program_start_date}
                                        onChange={(e) => setNewClient({ ...newClient, program_start_date: e.target.value })}
                                        className={styles.input}
                                    />
                                </div>
                            </div>

                            {/* Goals Section */}
                            <div className={styles.formSection}>
                                <h3 className={styles.sectionTitle}>
                                    <Target size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                    Client Goals
                                </h3>
                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel}>
                                        What are the client's goals? (Used for AI report generation)
                                    </label>
                                    <textarea
                                        value={newClient.client_goals}
                                        onChange={(e) => setNewClient({ ...newClient, client_goals: e.target.value })}
                                        placeholder="E.g., Improve work speed, develop social skills, learn job tasks..."
                                        className={styles.textarea}
                                        rows={4}
                                    />
                                </div>
                            </div>

                            {/* Emergency Contact Section */}
                            <div className={styles.formSection}>
                                <h3 className={styles.sectionTitle}>
                                    <Phone size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                    Emergency Contact
                                </h3>
                                
                                <div className={styles.inputRow}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Contact Name</label>
                                        <input
                                            type="text"
                                            value={newClient.emergency_contact_name}
                                            onChange={(e) => setNewClient({ ...newClient, emergency_contact_name: e.target.value })}
                                            placeholder="Name"
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Phone Number</label>
                                        <input
                                            type="tel"
                                            value={newClient.emergency_contact_phone}
                                            onChange={(e) => setNewClient({ ...newClient, emergency_contact_phone: e.target.value })}
                                            placeholder="Phone"
                                            className={styles.input}
                                        />
                                    </div>
                                </div>
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

            {/* Safety Link Modal */}
            {safetyLinkModal.show && (
                <div className={styles.modalOverlay} onClick={() => setSafetyLinkModal({show: false, link: '', clientName: ''})}>
                    <div className={styles.safetyModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.safetyModalHeader}>
                            <Shield size={28} className={styles.safetyModalIcon} />
                            <h2 className={styles.safetyModalTitle}>Safety Link Ready</h2>
                        </div>
                        <p className={styles.safetyModalSubtitle}>
                            Share this link with <strong>{safetyLinkModal.clientName}</strong> to give them access to the SOS button.
                        </p>
                        
                        <div className={styles.linkBox}>
                            <input 
                                type="text" 
                                value={safetyLinkModal.link} 
                                readOnly 
                                className={styles.linkInput}
                            />
                            <button onClick={handleCopyLink} className={styles.copyButton}>
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>

                        <div className={styles.safetyInstructions}>
                            <p className={styles.instructionTitle}>Instructions:</p>
                            <ol className={styles.instructionList}>
                                <li>Send this link to the client via SMS or WhatsApp</li>
                                <li>Have them open it in Safari/Chrome</li>
                                <li>Tap "Add to Home Screen"</li>
                                <li>The SOS button will appear as an app icon</li>
                            </ol>
                        </div>

                        <button 
                            className={styles.safetyCloseButton}
                            onClick={() => setSafetyLinkModal({show: false, link: '', clientName: ''})}
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
