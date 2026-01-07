'use client';

import Card, { CardContent } from '@/components/ui/Card';
import { Mic, Construction } from 'lucide-react';

export default function WorkerRecordPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Record Entry</h1>
                <p className="text-muted mt-1">Create a voice log entry</p>
            </div>

            <Card>
                <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted-bg flex items-center justify-center mx-auto mb-4">
                        <Construction className="w-8 h-8 text-muted" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h2>
                    <p className="text-muted max-w-md mx-auto">
                        Voice recording with AI transcription and processing will be implemented next.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
