import { Link } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-foreground flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-background" />
            </div>
            <span className="font-semibold">Dayflow</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16 prose prose-neutral dark:prose-invert">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: March 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using Dayflow, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.</p>

        <h2>2. Description of Service</h2>
        <p>Dayflow is an AI-powered calendar and scheduling platform. We provide calendar management, voice commands, meeting intelligence, team workspaces, and related productivity tools.</p>

        <h2>3. User Accounts</h2>
        <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials.</p>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to misuse the service, including but not limited to: automated scraping, reverse engineering, or using the platform for unlawful purposes.</p>

        <h2>5. Subscription & Billing</h2>
        <p>Paid plans are billed monthly or annually. You may cancel at any time and retain access until the end of your billing period. Refunds are handled on a case-by-case basis.</p>

        <h2>6. AI Features</h2>
        <p>AI-generated content (meeting agendas, summaries, suggestions) is provided as-is. While we strive for accuracy, you should review AI outputs before acting on them.</p>

        <h2>7. Limitation of Liability</h2>
        <p>Dayflow is provided "as is" without warranties. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>

        <h2>8. Changes to Terms</h2>
        <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.</p>

        <h2>9. Contact</h2>
        <p>Questions about these terms? Email <a href="mailto:support@dayflowai.com">support@dayflowai.com</a>.</p>
      </div>
    </div>
  );
}
