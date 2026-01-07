// Database Types
export type UserRole = 'worker' | 'admin';

export type SiteStatus = 'green' | 'yellow' | 'red';

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    role: UserRole;
    created_at: string;
    updated_at: string;
}

export interface Invitation {
    id: string;
    email: string;
    token: string;
    invited_by: string;
    expires_at: string;
    used_at: string | null;
    created_at: string;
}

export interface Shift {
    id: string;
    worker_id: string;
    clock_in_at: string;
    clock_in_lat: number | null;
    clock_in_lng: number | null;
    clock_out_at: string | null;
    clock_out_lat: number | null;
    clock_out_lng: number | null;
    created_at: string;
}

export interface Entry {
    id: string;
    worker_id: string;
    shift_id: string | null;
    status: SiteStatus;
    audio_url: string | null;
    raw_transcript: string | null;
    processed_text: string | null;
    tags: string[];
    gps_lat: number | null;
    gps_lng: number | null;
    client_name: string | null;
    created_at: string;
}

export interface Report {
    id: string;
    entry_id: string | null;
    worker_id: string;
    pdf_url: string;
    generated_at: string;
}

// Auth Types
export interface AuthUser {
    id: string;
    email: string;
    profile: Profile | null;
}

// API Response Types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}
