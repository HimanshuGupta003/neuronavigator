'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Search, Plus, UserPlus, X, Building2, Hash, Phone, Target, Shield, Copy, Check, Share, ChevronDown } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import styles from './clients.module.css';

interface Client {
    id: string;
    full_name: string;
    uci_number: string | null;
    employer_worksite: string | null;
    job_site: string | null;
    client_goals: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    emergency_contact_relationship: string | null;
    program_start_date: string | null;
    dor_counselor_name: string | null;
    dor_counselor_phone: string | null;
    dor_counselor_email: string | null;
    hourly_wage: number | null;
    vendor: string | null;
    // New DR384 fields
    birthdate: string | null;
    dor_district: string | null;
    job_title: string | null;
    placement_type: string | null;
    work_schedule: string | null;
    hours_authorized: number | null;
    se_service_provider: string | null;
    ipe_goal: string | null;  // Individual Plan for Employment goal
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
    const [safetyLinkModal, setSafetyLinkModal] = useState<{show: boolean; link: string; clientName: string; clientId: string}>({show: false, link: '', clientName: '', clientId: ''});
    const [generatingLink, setGeneratingLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [revoking, setRevoking] = useState(false);

    // Custom dropdown state
    const [relationshipOpen, setRelationshipOpen] = useState(false);
    const [placementOpen, setPlacementOpen] = useState(false);
    const relationshipRef = useRef<HTMLDivElement>(null);
    const placementRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (relationshipRef.current && !relationshipRef.current.contains(event.target as Node)) {
                setRelationshipOpen(false);
            }
            if (placementRef.current && !placementRef.current.contains(event.target as Node)) {
                setPlacementOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Form state with all DR384 fields
    const [newClient, setNewClient] = useState({
        full_name: '',
        uci_number: '',
        employer_worksite: '',
        job_site: '',
        client_goals: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relationship: '',
        program_start_date: '',
        dor_counselor_name: '',
        dor_counselor_phone: '',
        dor_counselor_email: '',
        hourly_wage: '',
        vendor: 'v-Enable Pathways',
        // New DR384 fields
        birthdate: '',
        dor_district: '',
        job_title: '',
        placement_type: 'Individual',
        work_schedule: '',
        hours_authorized: '',
        se_service_provider: '',
        ipe_goal: '',  // New IPE Goal field
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
                    job_site: newClient.job_site || null,
                    client_goals: newClient.client_goals || null,
                    emergency_contact_name: newClient.emergency_contact_name || null,
                    emergency_contact_phone: newClient.emergency_contact_phone || null,
                    emergency_contact_relationship: newClient.emergency_contact_relationship || null,
                    program_start_date: newClient.program_start_date || null,
                    dor_counselor_name: newClient.dor_counselor_name || null,
                    dor_counselor_phone: newClient.dor_counselor_phone || null,
                    dor_counselor_email: newClient.dor_counselor_email || null,
                    hourly_wage: newClient.hourly_wage ? parseFloat(newClient.hourly_wage) : null,
                    vendor: newClient.vendor || 'v-Enable Pathways',
                    // New DR384 fields
                    birthdate: newClient.birthdate || null,
                    dor_district: newClient.dor_district || null,
                    job_title: newClient.job_title || null,
                    placement_type: newClient.placement_type || 'Individual',
                    work_schedule: newClient.work_schedule || null,
                    hours_authorized: newClient.hours_authorized ? parseFloat(newClient.hours_authorized) : null,
                    se_service_provider: newClient.se_service_provider || null,
                    ipe_goal: newClient.ipe_goal || null,  // IPE Goal
                    coach_id: user.id,
                });

            if (insertError) throw insertError;

            // Reset form and close modal
            setNewClient({ 
                full_name: '', 
                uci_number: '', 
                employer_worksite: '',
                job_site: '',
                client_goals: '',
                emergency_contact_name: '',
                emergency_contact_phone: '',
                emergency_contact_relationship: '',
                program_start_date: '',
                dor_counselor_name: '',
                dor_counselor_phone: '',
                dor_counselor_email: '',
                hourly_wage: '',
                vendor: 'v-Enable Pathways',
                birthdate: '',
                dor_district: '',
                job_title: '',
                placement_type: 'Individual',
                work_schedule: '',
                hours_authorized: '',
                se_service_provider: '',
                ipe_goal: '',
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
                setSafetyLinkModal({ show: true, link: data.link, clientName, clientId });
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

    const handleRevokeLink = async () => {
        if (!safetyLinkModal.clientId) return;
        setRevoking(true);
        try {
            const response = await fetch('/api/safety-link/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: safetyLinkModal.clientId }),
            });
            const data = await response.json();
            if (data.success) {
                setSafetyLinkModal({ show: false, link: '', clientName: '', clientId: '' });
                // Show success message briefly
                setError(''); // Clear any error
            } else {
                setError(data.error || 'Failed to revoke link');
            }
        } catch (err) {
            setError('Failed to revoke safety link');
        } finally {
            setRevoking(false);
        }
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
                                    <label className={styles.inputLabel}>Full Name</label>
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

                                <div className={styles.inputRow}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Employer</label>
                                        <input
                                            type="text"
                                            value={newClient.employer_worksite}
                                            onChange={(e) => setNewClient({ ...newClient, employer_worksite: e.target.value })}
                                            placeholder="Company/Employer name"
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Job Site</label>
                                        <input
                                            type="text"
                                            value={newClient.job_site}
                                            onChange={(e) => setNewClient({ ...newClient, job_site: e.target.value })}
                                            placeholder="Work location (if different)"
                                            className={styles.input}
                                        />
                                    </div>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel}>Program Start Date</label>
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
                                    Goals
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
                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel}>
                                        IPE Goal (Individual Plan for Employment)
                                    </label>
                                    <textarea
                                        value={newClient.ipe_goal}
                                        onChange={(e) => setNewClient({ ...newClient, ipe_goal: e.target.value })}
                                        placeholder="E.g., Obtain competitive integrated employment in retail at minimum wage..."
                                        className={styles.textarea}
                                        rows={3}
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
                                        <label className={styles.inputLabel}>Relationship</label>
                                        <div className={styles.customSelect} ref={relationshipRef}>
                                            <div 
                                                className={styles.selectTrigger}
                                                onClick={() => setRelationshipOpen(!relationshipOpen)}
                                            >
                                                <span>{newClient.emergency_contact_relationship || 'Select relationship'}</span>
                                                <ChevronDown size={18} className={`${styles.selectIcon} ${relationshipOpen ? styles.selectIconOpen : ''}`} />
                                            </div>
                                            {relationshipOpen && (
                                                <div className={styles.selectMenu}>
                                                    {['Parent', 'Sibling', 'Spouse', 'Friend', 'Guardian', 'Other'].map((option) => (
                                                        <div 
                                                            key={option}
                                                            className={`${styles.selectOption} ${newClient.emergency_contact_relationship === option ? styles.selectOptionSelected : ''}`}
                                                            onClick={() => {
                                                                setNewClient({ ...newClient, emergency_contact_relationship: option });
                                                                setRelationshipOpen(false);
                                                            }}
                                                        >
                                                            {option}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel}>Phone Number</label>
                                    <input
                                        type="tel"
                                        value={newClient.emergency_contact_phone}
                                        onChange={(e) => setNewClient({ ...newClient, emergency_contact_phone: e.target.value })}
                                        placeholder="Phone number"
                                        className={styles.input}
                                    />
                                </div>
                            </div>

                            {/* DOR Counselor Section */}
                            <div className={styles.formSection}>
                                <h3 className={styles.sectionTitle}>
                                    <Users size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                    DOR Counselor
                                </h3>
                                
                                <div className={styles.inputRow}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Counselor Name</label>
                                        <input
                                            type="text"
                                            value={newClient.dor_counselor_name}
                                            onChange={(e) => setNewClient({ ...newClient, dor_counselor_name: e.target.value })}
                                            placeholder="DOR Counselor Name"
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Counselor Phone</label>
                                        <input
                                            type="tel"
                                            value={newClient.dor_counselor_phone}
                                            onChange={(e) => setNewClient({ ...newClient, dor_counselor_phone: e.target.value })}
                                            placeholder="Phone"
                                            className={styles.input}
                                        />
                                    </div>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel}>Counselor Email</label>
                                    <input
                                        type="email"
                                        value={newClient.dor_counselor_email}
                                        onChange={(e) => setNewClient({ ...newClient, dor_counselor_email: e.target.value })}
                                        placeholder="counselor@dor.ca.gov"
                                        className={styles.input}
                                    />
                                </div>
                            </div>

                            {/* Job Details Section */}
                            <div className={styles.formSection}>
                                <h3 className={styles.sectionTitle}>
                                    <Building2 size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                    Job Details
                                </h3>
                                
                                <div className={styles.inputRow}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Job Title</label>
                                        <input
                                            type="text"
                                            value={newClient.job_title}
                                            onChange={(e) => setNewClient({ ...newClient, job_title: e.target.value })}
                                            placeholder="e.g., Stock Clerk, Cashier"
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Birthdate</label>
                                        <input
                                            type="date"
                                            value={newClient.birthdate}
                                            onChange={(e) => setNewClient({ ...newClient, birthdate: e.target.value })}
                                            className={styles.input}
                                        />
                                    </div>
                                </div>

                                <div className={styles.inputRow}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Placement Type</label>
                                        <div className={styles.customSelect} ref={placementRef}>
                                            <div 
                                                className={styles.selectTrigger}
                                                onClick={() => setPlacementOpen(!placementOpen)}
                                            >
                                                <span>{newClient.placement_type === 'Individual' ? 'Individual Placement (IP)' : 'Group Placement (GP)'}</span>
                                                <ChevronDown size={18} className={`${styles.selectIcon} ${placementOpen ? styles.selectIconOpen : ''}`} />
                                            </div>
                                            {placementOpen && (
                                                <div className={styles.selectMenu}>
                                                    <div 
                                                        className={`${styles.selectOption} ${newClient.placement_type === 'Individual' ? styles.selectOptionSelected : ''}`}
                                                        onClick={() => {
                                                            setNewClient({ ...newClient, placement_type: 'Individual' });
                                                            setPlacementOpen(false);
                                                        }}
                                                    >
                                                        Individual Placement (IP)
                                                    </div>
                                                    <div 
                                                        className={`${styles.selectOption} ${newClient.placement_type === 'Group' ? styles.selectOptionSelected : ''}`}
                                                        onClick={() => {
                                                            setNewClient({ ...newClient, placement_type: 'Group' });
                                                            setPlacementOpen(false);
                                                        }}
                                                    >
                                                        Group Placement (GP)
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Work Schedule</label>
                                        <input
                                            type="text"
                                            value={newClient.work_schedule}
                                            onChange={(e) => setNewClient({ ...newClient, work_schedule: e.target.value })}
                                            placeholder="e.g., Mon-Fri 9am-2pm"
                                            className={styles.input}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* DOR Information Section */}
                            <div className={styles.formSection}>
                                <h3 className={styles.sectionTitle}>
                                    DOR Information
                                </h3>
                                
                                <div className={styles.inputRow}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>DOR District</label>
                                        <input
                                            type="text"
                                            value={newClient.dor_district}
                                            onChange={(e) => setNewClient({ ...newClient, dor_district: e.target.value })}
                                            placeholder="e.g., Oakland, San Francisco"
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>SE Service Provider</label>
                                        <input
                                            type="text"
                                            value={newClient.se_service_provider}
                                            onChange={(e) => setNewClient({ ...newClient, se_service_provider: e.target.value })}
                                            placeholder="Supported Employment Provider"
                                            className={styles.input}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Billing Information Section */}
                            <div className={styles.formSection}>
                                <h3 className={styles.sectionTitle}>
                                    Billing Information
                                </h3>
                                
                                <div className={styles.inputRow}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Hourly Wage ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newClient.hourly_wage}
                                            onChange={(e) => setNewClient({ ...newClient, hourly_wage: e.target.value })}
                                            placeholder="15.00"
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Vendor</label>
                                        <input
                                            type="text"
                                            value={newClient.vendor}
                                            onChange={(e) => setNewClient({ ...newClient, vendor: e.target.value })}
                                            placeholder="v-Enable Pathways"
                                            className={styles.input}
                                        />
                                    </div>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel}>Total Hours Authorized (Monthly)</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={newClient.hours_authorized}
                                        onChange={(e) => setNewClient({ ...newClient, hours_authorized: e.target.value })}
                                        placeholder="e.g., 40"
                                        className={styles.input}
                                    />
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
                <div className={styles.modalOverlay} onClick={() => setSafetyLinkModal({show: false, link: '', clientName: '', clientId: ''})}>
                    <div className={styles.safetyModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.safetyModalHeader}>
                            <Shield size={28} className={styles.safetyModalIcon} />
                            <h2 className={styles.safetyModalTitle}>Safety Link Ready</h2>
                        </div>
                        <p className={styles.safetyModalSubtitle}>
                            Share this link with <strong>{safetyLinkModal.clientName}</strong> for SOS access.
                        </p>

                        {/* QR Code */}
                        <div className={styles.qrCodeSection}>
                            <QRCodeSVG 
                                value={safetyLinkModal.link}
                                size={140}
                                level="M"
                                bgColor="#ffffff"
                                fgColor="#1e293b"
                            />
                            <p className={styles.qrCodeHint}>
                                Scan to open • Then tap <Share size={12} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> and &quot;Add to Home Screen&quot;
                            </p>
                        </div>
                        
                        <div className={styles.linkBox}>
                            <input 
                                type="text" 
                                value={safetyLinkModal.link} 
                                readOnly 
                                className={styles.linkInput}
                            />
                            <button onClick={handleCopyLink} className={styles.copyButton}>
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>

                        <div className={styles.safetyModalActions}>
                            <button 
                                className={styles.safetyCloseButton}
                                onClick={() => setSafetyLinkModal({show: false, link: '', clientName: '', clientId: ''})}
                            >
                                Done
                            </button>
                            <button 
                                className={styles.revokeButton}
                                onClick={handleRevokeLink}
                                disabled={revoking}
                            >
                                {revoking ? 'Revoking...' : 'Revoke'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
