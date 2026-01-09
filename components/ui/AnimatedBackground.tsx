'use client';

import { useEffect, useState } from 'react';
import styles from './AnimatedBackground.module.css';

interface AnimatedBackgroundProps {
    children: React.ReactNode;
    showParticles?: boolean;
}

export default function AnimatedBackground({ children, showParticles = true }: AnimatedBackgroundProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className={styles.container}>
            {/* Animated Background */}
            <div className={styles.background}>
                <div className={styles.gradientOrb1}></div>
                <div className={styles.gradientOrb2}></div>
                <div className={styles.gradientOrb3}></div>
                <div className={styles.gridOverlay}></div>
            </div>

            {/* Floating Particles */}
            {showParticles && (
                <div className={styles.particles}>
                    {[...Array(15)].map((_, i) => (
                        <div
                            key={i}
                            className={styles.particle}
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`,
                                animationDuration: `${15 + Math.random() * 10}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Content */}
            <div className={`${styles.content} ${mounted ? styles.mounted : ''}`}>
                {children}
            </div>
        </div>
    );
}
