'use client';

import { useState, useEffect, useRef } from 'react';
import { ClipboardList, Calendar, User, ChevronDown, Smile, Meh, Frown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './entries.module.css';

interface Entry {
    id: string;
    client_name: string;
    formatted_note: string;
    summary: string;
    mood: string;
    tags: string[];
    consumer_hours: number | null;
    created_at: string;
}

interface Client {
    id: string;
    full_name: string;
}

export default function WorkerEntriesPage() {
    const supabase = createClient();
    const [entries, setEntries] = useState<Entry[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        loadClients();
        loadEntries();
    }, []);

    useEffect(() => {
        loadEntries();
    }, [selectedClient]);

    async function loadClients() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('clients')
                    .select('id, full_name')
                    .eq('coach_id', user.id)
                    .order('full_name');

                if (data) {
                    setClients(data);
                }
            }
        } catch (error) {
            console.error('Failed to load clients:', error);
        }
    }

    async function loadEntries() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                let query = supabase
                    .from('entries')
                    .select('*')
                    .eq('worker_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (selectedClient) {
                    const client = clients.find(c => c.id === selectedClient);
                    if (client) {
                        query = query.eq('client_name', client.full_name);
                    }
                }

                const { data } = await query;
                if (data) {
                    setEntries(data);
                }
            }
        } catch (error) {
            console.error('Failed to load entries:', error);
        } finally {
            setLoading(false);
        }
    }

    const getMoodIcon = (mood: string) => {
        switch (mood) {
            case 'good': return <Smile size={18} className={styles.moodGood} />;
            case 'bad': return <Frown size={18} className={styles.moodBad} />;
            default: return <Meh size={18} className={styles.moodNeutral} />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>My Entries</h1>
                <p className={styles.subtitle}>View all your field log entries</p>
            </div>

            {/* Custom Dropdown */}
            <div className={styles.filters}>
                <div 
                    ref={dropdownRef}
                    className={`${styles.customDropdown} ${isDropdownOpen ? styles.dropdownOpen : ''}`}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    <User size={18} className={styles.dropdownIcon} />
                    <span className={styles.dropdownValue}>
                        {selectedClient 
                            ? clients.find(c => c.id === selectedClient)?.full_name 
                            : 'All Clients'}
                    </span>
                    <ChevronDown size={18} className={styles.dropdownArrow} />
                    
                    {isDropdownOpen && (
                        <div className={styles.dropdownMenu}>
                            <div 
                                className={`${styles.dropdownOption} ${!selectedClient ? styles.optionSelected : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedClient('');
                                    setIsDropdownOpen(false);
                                }}
                            >
                                <div className={styles.optionAvatar}>👥</div>
                                <span>All Clients</span>
                            </div>
                            {clients.map((client) => (
                                <div 
                                    key={client.id}
                                    className={`${styles.dropdownOption} ${selectedClient === client.id ? styles.optionSelected : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedClient(client.id);
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    <div className={styles.optionAvatar}>
                                        {client.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <span>{client.full_name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Entries List */}
            <div className={styles.entriesList}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>Loading entries...</p>
                    </div>
                ) : entries.length === 0 ? (
                    <div className={styles.emptyState}>
                        <ClipboardList size={48} className={styles.emptyIcon} />
                        <h3>No entries yet</h3>
                        <p>Record your first note to see it here</p>
                    </div>
                ) : (
                    entries.map((entry) => (
                        <div key={entry.id} className={styles.entryCard}>
                            <div className={styles.entryHeader}>
                                <div className={styles.entryMeta}>
                                    {getMoodIcon(entry.mood)}
                                    <span className={styles.clientName}>{entry.client_name}</span>
                                </div>
                                <div className={styles.entryDate}>
                                    <Calendar size={14} />
                                    <span>{formatDate(entry.created_at)}</span>
                                    <span className={styles.entryTime}>{formatTime(entry.created_at)}</span>
                                </div>
                            </div>
                            
                            {entry.summary && (
                                <p className={styles.entrySummary}>{entry.summary}</p>
                            )}

                            {entry.tags && entry.tags.length > 0 && (
                                <div className={styles.entryTags}>
                                    {entry.tags.map((tag, index) => (
                                        <span key={index} className={styles.tag}>{tag}</span>
                                    ))}
                                </div>
                            )}

                            {entry.consumer_hours && (
                                <div className={styles.consumerHours}>
                                    Consumer Hours: {entry.consumer_hours}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
