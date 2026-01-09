'use client';

import { ClipboardList, Construction, Sparkles } from 'lucide-react';
import styles from './entries.module.css';

export default function WorkerEntriesPage() {
    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>My Entries</h1>
                <p className={styles.subtitle}>View all your field log entries</p>
            </div>

            <div className={styles.card}>
                <div className={styles.comingSoon}>
                    <div className={styles.iconContainer}>
                        <Construction size={34} />
                    </div>
                    <h2 className={styles.comingTitle}>Coming Soon</h2>
                    <p className={styles.comingText}>
                        Entry listing will be available once voice recording features are implemented.
                    </p>
                    <div className={styles.featureList}>
                        <div className={styles.featureItem}>
                            <ClipboardList size={16} />
                            <span>Entry history</span>
                        </div>
                        <div className={styles.featureItem}>
                            <Sparkles size={16} />
                            <span>Smart search</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
