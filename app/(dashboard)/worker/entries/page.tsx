'use client';

import { useState, useEffect, useRef } from 'react';
import { ClipboardList, Calendar, User, ChevronDown, Smile, Meh, Frown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './entries.module.css';

interface Entry {
    id: string;
    client_name: string;
    formatted_note: string;
    formatted_summary: string | null;
    summary: string;
    processed_text: string | null;
    mood: string;
    tags: string[];
    consumer_hours: number | null;
    created_at: string;
    // Narrative fields
    tasks: string | null;
    barriers: string | null;
    interventions: string | null;
    progress: string | null;
    // Audio/Transcript
    raw_transcript: string | null;
    audio_url: string | null;
    // Metadata
    gps_lat: number | null;
    gps_lng: number | null;
    location_string: string | null;
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
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const monthDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target as Node)) {
                setIsMonthDropdownOpen(false);
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
    }, [selectedClient, selectedMonth]);

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
                    .limit(100);

                if (selectedClient) {
                    const client = clients.find(c => c.id === selectedClient);
                    if (client) {
                        query = query.eq('client_name', client.full_name);
                    }
                }

                // Apply month filter
                if (selectedMonth !== 'all') {
                    const now = new Date();
                    let startDate: Date;
                    
                    switch (selectedMonth) {
                        case '7days':
                            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                            break;
                        case 'thisMonth':
                            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                            break;
                        case 'lastMonth':
                            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                            query = query.lte('created_at', endOfLastMonth.toISOString());
                            break;
                        default:
                            startDate = new Date(0);
                    }
                    
                    if (selectedMonth !== 'lastMonth') {
                        query = query.gte('created_at', startDate.toISOString());
                    } else {
                        query = query.gte('created_at', startDate.toISOString());
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

    // Colored mood dots
    const getMoodDot = (mood: string) => {
        switch (mood) {
            case 'good': return <span className={styles.moodDot} title="Good">🟢</span>;
            case 'bad': return <span className={styles.moodDot} title="Needs Attention">🔴</span>;
            default: return <span className={styles.moodDot} title="Neutral">🟡</span>;
        }
    };

    // Smart timestamp formatting
    const formatSmartTimestamp = (dateStr: string): string => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
        const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        if (daysDiff === 0) {
            return `Today ${time}`;
        } else if (daysDiff === 1) {
            return `Yesterday ${time}`;
        } else if (daysDiff < 7) {
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            return `${dayName} ${time}`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const getMonthLabel = () => {
        switch (selectedMonth) {
            case '7days': return 'Last 7 Days';
            case 'thisMonth': return 'This Month';
            case 'lastMonth': return 'Last Month';
            default: return 'All Time';
        }
    };

    // Helper to strip markdown and section headers for clean card display
    const cleanNoteText = (text: string): string => {
        if (!text) return 'No content available';
        return text
            // Remove section headers (with or without ** markers)
            .replace(/\*?\*?Tasks?\s*&?\s*Productivity:?\*?\*?/gi, '')
            .replace(/\*?\*?Barriers?\s*&?\s*Behaviors?:?\*?\*?/gi, '')
            .replace(/\*?\*?Interventions?:?\*?\*?/gi, '')
            .replace(/\*?\*?Progress\s*(?:on\s*)?Goals?:?\*?\*?/gi, '')
            // Remove **bold** markers
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            // Remove *italic* markers
            .replace(/\*([^*]+)\*/g, '$1')
            // Remove markdown headers
            .replace(/#{1,6}\s?/g, '')
            // Replace newlines with space and normalize whitespace
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 180);
    };

    // Get display summary for entry card
    const getCardSummary = (entry: Entry): string => {
        // If we have the AI-generated short summary, show it fully (no truncation)
        if (entry.formatted_summary) {
            return entry.formatted_summary;
        }
        
        // For fallback text, clean and truncate
        const text = entry.summary || entry.processed_text || entry.formatted_note || entry.raw_transcript || '';
        const cleaned = cleanNoteText(text);
        return cleaned.length > 150 ? cleaned.substring(0, 150) + '...' : cleaned;
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>My Entries</h1>
                <p className={styles.subtitle}>View all your field log entries</p>
            </div>

            {/* Filters Row */}
            <div className={styles.filters}>
                {/* Client Dropdown */}
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

                {/* Month Dropdown */}
                <div 
                    ref={monthDropdownRef}
                    className={`${styles.customDropdown} ${isMonthDropdownOpen ? styles.dropdownOpen : ''}`}
                    onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                >
                    <Calendar size={18} className={styles.dropdownIcon} />
                    <span className={styles.dropdownValue}>{getMonthLabel()}</span>
                    <ChevronDown size={18} className={styles.dropdownArrow} />
                    
                    {isMonthDropdownOpen && (
                        <div className={styles.dropdownMenu}>
                            {[
                                { value: 'all', label: 'All Time' },
                                { value: '7days', label: 'Last 7 Days' },
                                { value: 'thisMonth', label: 'This Month' },
                                { value: 'lastMonth', label: 'Last Month' },
                            ].map((option) => (
                                <div 
                                    key={option.value}
                                    className={`${styles.dropdownOption} ${selectedMonth === option.value ? styles.optionSelected : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedMonth(option.value);
                                        setIsMonthDropdownOpen(false);
                                    }}
                                >
                                    <span>{option.label}</span>
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
                        <div key={entry.id} className={styles.entryCard} onClick={() => setSelectedEntry(entry)}>
                            {/* Header: Client Name — Timestamp + Mood */}
                            <div className={styles.entryHeader}>
                                <div className={styles.entryClientRow}>
                                    <span className={styles.clientName}>{entry.client_name || 'General Note'}</span>
                                    <span className={styles.entryTimestamp}>— {formatSmartTimestamp(entry.created_at)}</span>
                                </div>
                                {getMoodDot(entry.mood)}
                            </div>
                            
                            {/* AI Formatted Summary */}
                            <p className={styles.entrySummary}>
                                {getCardSummary(entry)}
                            </p>

                            {/* Tags */}
                            {entry.tags && entry.tags.length > 0 && (
                                <div className={styles.entryTags}>
                                    {entry.tags.slice(0, 3).map((tag, index) => (
                                        <span key={index} className={styles.tag}>{tag}</span>
                                    ))}
                                </div>
                            )}

                            {/* View Details Link */}
                            <button className={styles.viewDetailsBtn}>
                                View Details →
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* View Details Modal */}
            {selectedEntry && (
                <div className={styles.modalOverlay} onClick={() => setSelectedEntry(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h2 className={styles.modalTitle}>{selectedEntry.client_name || 'General Note'}</h2>
                                <p className={styles.modalSubtitle}>
                                    {formatSmartTimestamp(selectedEntry.created_at)} {getMoodDot(selectedEntry.mood)}
                                </p>
                            </div>
                            <button className={styles.modalClose} onClick={() => setSelectedEntry(null)}>×</button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* 1. AI Formatted Note - Always First */}
                            <div className={styles.formattedNoteCard}>
                                <div className={styles.formattedNoteHeader}>
                                    <span className={styles.formattedNoteIcon}>✨</span>
                                    <h3>AI Formatted Note</h3>
                                </div>
                                <div className={styles.formattedNoteContent}>
                                    {(() => {
                                        // Use formatted_note (primary) or processed_text (backwards compat) as fallback
                                        const noteText = selectedEntry.formatted_note || selectedEntry.processed_text || '';
                                        
                                        if (!noteText) {
                                            return <p>{selectedEntry.summary || 'No AI formatted note available.'}</p>;
                                        }

                                        // Check if note has ** markers (markdown format)
                                        if (noteText.includes('**')) {
                                            return (
                                                <div className={styles.noteSectionsContainer}>
                                                    {noteText.split('**').filter(Boolean).map((section, index) => {
                                                        if (index % 2 === 0) {
                                                            const headerText = section.replace(/[:*]/g, '').trim();
                                                            if (!headerText) return null;
                                                            
                                                            let headerClass = styles.tasksHeader;
                                                            let icon = '📋';
                                                            if (headerText.toLowerCase().includes('barrier') || headerText.toLowerCase().includes('behavior')) {
                                                                headerClass = styles.barriersHeader;
                                                                icon = '⚠️';
                                                            } else if (headerText.toLowerCase().includes('intervention')) {
                                                                headerClass = styles.interventionsHeader;
                                                                icon = '🛠️';
                                                            } else if (headerText.toLowerCase().includes('progress') || headerText.toLowerCase().includes('goal')) {
                                                                headerClass = styles.progressHeader;
                                                                icon = '📈';
                                                            }
                                                            
                                                            return (
                                                                <div key={index} className={`${styles.noteSection} ${headerClass}`}>
                                                                    <h4 className={styles.noteSectionHeader}>{icon} {headerText.toUpperCase()}</h4>
                                                                </div>
                                                            );
                                                        } else {
                                                            const content = section.trim();
                                                            if (!content) return null;
                                                            return <p key={index} className={styles.noteSectionContent}>{content}</p>;
                                                        }
                                                    })}
                                                </div>
                                            );
                                        }

                                        // No ** markers - parse by header patterns
                                        const headerPatterns = [
                                            { pattern: /Tasks?\s*&?\s*Productivity:?/gi, icon: '📋', class: styles.tasksHeader, label: 'TASKS & PRODUCTIVITY' },
                                            { pattern: /Barriers?\s*&?\s*Behaviors?:?/gi, icon: '⚠️', class: styles.barriersHeader, label: 'BARRIERS & BEHAVIORS' },
                                            { pattern: /Interventions?:?/gi, icon: '🛠️', class: styles.interventionsHeader, label: 'INTERVENTIONS' },
                                            { pattern: /Progress\s*(?:on\s*)?Goals?:?/gi, icon: '📈', class: styles.progressHeader, label: 'PROGRESS ON GOALS' },
                                        ];

                                        // Split by any header pattern
                                        const allPatterns = headerPatterns.map(h => h.pattern.source).join('|');
                                        const splitRegex = new RegExp(`(${allPatterns})`, 'gi');
                                        const parts = noteText.split(splitRegex).filter(Boolean);

                                        return (
                                            <div className={styles.noteSectionsContainer}>
                                                {parts.map((part, index) => {
                                                    const trimmed = part.trim();
                                                    if (!trimmed) return null;
                                                    
                                                    // Check if this part is a header
                                                    const matchedHeader = headerPatterns.find(h => h.pattern.test(trimmed));
                                                    if (matchedHeader) {
                                                        // Reset regex lastIndex
                                                        matchedHeader.pattern.lastIndex = 0;
                                                        return (
                                                            <div key={index} className={`${styles.noteSection} ${matchedHeader.class}`}>
                                                                <h4 className={styles.noteSectionHeader}>{matchedHeader.icon} {matchedHeader.label}</h4>
                                                            </div>
                                                        );
                                                    }
                                                    
                                                    // This is content
                                                    return <p key={index} className={styles.noteSectionContent}>{trimmed}</p>;
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                                {selectedEntry.consumer_hours && (
                                    <div className={styles.hoursChip}>
                                        🕐 {selectedEntry.consumer_hours} consumer hours
                                    </div>
                                )}
                            </div>

                            {/* 2. Original Transcript */}
                            {selectedEntry.raw_transcript && (
                                <div className={styles.transcriptCard}>
                                    <div className={styles.transcriptHeader}>
                                        <span className={styles.transcriptIcon}>🎙️</span>
                                        <h3>Original Transcript</h3>
                                    </div>
                                    <p className={styles.transcriptText}>{selectedEntry.raw_transcript}</p>
                                </div>
                            )}

                            {/* 3. Audio Playback */}
                            {selectedEntry.audio_url && (
                                <div className={styles.audioCard}>
                                    <h4>🔊 Audio Recording</h4>
                                    <audio controls src={selectedEntry.audio_url} className={styles.audioPlayer}>
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            )}

                            {/* 4. Narrative Headers Grid - Beautified */}
                            {(selectedEntry.tasks || selectedEntry.barriers || selectedEntry.interventions || selectedEntry.progress) && (
                                <div className={styles.narrativeGrid}>
                                    <h3 className={styles.narrativeGridTitle}>📄 Detailed Documentation</h3>
                                    <div className={styles.narrativeCards}>
                                        {selectedEntry.tasks && (
                                            <div className={`${styles.narrativeCard} ${styles.tasksCard}`}>
                                                <div className={styles.narrativeCardHeader}>
                                                    <span className={styles.narrativeIcon}>📋</span>
                                                    <h4>Tasks & Productivity</h4>
                                                </div>
                                                <p>{selectedEntry.tasks}</p>
                                            </div>
                                        )}
                                        {selectedEntry.barriers && (
                                            <div className={`${styles.narrativeCard} ${styles.barriersCard}`}>
                                                <div className={styles.narrativeCardHeader}>
                                                    <span className={styles.narrativeIcon}>⚠️</span>
                                                    <h4>Barriers & Behaviors</h4>
                                                </div>
                                                <p>{selectedEntry.barriers}</p>
                                            </div>
                                        )}
                                        {selectedEntry.interventions && (
                                            <div className={`${styles.narrativeCard} ${styles.interventionsCard}`}>
                                                <div className={styles.narrativeCardHeader}>
                                                    <span className={styles.narrativeIcon}>🛠️</span>
                                                    <h4>Interventions</h4>
                                                </div>
                                                <p>{selectedEntry.interventions}</p>
                                            </div>
                                        )}
                                        {selectedEntry.progress && (
                                            <div className={`${styles.narrativeCard} ${styles.progressCard}`}>
                                                <div className={styles.narrativeCardHeader}>
                                                    <span className={styles.narrativeIcon}>📈</span>
                                                    <h4>Progress on Goals</h4>
                                                </div>
                                                <p>{selectedEntry.progress}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                                <div className={styles.modalTags}>
                                    {selectedEntry.tags.map((tag, i) => (
                                        <span key={i} className={styles.tag}>{tag}</span>
                                    ))}
                                </div>
                            )}

                            {/* Metadata Footer */}
                            <div className={styles.metadataFooter}>
                                {selectedEntry.location_string && (
                                    <span className={styles.metaChip}>📍 {selectedEntry.location_string}</span>
                                )}
                                {selectedEntry.gps_lat && selectedEntry.gps_lng && !selectedEntry.location_string && (
                                    <span className={styles.metaChip}>
                                        📍 {selectedEntry.gps_lat.toFixed(4)}, {selectedEntry.gps_lng.toFixed(4)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

