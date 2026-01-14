import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { jsPDF } from 'jspdf';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get query params
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!clientId || !startDate || !endDate) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // 1. Fetch client data
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();

        if (clientError || !client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // 2. Fetch shifts (coaching hours) within date range
        const { data: shifts } = await supabase
            .from('shifts')
            .select('*')
            .eq('worker_id', user.id)
            .gte('clock_in_at', `${startDate}T00:00:00`)
            .lte('clock_in_at', `${endDate}T23:59:59`)
            .not('clock_out_at', 'is', null)
            .order('clock_in_at', { ascending: true });

        // 3. Fetch entries (consumer hours + narratives)
        const { data: entries } = await supabase
            .from('entries')
            .select('*')
            .eq('worker_id', user.id)
            .eq('client_name', client.full_name)
            .gte('created_at', `${startDate}T00:00:00`)
            .lte('created_at', `${endDate}T23:59:59`)
            .order('created_at', { ascending: true });

        // 4. Generate PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 20;

        // Colors
        const primaryBlue = '#0284c7';
        const darkText = '#1e293b';
        const grayText = '#64748b';

        // ============ HEADER SECTION ============
        doc.setFontSize(20);
        doc.setTextColor(primaryBlue);
        doc.text('Monthly Activity Report', pageWidth / 2, yPos, { align: 'center' });
        yPos += 12;

        doc.setFontSize(10);
        doc.setTextColor(grayText);
        const monthYear = new Date(startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        doc.text(monthYear, pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        // Client Info Box
        doc.setDrawColor(primaryBlue);
        doc.setLineWidth(0.5);
        doc.rect(15, yPos, pageWidth - 30, 35);
        yPos += 8;

        doc.setFontSize(10);
        doc.setTextColor(darkText);
        doc.setFont('helvetica', 'bold');
        doc.text('Consumer:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(client.full_name || 'N/A', 50, yPos);
        
        doc.setFont('helvetica', 'bold');
        doc.text('UCI #:', 110, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(client.uci_number || 'N/A', 130, yPos);
        yPos += 8;

        doc.setFont('helvetica', 'bold');
        doc.text('Vendor:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(client.vendor || 'v-Enable Pathways', 50, yPos);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Job Site:', 110, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(client.job_site || client.job_title || 'N/A', 135, yPos);
        yPos += 8;

        doc.setFont('helvetica', 'bold');
        doc.text('SE Provider:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(client.se_service_provider || 'N/A', 55, yPos);
        
        doc.setFont('helvetica', 'bold');
        doc.text('IPE Goal:', 110, yPos);
        doc.setFont('helvetica', 'normal');
        const ipeGoal = client.ipe_goal ? client.ipe_goal.substring(0, 40) + (client.ipe_goal.length > 40 ? '...' : '') : 'N/A';
        doc.text(ipeGoal, 135, yPos);
        yPos += 20;

        // ============ ATTENDANCE LOG ============
        doc.setFontSize(14);
        doc.setTextColor(primaryBlue);
        doc.setFont('helvetica', 'bold');
        doc.text('Attendance Log', 15, yPos);
        yPos += 8;

        // Table header
        doc.setFillColor(240, 249, 255);
        doc.rect(15, yPos, pageWidth - 30, 8, 'F');
        doc.setFontSize(9);
        doc.setTextColor(darkText);
        doc.setFont('helvetica', 'bold');
        yPos += 5;
        doc.text('Date', 20, yPos);
        doc.text('Start Time', 55, yPos);
        doc.text('End Time', 90, yPos);
        doc.text('Coach Hrs', 125, yPos);
        doc.text('Consumer Hrs', 160, yPos);
        yPos += 6;

        // Table rows
        let totalCoachHours = 0;
        let totalConsumerHours = 0;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkText);

        if (shifts && shifts.length > 0) {
            shifts.forEach((shift: { clock_in_at: string; clock_out_at: string }) => {
                if (yPos > 260) {
                    doc.addPage();
                    yPos = 20;
                }

                const clockIn = new Date(shift.clock_in_at);
                const clockOut = new Date(shift.clock_out_at);
                const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
                totalCoachHours += hours;

                // Find matching entry for consumer hours
                const matchingEntry = entries?.find((e: { created_at: string }) => {
                    const entryDate = new Date(e.created_at).toDateString();
                    return entryDate === clockIn.toDateString();
                });
                const consumerHrs = matchingEntry?.consumer_hours || '-';
                if (matchingEntry?.consumer_hours) {
                    totalConsumerHours += parseFloat(matchingEntry.consumer_hours);
                }

                doc.text(clockIn.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }), 20, yPos);
                doc.text(clockIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), 55, yPos);
                doc.text(clockOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), 90, yPos);
                doc.text(hours.toFixed(1), 130, yPos);
                doc.text(String(consumerHrs), 168, yPos);
                yPos += 6;
            });
        } else {
            doc.setTextColor(grayText);
            doc.text('No shifts recorded for this period', 20, yPos);
            yPos += 6;
        }

        // Total row
        yPos += 2;
        doc.setFillColor(240, 249, 255);
        doc.rect(15, yPos - 4, pageWidth - 30, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkText);
        doc.text('Total Hours:', 90, yPos);
        doc.text(totalCoachHours.toFixed(1), 130, yPos);
        doc.text(totalConsumerHours.toFixed(1), 168, yPos);
        yPos += 15;

        // ============ NARRATIVE SECTION ============
        if (yPos > 200) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(primaryBlue);
        doc.setFont('helvetica', 'bold');
        doc.text('Narrative Summary', 15, yPos);
        yPos += 10;

        // Combine narratives from entries - grouped by day
        if (entries && entries.length > 0) {
            // Group entries by date
            const entriesByDate: Record<string, { formatted_note: string; processed_text?: string; created_at: string }[]> = {};
            entries.forEach((e: { formatted_note: string; processed_text?: string; created_at: string }) => {
                const dateKey = new Date(e.created_at).toLocaleDateString('en-US', { 
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
                });
                if (!entriesByDate[dateKey]) {
                    entriesByDate[dateKey] = [];
                }
                entriesByDate[dateKey].push(e);
            });
            
            doc.setFontSize(10);
            
            // Helper to sanitize text (fix encoding issues)
            const sanitizeText = (text: string): string => {
                if (!text) return '';
                // Remove problematic unicode characters that jsPDF can't render
                return text
                    .replace(/[\u{2026}]/gu, '...')  // ellipsis
                    .replace(/[\u{201C}\u{201D}]/gu, '"')  // smart quotes
                    .replace(/[\u{2018}\u{2019}]/gu, "'")  // smart apostrophes
                    .replace(/[\u{2014}]/gu, '-')  // em dash
                    .replace(/[\u{2013}]/gu, '-')  // en dash
                    .replace(/[^\x00-\x7F]/g, '');  // Remove any remaining non-ASCII
            };

            // Helper to parse 4-section structure
            const parseSections = (note: string): { header: string; content: string }[] => {
                const sections: { header: string; content: string }[] = [];
                const patterns = [
                    { regex: /\*?\*?Tasks?\s*&?\s*Productivity:?\*?\*?/gi, header: 'TASKS & PRODUCTIVITY' },
                    { regex: /\*?\*?Barriers?\s*&?\s*Behaviors?:?\*?\*?/gi, header: 'BARRIERS & BEHAVIORS' },
                    { regex: /\*?\*?Interventions?:?\*?\*?/gi, header: 'INTERVENTIONS' },
                    { regex: /\*?\*?Progress\s*(?:on\s*)?Goals?:?\*?\*?/gi, header: 'PROGRESS ON GOALS' },
                ];
                
                // Split by any header pattern
                const allPatterns = patterns.map(p => p.regex.source).join('|');
                const splitRegex = new RegExp(`(${allPatterns})`, 'gi');
                const parts = note.split(splitRegex).filter(Boolean);
                
                let currentHeader = '';
                parts.forEach(part => {
                    const trimmed = part.trim();
                    if (!trimmed) return;
                    
                    // Check if this part is a header
                    const matchedPattern = patterns.find(p => p.regex.test(trimmed));
                    if (matchedPattern) {
                        matchedPattern.regex.lastIndex = 0; // Reset regex
                        currentHeader = matchedPattern.header;
                    } else if (currentHeader) {
                        sections.push({ header: currentHeader, content: sanitizeText(trimmed) });
                        currentHeader = '';
                    } else {
                        // Content without header
                        sections.push({ header: '', content: sanitizeText(trimmed) });
                    }
                });
                
                return sections;
            };
            
            // Render each day's narrative with structured sections
            Object.keys(entriesByDate).forEach((dateKey) => {
                if (yPos > 230) {  // Better page break threshold
                    doc.addPage();
                    yPos = 20;
                }
                
                // Date header
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(primaryBlue);
                doc.text(dateKey, 20, yPos);
                yPos += 8;
                
                // Process each entry for this day
                entriesByDate[dateKey].forEach(e => {
                    const noteText = e.formatted_note || e.processed_text || '';
                    if (!noteText) return;
                    
                    const sections = parseSections(noteText);
                    
                    sections.forEach(section => {
                        // Check for page break
                        if (yPos > 260) {
                            doc.addPage();
                            yPos = 20;
                        }
                        
                        // Render section header if present
                        if (section.header) {
                            doc.setFont('helvetica', 'bold');
                            // Color-code headers
                            if (section.header.includes('TASKS')) {
                                doc.setTextColor(0, 116, 217);  // Blue
                            } else if (section.header.includes('BARRIERS')) {
                                doc.setTextColor(217, 119, 6);  // Amber
                            } else if (section.header.includes('INTERVENTION')) {
                                doc.setTextColor(124, 58, 237);  // Purple
                            } else if (section.header.includes('PROGRESS')) {
                                doc.setTextColor(21, 128, 61);  // Green
                            }
                            doc.text(section.header + ':', 25, yPos);
                            yPos += 5;
                        }
                        
                        // Render content
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(darkText);
                        
                        const contentLines = doc.splitTextToSize(section.content, pageWidth - 50);
                        contentLines.forEach((line: string) => {
                            if (yPos > 270) {
                                doc.addPage();
                                yPos = 20;
                            }
                            doc.text(line, 28, yPos);
                            yPos += 5;
                        });
                        yPos += 3; // Space between sections
                    });
                });
                yPos += 8; // Space between days
            });
        } else {
            doc.setFontSize(10);
            doc.setTextColor(grayText);
            doc.text('No narrative entries for this period.', 20, yPos);
        }
        yPos += 15;

        // ============ SIGNATURE SECTION ============
        if (yPos > 220) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(primaryBlue);
        doc.setFont('helvetica', 'bold');
        doc.text('Signatures', 15, yPos);
        yPos += 15;

        doc.setFontSize(10);
        doc.setTextColor(darkText);
        doc.setFont('helvetica', 'normal');
        
        // Consumer Signature
        doc.text('Consumer Signature:', 20, yPos);
        doc.line(65, yPos, 120, yPos);
        doc.text('Date:', 125, yPos);
        doc.line(140, yPos, 180, yPos);
        yPos += 15;
        
        // Job Coach Signature
        doc.text('Job Coach Signature:', 20, yPos);
        doc.line(65, yPos, 120, yPos);
        doc.text('Date:', 125, yPos);
        doc.text(new Date().toLocaleDateString('en-US'), 140, yPos);
        yPos += 10;

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(grayText);
        doc.text(`Generated by CoachAlly on ${new Date().toLocaleString()}`, pageWidth / 2, 285, { align: 'center' });

        // 5. Return PDF as blob
        const pdfBuffer = doc.output('arraybuffer');
        
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${client.full_name}_Report_${monthYear.replace(' ', '_')}.pdf"`,
            },
        });

    } catch (error) {
        console.error('PDF generation error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to generate PDF' 
        }, { status: 500 });
    }
}
