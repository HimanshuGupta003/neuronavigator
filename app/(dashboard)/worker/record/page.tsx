'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Check, User, Loader2, Edit3, Play, Pause, RotateCcw, Send, AlertCircle, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './record.module.css';

type MoodType = 'good' | 'neutral' | 'bad' | null;

interface Client {
    id: string;
    full_name: string;
    client_goals: string | null;
    ipe_goal: string | null;  // IPE Goal for DOR compliance
}

type ProcessingStep = 'idle' | 'recording' | 'recorded' | 'transcribing' | 'formatting' | 'ready' | 'saving' | 'saved';

const MIN_RECORDING_TIME = 3; // 3 seconds minimum
const MAX_RECORDING_TIME = 300; // 5 minutes maximum

export default function RecordNotePage() {
    const supabase = createClient();
    const [selectedMood, setSelectedMood] = useState<MoodType>(null);
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasActiveShift, setHasActiveShift] = useState<boolean | null>(null);  // null = checking, false = no shift, true = has shift
    
    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    
    // Audio playback state
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    // Processing state
    const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
    const [rawTranscript, setRawTranscript] = useState('');
    const [formattedNote, setFormattedNote] = useState('');
    const [summary, setSummary] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [consumerHours, setConsumerHours] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Waveform visualization refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const [waveformBars, setWaveformBars] = useState<number[]>(new Array(20).fill(0));

    useEffect(() => {
        loadClients();
        checkActiveShift();
        
        // Cleanup audio URL on unmount
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function loadClients() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('clients')
                    .select('id, full_name, client_goals, ipe_goal')
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

    async function checkActiveShift() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('shifts')
                    .select('id')
                    .eq('worker_id', user.id)
                    .is('clock_out_at', null)
                    .limit(1)
                    .single();

                setHasActiveShift(!!data);
            } else {
                setHasActiveShift(false);
            }
        } catch {
            // No active shift found (expected when no shift)
            setHasActiveShift(false);
        }
    }

    const moods = [
        { type: 'good' as MoodType, emoji: '😊', label: 'Good', color: '#16a34a', bgColor: 'rgba(22, 163, 74, 0.1)' },
        { type: 'neutral' as MoodType, emoji: '😐', label: 'Neutral', color: '#ca8a04', bgColor: 'rgba(202, 138, 4, 0.1)' },
        { type: 'bad' as MoodType, emoji: '😟', label: 'Needs Attention', color: '#dc2626', bgColor: 'rgba(220, 38, 38, 0.1)' },
    ];

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            
            // Setup audio context for waveform visualization
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 512; // Higher resolution
            analyser.smoothingTimeConstant = 0.3; // Smoother animation
            
            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            
            // Calculate waveform bars for visualization
            const updateWaveform = () => {
                if (!analyserRef.current) return;
                
                const bufferLength = analyserRef.current.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                // Use time domain data for waveform
                analyserRef.current.getByteTimeDomainData(dataArray);
                
                // Sample 20 bars evenly distributed
                const barsCount = 20;
                const step = Math.floor(bufferLength / barsCount);
                const bars: number[] = [];
                
                for (let i = 0; i < barsCount; i++) {
                    // Get max deviation in a range for each bar
                    let maxDeviation = 0;
                    for (let j = 0; j < step; j++) {
                        const value = dataArray[i * step + j];
                        const deviation = Math.abs(value - 128) / 128;
                        maxDeviation = Math.max(maxDeviation, deviation);
                    }
                    // Amplify by 5x for better sensitivity to speech
                    bars.push(Math.min(1, maxDeviation * 5));
                }
                
                setWaveformBars(bars);
                animationFrameRef.current = requestAnimationFrame(updateWaveform);
            };
            
            updateWaveform();
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                
                // Cleanup waveform animation
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                }
                
                // Create audio blob for playback
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                
                // Create URL for audio playback
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                
                setProcessingStep('recorded');
            };
            
            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);
            setProcessingStep('recording');
            setError('');
            
            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    // Auto-stop at max time
                    if (prev >= MAX_RECORDING_TIME - 1) {
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
            
        } catch (err) {
            console.error('Failed to start recording:', err);
            setError('Could not access microphone. Please allow microphone permission.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            // Check minimum recording time
            if (recordingTime < MIN_RECORDING_TIME) {
                setError(`Please record for at least ${MIN_RECORDING_TIME} seconds.`);
                return;
            }
            
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const handlePlayPause = () => {
        if (!audioRef.current) return;
        
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
    };

    const handleReRecord = () => {
        // Cleanup audio URL
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
        setProcessingStep('idle');
        setError('');
    };

    const handleTranscribe = async () => {
        if (!audioBlob) return;
        
        setProcessingStep('transcribing');
        
        try {
            // Send to transcription API
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            
            const transcribeResponse = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            });
            
            const transcribeData = await transcribeResponse.json();
            
            if (!transcribeData.success) {
                throw new Error(transcribeData.error || 'Transcription failed');
            }
            
            setRawTranscript(transcribeData.transcript);
            
            // Format the note with GPT-4
            setProcessingStep('formatting');
            
            const selectedClientData = clients.find(c => c.id === selectedClient);
            
            const formatResponse = await fetch('/api/format-note', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript: transcribeData.transcript,
                    clientName: selectedClientData?.full_name || 'Client',
                    clientGoals: selectedClientData?.client_goals || '',
                    ipeGoal: selectedClientData?.ipe_goal || '',  // Pass IPE Goal for DOR compliance
                    mood: selectedMood,
                }),
            });
            
            const formatData = await formatResponse.json();
            
            if (!formatData.success) {
                throw new Error(formatData.error || 'Formatting failed');
            }
            
            setFormattedNote(formatData.formattedNote);
            setSummary(formatData.summary);
            setTags(formatData.tags || []);
            setProcessingStep('ready');
            
        } catch (err) {
            console.error('Processing error:', err);
            setError(err instanceof Error ? err.message : 'Processing failed');
            setProcessingStep('recorded'); // Go back to recorded state
        }
    };

    const handleRecordToggle = () => {
        if (!selectedMood) {
            setError('Please select a mood before recording');
            return;
        }
        if (!selectedClient) {
            setError('Please select a client before recording');
            return;
        }
        
        if (isRecording) {
            stopRecording();
        } else {
            setRecordingTime(0);
            startRecording();
        }
    };

    const handleSaveNote = async () => {
        setProcessingStep('saving');
        
        try {
            // Get GPS
            let latitude: number | undefined;
            let longitude: number | undefined;
            
            if (navigator.geolocation) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 5000,
                        });
                    });
                    latitude = position.coords.latitude;
                    longitude = position.coords.longitude;
                } catch {
                    console.warn('GPS not available');
                }
            }
            
            const selectedClientData = clients.find(c => c.id === selectedClient);
            
            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: selectedClient,
                    clientName: selectedClientData?.full_name,
                    mood: selectedMood,
                    rawTranscript: rawTranscript,
                    formattedNote: formattedNote,
                    summary: summary,
                    tags: tags,
                    consumerHours: consumerHours ? parseFloat(consumerHours) : null,
                    latitude,
                    longitude,
                }),
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to save');
            }
            
            setProcessingStep('saved');
            
            // Reset after 2 seconds
            setTimeout(() => {
                resetForm();
            }, 2000);
            
        } catch (err) {
            console.error('Save error:', err);
            setError(err instanceof Error ? err.message : 'Failed to save note');
            setProcessingStep('ready');
        }
    };

    const resetForm = () => {
        // Cleanup audio URL
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        
        setProcessingStep('idle');
        setSelectedMood(null);
        setSelectedClient('');
        setRawTranscript('');
        setFormattedNote('');
        setSummary('');
        setTags([]);
        setRecordingTime(0);
        setError('');
        setIsEditing(false);
        setAudioBlob(null);
        setAudioUrl(null);
        setConsumerHours('');
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const canRecord = selectedMood && selectedClient && processingStep === 'idle';
    const isProcessing = ['transcribing', 'formatting', 'saving'].includes(processingStep);

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>New Note</h1>
                <p className={styles.subtitle}>Record a voice note for your client</p>
            </div>

            {/* Block recording if no active shift */}
            {hasActiveShift === false && (
                <div className={styles.noShiftBlock}>
                    <div className={styles.noShiftIcon}>
                        <Clock size={48} />
                    </div>
                    <h2 className={styles.noShiftTitle}>Clock In Required</h2>
                    <p className={styles.noShiftText}>
                        You must clock in before recording notes. This ensures accurate time tracking for billing and EVV compliance.
                    </p>
                    <a href="/worker" className={styles.clockInLink}>
                        <Play size={20} />
                        Go to Dashboard to Clock In
                    </a>
                </div>
            )}

            {/* Show loading while checking shift status */}
            {hasActiveShift === null && (
                <div className={styles.loadingShift}>
                    <Loader2 size={24} className={styles.spinner} />
                    <span>Checking shift status...</span>
                </div>
            )}

            {/* Only show recording interface if clocked in */}
            {hasActiveShift === true && (
            <div className={styles.card}>
                {/* Mood Selector */}
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
                                disabled={processingStep !== 'idle'}
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
                    <div className={styles.customDropdown} ref={dropdownRef}>
                        <button
                            type="button"
                            className={`${styles.dropdownTrigger} ${isDropdownOpen ? styles.dropdownOpen : ''}`}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            disabled={loading || processingStep !== 'idle'}
                        >
                            <span className={styles.dropdownValue}>
                                {selectedClient 
                                    ? clients.find(c => c.id === selectedClient)?.full_name 
                                    : 'Choose a client...'}
                            </span>
                            <svg 
                                className={`${styles.dropdownArrow} ${isDropdownOpen ? styles.arrowUp : ''}`}
                                width="20" 
                                height="20" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2.5"
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                        {isDropdownOpen && (
                            <div className={styles.dropdownMenu}>
                                <div 
                                    className={`${styles.dropdownItem} ${!selectedClient ? styles.dropdownItemSelected : ''}`}
                                    onClick={() => { setSelectedClient(''); setIsDropdownOpen(false); }}
                                >
                                    <span className={styles.itemIcon}>👤</span>
                                    Choose a client...
                                </div>
                                {clients.map((client) => (
                                    <div 
                                        key={client.id}
                                        className={`${styles.dropdownItem} ${selectedClient === client.id ? styles.dropdownItemSelected : ''}`}
                                        onClick={() => { setSelectedClient(client.id); setIsDropdownOpen(false); }}
                                    >
                                        <span className={styles.itemIcon}>👤</span>
                                        {client.full_name}
                                        {selectedClient === client.id && (
                                            <span className={styles.checkIcon}>✓</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {clients.length === 0 && !loading && (
                        <p className={styles.noClients}>No clients yet. Add a client first.</p>
                    )}
                </div>

                {/* Recording Prompts */}
                {processingStep === 'idle' && (
                    <div className={styles.promptsSection}>
                        <p className={styles.promptTitle}>Cover these points in your note:</p>
                        <ul className={styles.promptList}>
                            <li>What tasks did the client work on today?</li>
                            <li>What went well? Any progress made?</li>
                            <li>Any behaviors, concerns, or challenges?</li>
                            <li>What support or interventions did you provide?</li>
                        </ul>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className={styles.errorBox}>
                        {error}
                    </div>
                )}

                {/* Record Button - only show when idle or recording */}
                {(processingStep === 'idle' || processingStep === 'recording') && (
                    <div className={styles.recordSection}>
                        {/* WhatsApp-style Waveform Visualization */}
                        {isRecording && (
                            <div className={styles.waveformContainer}>
                                {waveformBars.map((height, index) => (
                                    <div 
                                        key={index}
                                        className={styles.waveformBar}
                                        style={{ 
                                            height: `${Math.max(4, height * 40)}px`,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                        
                        {/* Record Button */}
                        <div className={styles.recordButtonWrapper}>
                            <button
                                className={`${styles.recordButton} ${isRecording ? styles.recordButtonRecording : styles.recordButtonIdle}`}
                                onClick={handleRecordToggle}
                                disabled={!canRecord && !isRecording}
                                style={{ opacity: (canRecord || isRecording) ? 1 : 0.5 }}
                            >
                                {isRecording ? (
                                    <MicOff size={48} className={styles.recordIcon} />
                                ) : (
                                    <Mic size={48} className={styles.recordIcon} />
                                )}
                            </button>
                        </div>
                        {isRecording && (
                            <p className={styles.recordingTime}>{formatTime(recordingTime)}</p>
                        )}
                        <p className={`${styles.recordStatus} ${isRecording ? styles.recordStatusRecording : ''}`}>
                            {!canRecord && !isRecording ? 'Select mood & client to start' : (isRecording ? 'Recording... Tap to stop' : 'Tap to record')}
                        </p>
                        {isRecording && (
                            <p className={styles.recordingHint}>
                                Min: {MIN_RECORDING_TIME}s | Max: {formatTime(MAX_RECORDING_TIME)}
                            </p>
                        )}
                    </div>
                )}

                {/* Audio Playback Section - after recording */}
                {processingStep === 'recorded' && audioUrl && (
                    <div className={styles.playbackSection}>
                        <p className={styles.playbackTitle}>Review Your Recording</p>
                        <p className={styles.playbackDuration}>Duration: {formatTime(recordingTime)}</p>
                        
                        <audio 
                            ref={audioRef} 
                            src={audioUrl} 
                            onEnded={handleAudioEnded}
                        />
                        
                        <div className={styles.playbackControls}>
                            <button 
                                className={styles.playButton}
                                onClick={handlePlayPause}
                            >
                                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                                {isPlaying ? 'Pause' : 'Play'}
                            </button>
                        </div>
                        
                        <div className={styles.playbackActions}>
                            <button 
                                className={styles.reRecordButton}
                                onClick={handleReRecord}
                            >
                                <RotateCcw size={18} />
                                Re-record
                            </button>
                            <button 
                                className={styles.transcribeButton}
                                onClick={handleTranscribe}
                            >
                                <Send size={18} />
                                Transcribe with AI
                            </button>
                        </div>
                    </div>
                )}

                {/* Processing State */}
                {isProcessing && (
                    <div className={styles.processingContainer}>
                        <Loader2 size={48} className={styles.spinner} />
                        <p className={styles.processingText}>
                            {processingStep === 'transcribing' && 'Transcribing audio...'}
                            {processingStep === 'formatting' && 'Formatting note with AI...'}
                            {processingStep === 'saving' && 'Saving note...'}
                        </p>
                    </div>
                )}

                {/* Success State */}
                {processingStep === 'saved' && (
                    <div className={styles.successContainer}>
                        <Check size={48} className={styles.successIcon} />
                        <p className={styles.successText}>Note saved successfully!</p>
                    </div>
                )}

                {/* Transcript Preview */}
                {processingStep === 'ready' && formattedNote && (
                    <div className={styles.transcriptSection}>
                        <div className={styles.transcriptHeader}>
                            <label className={styles.transcriptLabel}>
                                <Sparkles size={16} />
                                AI Formatted Note
                            </label>
                            <button 
                                className={styles.editButton}
                                onClick={() => setIsEditing(!isEditing)}
                            >
                                <Edit3 size={14} />
                                {isEditing ? 'Done' : 'Edit'}
                            </button>
                        </div>
                        
                        {summary && (
                            <p className={styles.summaryText}>{summary}</p>
                        )}
                        
                        {isEditing ? (
                            <textarea
                                value={formattedNote}
                                onChange={(e) => setFormattedNote(e.target.value)}
                                className={styles.transcriptTextarea}
                                rows={12}
                            />
                        ) : (
                            <div className={styles.formattedNoteContainer}>
                                {formattedNote.split('**').filter(Boolean).map((section, index) => {
                                    // Parse sections: odd indices are headers, even are content
                                    if (index % 2 === 0) {
                                        // This is a header
                                        const headerText = section.replace(/[:*]/g, '').trim();
                                        if (!headerText) return null;
                                        return (
                                            <div key={index} className={styles.noteSection}>
                                                <h4 className={styles.noteSectionHeader}>{headerText}</h4>
                                            </div>
                                        );
                                    } else {
                                        // This is content after a header
                                        const content = section.trim();
                                        if (!content) return null;
                                        return (
                                            <p key={index} className={styles.noteSectionContent}>{content}</p>
                                        );
                                    }
                                })}
                            </div>
                        )}
                        
                        {tags.length > 0 && (
                            <div className={styles.tagsContainer}>
                                {tags.map((tag, index) => (
                                    <span key={index} className={styles.tag}>{tag}</span>
                                ))}
                            </div>
                        )}

                        {/* Consumer Hours Input */}
                        <div className={styles.hoursSection}>
                            <label className={styles.hoursLabel}>
                                Consumer Worked Hours
                                <span className={styles.hoursHint}>(Hours client worked, not coaching hours)</span>
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="24"
                                placeholder="e.g., 6.5"
                                value={consumerHours}
                                onChange={(e) => setConsumerHours(e.target.value)}
                                className={styles.hoursInput}
                            />
                        </div>

                        <div className={styles.actionButtons}>
                            <button 
                                className={styles.cancelButton}
                                onClick={resetForm}
                            >
                                Discard
                            </button>
                            <button 
                                className={styles.submitButton}
                                onClick={handleSaveNote}
                            >
                                <Check size={20} />
                                Save Note
                            </button>
                        </div>
                    </div>
                )}
            </div>
            )}
        </div>
    );
}
