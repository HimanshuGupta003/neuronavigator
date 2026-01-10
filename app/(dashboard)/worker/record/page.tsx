'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, Check, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './record.module.css';

type MoodType = 'good' | 'neutral' | 'bad' | null;

interface Client {
    id: string;
    full_name: string;
}

export default function RecordNotePage() {
    const supabase = createClient();
    const [selectedMood, setSelectedMood] = useState<MoodType>(null);
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [clients, setClients] = useState<Client[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [loading, setLoading] = useState(true);

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

    const moods = [
        { type: 'good' as MoodType, emoji: '😊', label: 'Good', color: '#16a34a', bgColor: 'rgba(22, 163, 74, 0.1)' },
        { type: 'neutral' as MoodType, emoji: '😐', label: 'Neutral', color: '#ca8a04', bgColor: 'rgba(202, 138, 4, 0.1)' },
        { type: 'bad' as MoodType, emoji: '😟', label: 'Needs Attention', color: '#dc2626', bgColor: 'rgba(220, 38, 38, 0.1)' },
    ];

    const handleRecordToggle = () => {
        if (!selectedMood) {
            alert('Please select a mood before recording');
            return;
        }
        if (!selectedClient) {
            alert('Please select a client before recording');
            return;
        }
        setIsRecording(!isRecording);

        // TODO: Implement actual voice recording
        if (!isRecording) {
            // Start recording simulation
            setTranscript('');
        } else {
            // Stop recording - simulate transcript
            setTranscript('Voice recording will be transcribed here using AI...');
        }
    };

    const canRecord = selectedMood && selectedClient;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>New Note</h1>
                <p className={styles.subtitle}>Record a voice note for your client</p>
            </div>

            <div className={styles.card}>
                {/* Mood Selector - REQUIRED */}
                <div className={styles.moodSection}>
                    <p className={styles.moodLabel}>How is the client today?</p>
                    <div className={styles.moodButtons}>
                        {moods.map((mood) => (
                            <button
                                key={mood.type}
                                className={`${styles.moodButton} ${selectedMood === mood.type ? styles.moodButtonActive : ''}`}
                                style={{
                                    borderColor: selectedMood === mood.type ? mood.color : '#e2e8f0',
                                    background: selectedMood === mood.type ? mood.bgColor : '#f8fafc',
                                }}
                                onClick={() => setSelectedMood(mood.type)}
                            >
                                <span className={styles.moodEmoji}>{mood.emoji}</span>
                                <span className={styles.moodText} style={{ color: selectedMood === mood.type ? mood.color : '#64748b' }}>
                                    {mood.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Client Selector */}
                <div className={styles.clientSection}>
                    <label className={styles.clientLabel}>
                        <User size={16} />
                        Select Client
                    </label>
                    <select
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        className={styles.clientSelect}
                        disabled={loading}
                    >
                        <option value="">Choose a client...</option>
                        {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                                {client.full_name}
                            </option>
                        ))}
                    </select>
                    {clients.length === 0 && !loading && (
                        <p className={styles.noClients}>No clients yet. Add a client first.</p>
                    )}
                </div>

                {/* Recording Prompts */}
                <div className={styles.promptsSection}>
                    <p className={styles.promptTitle}>Cover these points:</p>
                    <ul className={styles.promptList}>
                        <li>What went well today?</li>
                        <li>Any behaviors or concerns?</li>
                        <li>Supports or interventions used?</li>
                    </ul>
                </div>

                {/* Record Button */}
                <div className={styles.recordSection}>
                    <button
                        className={`${styles.recordButton} ${isRecording ? styles.recordButtonRecording : styles.recordButtonIdle}`}
                        onClick={handleRecordToggle}
                        disabled={!canRecord}
                        style={{ opacity: canRecord ? 1 : 0.5 }}
                    >
                        {isRecording ? (
                            <MicOff size={48} className={styles.recordIcon} />
                        ) : (
                            <Mic size={48} className={styles.recordIcon} />
                        )}
                    </button>
                    <p className={`${styles.recordStatus} ${isRecording ? styles.recordStatusRecording : ''}`}>
                        {!canRecord ? 'Select mood & client to start' : (isRecording ? 'Recording... Tap to stop' : 'Tap to record')}
                    </p>
                </div>

                {/* Transcript Preview */}
                {transcript && (
                    <div className={styles.transcriptSection}>
                        <label className={styles.transcriptLabel}>
                            <Sparkles size={16} />
                            AI Transcript
                        </label>
                        <div className={styles.transcriptBox}>
                            <p className={styles.transcriptText}>{transcript}</p>
                        </div>

                        <button className={styles.submitButton}>
                            <Check size={20} />
                            Save Note
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
