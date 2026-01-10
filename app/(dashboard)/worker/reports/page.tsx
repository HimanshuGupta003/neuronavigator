'use client';

import { useState, useEffect } from 'react';
import { FileText, Calendar, Download, User, Clock } from 'lucide-react';
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

    const handleGenerate = async () => {
        if (!selectedClient || !startDate || !endDate) {
            alert('Please select a client and date range');
            return;
        }

        setGenerating(true);

        // TODO: Implement actual PDF generation
        // This would:
        // 1. Fetch entries for the selected client within date range
        // 2. Send to AI for processing
        // 3. Generate PDF with government form template

        setTimeout(() => {
            alert('PDF generation coming soon! This will generate a report for the selected date range.');
            setGenerating(false);
        }, 1500);
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
                {/* Client Selector */}
                <div className={styles.section}>
                    <label className={styles.sectionLabel}>
                        <User size={18} />
                        Select Client
                    </label>
                    <select
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        className={styles.select}
                        disabled={loading}
                    >
                        <option value="">Choose a client...</option>
                        {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                                {client.full_name}
                            </option>
                        ))}
                    </select>
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

                {/* Generate Button */}
                <button
                    className={styles.generateButton}
                    onClick={handleGenerate}
                    disabled={!isFormValid || generating}
                >
                    {generating ? (
                        <>
                            <div className={styles.spinner}></div>
                            Generating...
                        </>
                    ) : (
                        <>
                            <FileText size={20} />
                            Generate PDF Report
                        </>
                    )}
                </button>
            </div>

            {/* Info Card */}
            <div className={styles.infoCard}>
                <h3 className={styles.infoTitle}>How it works</h3>
                <ul className={styles.infoList}>
                    <li>Select a client and date range</li>
                    <li>AI pulls all notes from that period</li>
                    <li>Generates a professional PDF report</li>
                    <li>Download for billing submission</li>
                </ul>
            </div>
        </div>
    );
}
