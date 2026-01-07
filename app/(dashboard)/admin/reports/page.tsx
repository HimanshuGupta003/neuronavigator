'use client';

import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { FileText, Construction } from 'lucide-react';

export default function AdminReportsPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reports</h1>
                <p className="text-muted mt-1">View all generated reports</p>
            </div>

            <Card>
                <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted-bg flex items-center justify-center mx-auto mb-4">
                        <Construction className="w-8 h-8 text-muted" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h2>
                    <p className="text-muted max-w-md mx-auto">
                        The reports section will be available once voice recording and AI processing features are implemented.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
