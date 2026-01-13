'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Calendar, Download, User, Clock, Eye, X, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './reports.module.css';

interface Client {
    id: string;
    full_name: string;
}

export default function WorkerReportsPage() {
    const supabase = createClient();
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsClientDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        loadClients();
    }, []);

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
        } finally {
            setLoading(false);
        }
    }

    // Quick select: Last Month
    const handleLastMonth = () => {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        setStartDate(formatDate(lastMonth));
        setEndDate(formatDate(lastMonthEnd));
    };

    // Quick select: This Month
    const handleThisMonth = () => {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        setStartDate(formatDate(thisMonthStart));
        setEndDate(formatDate(thisMonthEnd));
    };

    // Quick select: Last 7 Days
    const handleLast7Days = () => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        setStartDate(formatDate(weekAgo));
        setEndDate(formatDate(now));
    };

    function formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    const handleGenerate = async (preview: boolean = false) => {
        if (!selectedClient || !startDate || !endDate) {
            alert('Please select a client and date range');
            return;
        }

        setGenerating(true);

        try {
            // Call PDF generation API
            const response = await fetch(
                `/api/generate-pdf?clientId=${selectedClient}&startDate=${startDate}&endDate=${endDate}`
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate PDF');
            }

            // Get the PDF blob
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            if (preview) {
                // Show preview modal
                setPdfUrl(url);
                setShowPreview(true);
            } else {
                // Direct download
                const a = document.createElement('a');
                a.href = url;
                a.download = `Report_${startDate}_to_${endDate}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert(error instanceof Error ? error.message : 'Failed to generate PDF');
        } finally {
            setGenerating(false);
        }
    };

    const handleClosePreview = () => {
        if (pdfUrl) {
            window.URL.revokeObjectURL(pdfUrl);
        }
        setPdfUrl(null);
        setShowPreview(false);
    };

    const handleDownloadFromPreview = () => {
        if (pdfUrl) {
            const a = document.createElement('a');
            a.href = pdfUrl;
            a.download = `Report_${startDate}_to_${endDate}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    const isFormValid = selectedClient && startDate && endDate;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Generate Report</h1>
                <p className={styles.subtitle}>Create monthly billing reports for your clients</p>
            </div>

            <div className={styles.card}>
                {/* Client Selector - Custom Dropdown */}
                <div className={styles.section}>
                    <label className={styles.sectionLabel}>
                        <User size={18} />
                        Select Client
                    </label>
                    <div 
                        ref={dropdownRef}
                        className={`${styles.customDropdown} ${isClientDropdownOpen ? styles.dropdownOpen : ''}`}
                        onClick={() => !loading && setIsClientDropdownOpen(!isClientDropdownOpen)}
                    >
                        <span className={styles.dropdownValue}>
                            {selectedClient 
                                ? clients.find(c => c.id === selectedClient)?.full_name 
                                : 'Choose a client...'}
                        </span>
                        <ChevronDown size={18} className={styles.dropdownArrow} />
                        
                        {isClientDropdownOpen && (
                            <div className={styles.dropdownMenu}>
                                {clients.map((client) => (
                                    <div 
                                        key={client.id}
                                        className={`${styles.dropdownOption} ${selectedClient === client.id ? styles.optionSelected : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedClient(client.id);
                                            setIsClientDropdownOpen(false);
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

                {/* Date Range */}
                <div className={styles.section}>
                    <label className={styles.sectionLabel}>
                        <Calendar size={18} />
                        Date Range
                    </label>

                    {/* Quick Select Buttons */}
                    <div className={styles.quickSelectRow}>
                        <button
                            className={styles.quickButton}
                            onClick={handleLastMonth}
                            type="button"
                        >
                            Last Month
                        </button>
                        <button
                            className={styles.quickButton}
                            onClick={handleThisMonth}
                            type="button"
                        >
                            This Month
                        </button>
                        <button
                            className={styles.quickButton}
                            onClick={handleLast7Days}
                            type="button"
                        >
                            Last 7 Days
                        </button>
                    </div>

                    {/* Date Inputs */}
                    <div className={styles.dateRow}>
                        <div className={styles.dateGroup}>
                            <label className={styles.dateLabel}>Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={styles.dateInput}
                            />
                        </div>
                        <div className={styles.dateSeparator}>to</div>
                        <div className={styles.dateGroup}>
                            <label className={styles.dateLabel}>End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={styles.dateInput}
                            />
                        </div>
                    </div>
                </div>

                {/* Selected Range Display */}
                {startDate && endDate && (
                    <div className={styles.rangePreview}>
                        <Clock size={16} />
                        <span>
                            Report period: {new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                            {' – '}
                            {new Date(endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className={styles.buttonRow}>
                    <button
                        className={styles.previewButton}
                        onClick={() => handleGenerate(true)}
                        disabled={!isFormValid || generating}
                    >
                        <Eye size={20} />
                        Preview
                    </button>
                    <button
                        className={styles.generateButton}
                        onClick={() => handleGenerate(false)}
                        disabled={!isFormValid || generating}
                    >
                        {generating ? (
                            <>
                                <div className={styles.spinner}></div>
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                Download PDF
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Info Card */}
            <div className={styles.infoCard}>
                <h3 className={styles.infoTitle}>How it works</h3>
                <ul className={styles.infoList}>
                    <li>Select a client and date range</li>
                    <li>Preview or download professional PDF report</li>
                    <li>Includes attendance log and AI narratives</li>
                    <li>Submit for billing</li>
                </ul>
            </div>

            {/* PDF Preview Modal */}
            {showPreview && pdfUrl && (
                <div className={styles.previewOverlay} onClick={handleClosePreview}>
                    <div className={styles.previewModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.previewHeader}>
                            <h3>Report Preview</h3>
                            <div className={styles.previewActions}>
                                <button onClick={handleDownloadFromPreview} className={styles.downloadBtn}>
                                    <Download size={18} />
                                    Download
                                </button>
                                <button onClick={handleClosePreview} className={styles.closeBtn}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <iframe 
                            src={pdfUrl} 
                            className={styles.pdfFrame}
                            title="PDF Preview"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

