'use client';

import { ReactNode } from 'react';
import { AlertTriangle, CheckCircle, X, AlertCircle } from 'lucide-react';
import styles from './Modal.module.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    subtitle?: string;
    message: string;
    warningText?: string;
    disclaimerText?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'sos' | 'success' | 'warning';
    loading?: boolean;
}

export default function Modal({
    isOpen,
    onClose,
    onConfirm,
    title,
    subtitle,
    message,
    warningText,
    disclaimerText,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'sos',
    loading = false,
}: ModalProps) {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (variant) {
            case 'sos':
                return <AlertTriangle size={24} className={styles.icon} />;
            case 'success':
                return <CheckCircle size={24} className={styles.icon} />;
            case 'warning':
                return <AlertCircle size={24} className={styles.icon} />;
            default:
                return <AlertTriangle size={24} className={styles.icon} />;
        }
    };

    const modalClass = `${styles.modal} ${
        variant === 'sos' ? styles.modalSOS : 
        variant === 'success' ? styles.modalSuccess : ''
    }`;

    const confirmButtonClass = `${styles.button} ${
        variant === 'success' ? styles.buttonSuccess : styles.buttonConfirm
    } ${loading ? styles.buttonDisabled : ''}`;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={modalClass} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        {getIcon()}
                    </div>
                    <div className={styles.headerText}>
                        <h2 className={styles.title}>{title}</h2>
                        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    </div>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    <p className={styles.message}>{message}</p>
                    
                    {warningText && (
                        <div className={styles.warning}>
                            <AlertCircle size={18} className={styles.warningIcon} />
                            <p className={styles.warningText}>{warningText}</p>
                        </div>
                    )}

                    {disclaimerText && (
                        <p className={styles.disclaimer}>{disclaimerText}</p>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    {variant !== 'success' && (
                        <button 
                            className={`${styles.button} ${styles.buttonCancel}`}
                            onClick={onClose}
                            disabled={loading}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button 
                        className={confirmButtonClass}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className={styles.spinner}></div>
                                Sending...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
