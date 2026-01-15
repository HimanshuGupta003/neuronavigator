'use client';

import { useState, useEffect, useRef } from 'react';
import { ClipboardList, Calendar, User, ChevronDown, Smile, Meh, Frown, MapPin, Clock, X, Play, Pause, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './entries.module.css';

interface Entry {
    id: string;
    client_name: string;
    formatted_note: string;
    formatted_summary: string | null;
    summary: string;
    processed_text: string | null;
    mood: string;  // For backwards compat
    status: string;  // 'green', 'yellow', 'red'
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
    ipe_goal?: string | null;
}

export default function WorkerEntriesPage() {
    const supabase = createClient();
    const [entries, setEntries] = useState<Entry[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [selectedTag, setSelectedTag] = useState<string>('');
    const [selectedGoalProgress, setSelectedGoalProgress] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
    const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
    const [isGoalDropdownOpen, setIsGoalDropdownOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
    const [locationName, setLocationName] = useState<string>('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const monthDropdownRef = useRef<HTMLDivElement>(null);
    const tagDropdownRef = useRef<HTMLDivElement>(null);
    const goalDropdownRef = useRef<HTMLDivElement>(null);

    // Fetch location name when modal opens
    useEffect(() => {
        async function fetchLocationName() {
            if (selectedEntry?.gps_lat && selectedEntry?.gps_lng && !selectedEntry?.location_string) {
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedEntry.gps_lat}&lon=${selectedEntry.gps_lng}&zoom=16`
                    );
                    const data = await response.json();
                    if (data.display_name) {
                        // Extract just city/area from the full address
                        const parts = data.display_name.split(', ');
                        const shortName = parts.slice(0, 3).join(', ');
                        setLocationName(shortName);
                    }
                } catch (error) {
                    console.error('Failed to fetch location name:', error);
                    setLocationName('');
                }
            } else {
                setLocationName('');
            }
        }
        fetchLocationName();
    }, [selectedEntry]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target as Node)) {
                setIsMonthDropdownOpen(false);
            }
            if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
                setIsTagDropdownOpen(false);
            }
            if (goalDropdownRef.current && !goalDropdownRef.current.contains(event.target as Node)) {
                setIsGoalDropdownOpen(false);
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
    }, [selectedClient, selectedMonth, selectedTag, selectedGoalProgress]);

    async function loadClients() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('clients')
                    .select('id, full_name, ipe_goal')
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
                    // Client-side filtering for tags and goal progress
                    let filteredData = data;
                    
                    // Filter by tag
                    if (selectedTag) {
                        filteredData = filteredData.filter(entry => 
                            entry.tags && entry.tags.includes(selectedTag)
                        );
                    }
                    
                    // Filter by goal progress
                    if (selectedGoalProgress === 'hasProgress') {
                        filteredData = filteredData.filter(entry => 
                            (entry.tags && entry.tags.includes('IPE Progress')) ||
                            (entry.progress && entry.progress.length > 0)
                        );
                    } else if (selectedGoalProgress === 'noProgress') {
                        filteredData = filteredData.filter(entry => 
                            (!entry.tags || !entry.tags.includes('IPE Progress')) &&
                            (!entry.progress || entry.progress.length === 0)
                        );
                    }
                    
                    setEntries(filteredData);
                }
            }
        } catch (error) {
            console.error('Failed to load entries:', error);
        } finally {
            setLoading(false);
        }
    }

    // Mood emojis - matches record page styling
    const getMoodEmoji = (status: string) => {
        switch (status) {
            case 'green':
            case 'good':
                return <span className={styles.moodEmoji} title="Good">😊</span>;
            case 'red':
            case 'bad':
                return <span className={styles.moodEmoji} title="Needs Attention">😟</span>;
            case 'yellow':
            case 'neutral':
            default:
                return <span className={styles.moodEmoji} title="Neutral">😐</span>;
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

    // Get unique tags from all entries for filter dropdown
    const getUniqueTags = (): string[] => {
        const allTags = new Set<string>();
        entries.forEach(entry => {
            if (entry.tags) {
                entry.tags.forEach(tag => allTags.add(tag));
            }
        });
        return Array.from(allTags).sort();
    };

    // Get selected client data for IPE goal display
    const getSelectedClientData = () => {
        if (!selectedClient) return null;
        return clients.find(c => c.id === selectedClient);
    };

    const selectedClientData = getSelectedClientData();

    // Trend Detection - Analyze attendance patterns
    const getAttendanceTrends = () => {
        if (!selectedClient || entries.length < 2) return null;
        
        // Filter entries for selected client
        const clientEntries = entries.slice(0, 10); // Last 10 entries for trend
        
        // Count entries with attendance-related tags
        let attendanceIssues = 0;
        let totalChecked = Math.min(clientEntries.length, 5);
        
        clientEntries.slice(0, 5).forEach(entry => {
            if (entry.tags && entry.tags.some((tag: string) => 
                ['Attendance', 'Punctuality', 'Late', 'Tardy'].includes(tag)
            )) {
                attendanceIssues++;
            }
            // Also check if formatted_note mentions late/tardiness
            if (entry.formatted_note && (
                entry.formatted_note.toLowerCase().includes('late') ||
                entry.formatted_note.toLowerCase().includes('tardy') ||
                entry.formatted_note.toLowerCase().includes('attendance barrier')
            )) {
                attendanceIssues++;
            }
        });
        
        // Dedupe - max 1 issue per entry
        attendanceIssues = Math.min(attendanceIssues, totalChecked);
        
        if (attendanceIssues >= 2) {
            return {
                type: 'attendance',
                message: `Late ${attendanceIssues} of ${totalChecked} recent sessions`,
                severity: attendanceIssues >= 3 ? 'high' : 'medium'
            };
        }
        
        return null;
    };

    const attendanceTrend = getAttendanceTrends();

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

                {/* Tag Filter Dropdown */}
                <div 
                    ref={tagDropdownRef}
                    className={`${styles.customDropdown} ${isTagDropdownOpen ? styles.dropdownOpen : ''}`}
                    onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                >
                    <span className={styles.dropdownValue}>{selectedTag || 'All Tags'}</span>
                    <ChevronDown size={18} className={styles.dropdownArrow} />
                    
                    {isTagDropdownOpen && (
                        <div className={styles.dropdownMenu}>
                            <div 
                                className={`${styles.dropdownOption} ${!selectedTag ? styles.optionSelected : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTag('');
                                    setIsTagDropdownOpen(false);
                                }}
                            >
                                <span>All Tags</span>
                            </div>
                            {getUniqueTags().map((tag) => (
                                <div 
                                    key={tag}
                                    className={`${styles.dropdownOption} ${selectedTag === tag ? styles.optionSelected : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTag(tag);
                                        setIsTagDropdownOpen(false);
                                    }}
                                >
                                    <span>{tag}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Goal Progress Dropdown */}
                <div 
                    ref={goalDropdownRef}
                    className={`${styles.customDropdown} ${isGoalDropdownOpen ? styles.dropdownOpen : ''}`}
                    onClick={() => setIsGoalDropdownOpen(!isGoalDropdownOpen)}
                >
                    <span className={styles.dropdownValue}>
                        {selectedGoalProgress === 'hasProgress' ? 'With Progress' : 
                         selectedGoalProgress === 'noProgress' ? 'No Progress' : 'All Goal Progress'}
                    </span>
                    <ChevronDown size={18} className={styles.dropdownArrow} />
                    
                    {isGoalDropdownOpen && (
                        <div className={styles.dropdownMenu}>
                            {[
                                { value: '', label: 'All Goal Progress' },
                                { value: 'hasProgress', label: 'With Progress' },
                                { value: 'noProgress', label: 'No Progress' },
                            ].map((option) => (
                                <div 
                                    key={option.value}
                                    className={`${styles.dropdownOption} ${selectedGoalProgress === option.value ? styles.optionSelected : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedGoalProgress(option.value);
                                        setIsGoalDropdownOpen(false);
                                    }}
                                >
                                    <span>{option.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Trend Warning Banner */}
            {attendanceTrend && (
                <div className={`${styles.trendWarning} ${attendanceTrend.severity === 'high' ? styles.trendHigh : styles.trendMedium}`}>
                    <AlertCircle size={18} />
                    <span>📊 <strong>Trend Alert:</strong> {attendanceTrend.message}</span>
                </div>
            )}

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
                            {getMoodEmoji(entry.status || entry.mood)}
                            </div>
                            
                            {/* AI Formatted Summary */}
                            <p className={styles.entrySummary}>
                                {getCardSummary(entry)}
                            </p>

                            {/* Tags + GPS Indicator */}
                            <div className={styles.entryCardFooter}>
                                {entry.tags && entry.tags.length > 0 && (
                                    <div className={styles.entryTags}>
                                        {entry.tags.slice(0, 3).map((tag, index) => (
                                            <span key={index} className={styles.tag}>{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>

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
                                    {formatSmartTimestamp(selectedEntry.created_at)} {getMoodEmoji(selectedEntry.status || selectedEntry.mood)}
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
                            </div>

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

                            {/* Data Section */}
                            <div className={styles.dataSection}>
                                <h3 className={styles.dataSectionTitle}>📊 Session Data</h3>
                                <div className={styles.dataGrid}>
                                    {/* Consumer Hours */}
                                    <div className={styles.dataItem}>
                                        <span className={styles.dataLabel}>Consumer Hours</span>
                                        <span className={styles.dataValue}>
                                            {selectedEntry.consumer_hours ? `${selectedEntry.consumer_hours} hrs` : '—'}
                                        </span>
                                    </div>
                                    
                                    {/* Mood */}
                                    <div className={styles.dataItem}>
                                        <span className={styles.dataLabel}>Mood</span>
                                        <span className={styles.dataValue}>
                                            {getMoodEmoji(selectedEntry.status || selectedEntry.mood)}
                                        </span>
                                    </div>
                                    
                                    {/* Timestamp */}
                                    <div className={styles.dataItem}>
                                        <span className={styles.dataLabel}>Recorded</span>
                                        <span className={styles.dataValue}>
                                            {new Date(selectedEntry.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    
                                    {/* Location */}
                                    <div className={styles.dataItem}>
                                        <span className={styles.dataLabel}>Location</span>
                                        <span className={styles.dataValue}>
                                            {selectedEntry.location_string ? (
                                                <span className={styles.locationWithIcon}>
                                                    <MapPin size={14} />
                                                    {selectedEntry.location_string}
                                                </span>
                                            ) : selectedEntry.gps_lat && selectedEntry.gps_lng ? (
                                                <span className={styles.locationWithIcon}>
                                                    <MapPin size={14} />
                                                    <span className={styles.locationDetails}>
                                                        {locationName || 'Loading...'}
                                                        <span className={styles.locationCoords}>
                                                            ({selectedEntry.gps_lat.toFixed(4)}, {selectedEntry.gps_lng.toFixed(4)})
                                                        </span>
                                                    </span>
                                                </span>
                                            ) : '—'}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* IPE Goal Display */}
                                {selectedClientData?.ipe_goal && (
                                    <div className={styles.ipeGoalBox}>
                                        <span className={styles.ipeGoalLabel}>🎯 IPE Goal</span>
                                        <p className={styles.ipeGoalText}>{selectedClientData.ipe_goal}</p>
                                    </div>
                                )}
                            </div>

                            {/* Audit Section */}
                            <div className={styles.auditSection}>
                                <h3 className={styles.auditSectionTitle}>📝 Audit Trail</h3>
                                
                                {/* Raw Transcript */}
                                {selectedEntry.raw_transcript && (
                                    <details className={styles.auditDetail}>
                                        <summary className={styles.auditSummary}>
                                            <span>🎤 Raw Transcript</span>
                                            <ChevronDown size={16} />
                                        </summary>
                                        <p className={styles.auditContent}>{selectedEntry.raw_transcript}</p>
                                    </details>
                                )}
                                
                                {/* Audio Playback */}
                                {selectedEntry.audio_url && (
                                    <div className={styles.audioPlayer}>
                                        <span className={styles.audioLabel}>🔊 Audio Recording</span>
                                        <audio 
                                            controls 
                                            className={styles.audioElement}
                                            src={selectedEntry.audio_url}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

