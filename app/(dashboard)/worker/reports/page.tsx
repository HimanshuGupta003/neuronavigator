'use client';

import { FileText, Construction, Sparkles, Download } from 'lucide-react';
import styles from './reports.module.css';

export default function WorkerReportsPage() {
    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>My Reports</h1>
                <p className={styles.subtitle}>View and download your generated reports</p>
            </div>

            <div className={styles.card}>
                <div className={styles.comingSoon}>
                    <div className={styles.iconContainer}>
                        <Construction size={34} />
                    </div>
                    <h2 className={styles.comingTitle}>Coming Soon</h2>
                    <p className={styles.comingText}>
                        PDF report generation will be available once voice recording and AI processing are complete.
                    </p>
                    <div className={styles.featureList}>
                        <div className={styles.featureItem}>
                            <FileText size={16} />
                            <span>PDF reports</span>
                        </div>
                        <div className={styles.featureItem}>
                            <Download size={16} />
                            <span>Easy download</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
