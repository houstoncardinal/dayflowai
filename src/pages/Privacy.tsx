import { Link } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Privacy() {
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
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: March 2026</p>

        <h2>1. Data We Collect</h2>
        <p>We collect your email address, display name, and calendar event data that you create within Dayflow. We also collect usage analytics to improve the product.</p>

        <h2>2. How We Use Your Data</h2>
        <p>Your data is used to provide the Dayflow service, including AI-powered features like meeting prep, schedule optimization, and voice commands. We never sell your personal data to third parties.</p>

        <h2>3. Data Security</h2>
        <p>All data is encrypted in transit using TLS and at rest. We use row-level security to ensure you can only access your own data. Our infrastructure is hosted on secure, SOC 2-compliant cloud providers.</p>

        <h2>4. Third-Party Services</h2>
        <p>We use AI models (Google Gemini, OpenAI) for intelligent features. Your calendar data may be sent to these services for processing but is not stored by them beyond the request lifecycle.</p>

        <h2>5. Data Retention</h2>
        <p>Your data is retained as long as your account is active. You can request account deletion at any time by contacting support@dayflowai.com.</p>

        <h2>6. Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal data. Contact us at support@dayflowai.com for any privacy requests.</p>

        <h2>7. Contact</h2>
        <p>For privacy inquiries, email <a href="mailto:support@dayflowai.com">support@dayflowai.com</a>.</p>
      </div>
    </div>
  );
}
