'use client';

import { Mic, Construction, Sparkles } from 'lucide-react';
import styles from './record.module.css';

export default function WorkerRecordPage() {
    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Record Entry</h1>
                <p className={styles.subtitle}>Create a voice log entry</p>
            </div>

            <div className={styles.card}>
                <div className={styles.comingSoon}>
                    <div className={styles.iconContainer}>
                        <Construction size={34} />
                    </div>
                    <h2 className={styles.comingTitle}>Coming Soon</h2>
                    <p className={styles.comingText}>
                        Voice recording with AI transcription and processing will be implemented next.
                    </p>
                    <div className={styles.featureList}>
                        <div className={styles.featureItem}>
                            <Mic size={16} />
                            <span>Voice recording</span>
                        </div>
                        <div className={styles.featureItem}>
                            <Sparkles size={16} />
                            <span>AI transcription</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
