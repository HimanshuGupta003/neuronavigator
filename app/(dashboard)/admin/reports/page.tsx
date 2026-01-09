'use client';

import { FileText, Construction, Sparkles } from 'lucide-react';
import styles from './reports.module.css';

export default function AdminReportsPage() {
    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Reports</h1>
                <p className={styles.subtitle}>View all generated reports</p>
            </div>

            <div className={styles.card}>
                <div className={styles.comingSoon}>
                    <div className={styles.iconContainer}>
                        <Construction size={34} />
                    </div>
                    <h2 className={styles.comingTitle}>Coming Soon</h2>
                    <p className={styles.comingText}>
                        The reports section will be available once voice recording and AI processing features are implemented.
                    </p>
                    <div className={styles.featureList}>
                        <div className={styles.featureItem}>
                            <Sparkles size={16} />
                            <span>AI-generated summaries</span>
                        </div>
                        <div className={styles.featureItem}>
                            <FileText size={16} />
                            <span>Export to PDF</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
