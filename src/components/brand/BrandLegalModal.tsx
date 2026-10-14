import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { APP_CONFIG } from '../../constants/appConfig';
import {
  ExternalLink,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Info,
  Compass,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

export type BrandLegalTab =
  | 'explore'
  | 'about'
  | 'privacy'
  | 'terms'
  | 'disclaimer';

interface BrandLegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: BrandLegalTab;
}

export const BrandLegalModal: React.FC<BrandLegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'explore',
}) => {
  const [activeTab, setActiveTab] = useState<BrandLegalTab>(
    initialTab === ('contact' as any) ? 'about' : initialTab
  );

  // Sync initialTab when modal opens or initialTab changes
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab === ('contact' as any) ? 'about' : initialTab);
    }
  }, [isOpen, initialTab]);



  const founderEmail = APP_CONFIG.supportEmail;

  const tabs: { key: BrandLegalTab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'explore',
      label: 'Explore Arigato Labs',
      icon: (
        <img
          src="/arigato-single-logo.png"
          alt="Arigato Labs"
          className="w-4 h-4 object-contain inline-block"
        />
      ),
    },
    { key: 'about', label: 'About', icon: <Info size={14} /> },
    { key: 'privacy', label: 'Privacy Policy', icon: <ShieldCheck size={14} /> },
    { key: 'terms', label: 'Terms & Conditions', icon: <FileText size={14} /> },
    { key: 'disclaimer', label: 'Disclaimer', icon: <AlertTriangle size={14} /> },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Arigato Labs"
      subtitle="Corporate identity & legal disclosures"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* TAB NAVIGATION PILLS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-hairline">
          {tabs.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0',
                  isActive
                    ? 'bg-ink text-white shadow-xs'
                    : 'text-charcoal hover:text-ink hover:bg-surface-bone'
                )}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: EXPLORE ARIGATO LABS (PER ARIGATO_BRANDING_SETUP.MD) */}
        {activeTab === 'explore' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header */}
            <div className="text-center space-y-1.5">
              <h2 className="font-display font-black text-2xl sm:text-3xl text-ink tracking-tight">
                Our Company
              </h2>
              <p className="text-sm sm:text-base text-charcoal max-w-md mx-auto">
                Redefining productivity and self-mastery for the modern era.
              </p>
            </div>

            {/* Main Brand Logo Display */}
            <div className="flex items-center justify-center p-4 sm:p-6 bg-surface-card rounded-2xl border border-hairline shadow-xs">
              <img
                src="/arigato-labs-logo.png"
                alt="Arigato Labs Logo"
                className="max-w-[480px] w-full object-contain select-none"
              />
            </div>

            {/* Founder & Mission Section */}
            <div className="text-center space-y-4 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs">
                <span>✓</span> Verified Founder
              </div>

              <p className="text-sm sm:text-base text-ink leading-relaxed">
                <strong>HabitsSeen</strong> is proudly developed by{' '}
                <strong className="text-primary font-bold">Kumar Devanshu</strong>, the founder
                of <strong>Arigato Labs</strong> in 2026.
              </p>

              <p className="text-xs sm:text-sm text-charcoal leading-relaxed">
                Our mission is to build sleek, modern, and high-performance tools that empower
                individuals and teams to achieve their goals with elegance and ease. We believe
                software should feel natural, fast, and distinctly beautiful.
              </p>
            </div>

            {/* Standard Legal Footer */}
            <div className="text-center pt-6 border-t border-hairline space-y-2 text-xs text-charcoal">
              <h4 className="font-display font-black tracking-widest text-ink text-sm">
                ARIGATO LABS
              </h4>
              <p>Copyright © 2026 Arigato Labs. All Rights Reserved.</p>
              <p className="max-w-md mx-auto text-[11px] text-stone">
                <strong>HabitsSeen</strong> is a product of Arigato Labs, founded by Kumar
                Devanshu. Brand name and logos may not be reused outside Arigato Labs apps
                without permission.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] font-medium text-ink">
                <button
                  type="button"
                  onClick={() => setActiveTab('privacy')}
                  className="hover:text-primary transition-colors underline"
                >
                  Privacy Policy
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('terms')}
                  className="hover:text-primary transition-colors underline"
                >
                  Terms & Conditions
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('disclaimer')}
                  className="hover:text-primary transition-colors underline"
                >
                  Disclaimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ABOUT */}
        {activeTab === 'about' && (
          <div className="space-y-6 text-sm text-charcoal leading-relaxed animate-in fade-in duration-200">
            <div className="p-5 bg-surface-card rounded-2xl border border-hairline space-y-4">
              <h3 className="font-display font-bold text-xl text-ink">
                About Arigato Labs
              </h3>
              <p className="text-ink font-medium">
                <strong>HabitsSeen</strong> is a product of <strong>Arigato Labs</strong>.
              </p>
              <p>
                Built with precision by <strong>Kumar Devanshu</strong>, founder of Arigato Labs (2026).
              </p>
              <div className="p-4 bg-surface-bone rounded-xl border border-hairline italic text-xs text-ink">
                "We build sleek, modern, high-performance tools that help people get things
                done with clarity and calm. Software should feel fast, natural, and carefully
                designed."
              </div>
              <p className="text-xs">
                HabitsSeen is engineered to provide uncompromising discipline gamification,
                vitality mechanics, milestone tracking, and seamless cloud synchronization.
              </p>
            </div>

            <div className="text-center text-xs text-stone pt-2">
              Copyright © 2026 Arigato Labs. All Rights Reserved.
            </div>
          </div>
        )}

        {/* TAB 3: PRIVACY POLICY */}
        {activeTab === 'privacy' && (
          <div className="space-y-5 text-xs sm:text-sm text-charcoal leading-relaxed max-h-[60vh] overflow-y-auto pr-1 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <h3 className="font-display font-bold text-lg text-ink">Privacy Policy</h3>
              <span className="text-[11px] font-mono text-stone">Updated: 2026</span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-ink text-sm mb-1">1. Who we are</h4>
                <p>
                  Arigato Labs operates the productivity and habit mastery application{' '}
                  <strong>HabitsSeen</strong>. If you have questions regarding this privacy
                  policy, you can reach out directly to{' '}
                  <span className="font-mono text-primary font-bold">
                    {founderEmail}
                  </span>
                  .
                </p>
              </div>

              <div>
                <h4 className="font-bold text-ink text-sm mb-1">2. What we collect</h4>
                <p>
                  We collect only the essential data required to provide habit tracking and
                  synchronization:
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>
                    <strong>Authentication profile:</strong> Your email address and display name
                    via Google Authentication (Firebase Auth).
                  </li>
                  <li>
                    <strong>User Content & Logs:</strong> Habit routines, daily logs, checklists,
                    sobriety break timers, reflections, and category organization.
                  </li>
                  <li>
                    <strong>Gamification metrics:</strong> Willpower XP points, level progression,
                    vitality/hearts status, streaks, and unlocked achievement flags.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-ink text-sm mb-1">3. How we use data</h4>
                <p>
                  Your information is solely used to deliver the core service: synchronizing your
                  habits in real-time across your desktop and mobile devices, computing analytics
                  and streaks, and preserving your gamified progress. We never sell, rent, or
                  monetize your personal data.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-ink text-sm mb-1">4. Third parties</h4>
                <p>
                  We utilize Google Firebase (Authentication & Cloud Firestore) for secure user
                  identity verification and distributed cloud database storage. We do not integrate
                  third-party tracking pixels, invasive ad networks, or data brokers.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-ink text-sm mb-1">5. Storage & retention</h4>
                <p>
                  Data is stored in Google Cloud Firestore and cached locally in your browser for
                  offline capability. You have full sovereignty over your data and can request
                  complete deletion or purge at any time.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-ink text-sm mb-1">6. Security</h4>
                <p>
                  All network communication is protected via TLS/SSL encryption in transit. Cloud
                  Firestore access is strictly gated by authentication rules guaranteeing that only
                  you can access or edit your personal habits and logs.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-ink text-sm mb-1">7. Children</h4>
                <p>
                  HabitsSeen is not directed toward children under 13. We do not knowingly collect
                  personal information from children under 13.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-ink text-sm mb-1">8. Changes</h4>
                <p>
                  This policy may be updated as new features are added. Continued use of HabitsSeen
                  signifies your agreement to the updated terms.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-ink text-sm mb-1">9. Contact</h4>
                <p>
                  Direct privacy inquiries to Kumar Devanshu at{' '}
                  <span className="font-mono text-primary font-bold">
                    {founderEmail}
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TERMS & CONDITIONS */}
        {activeTab === 'terms' && (
          <div className="space-y-5 text-xs sm:text-sm text-charcoal leading-relaxed max-h-[60vh] overflow-y-auto pr-1 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <h3 className="font-display font-bold text-lg text-ink">Terms & Conditions</h3>
              <span className="text-[11px] font-mono text-stone">Updated: 2026</span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-ink text-sm mb-1">1. Agreement to Terms</h4>
                <p>
                  By accessing or using HabitsSeen, you agree to be bound by these Terms and
                  Conditions and the policies of Arigato Labs.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-ink text-sm mb-1">2. The Service</h4>
                <p>
                  HabitsSeen is provided by Arigato Labs for personal productivity, habit formation,
                  and lifestyle gamification.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-ink text-sm mb-1">3. Accounts</h4>
                <p>
                  You are responsible for maintaining the confidentiality of your credentials and
                  for all activities occurring under your authenticated account.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-ink text-sm mb-1">4. Acceptable Use</h4>
                <p>
                  You agree not to misuse the service, reverse engineer backend endpoints, attempt
                  denial-of-service attacks, or bypass access controls.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-ink text-sm mb-1">5. Intellectual Property</h4>
                <p>
                  The Arigato Labs name, brand logos (including `arigato-labs-logo.png` and
                  `arigato-single-logo.png`), UI assets, and designs are exclusive property of
                  Arigato Labs and Kumar Devanshu.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-ink text-sm mb-1">6. Gamification & Automation</h4>
                <p>
                  Gamification elements (XP, vitality, sudden death resets, achievement triggers)
                  are designed for motivation. Arigato Labs makes no guarantees of specific personal
                  habits or psychological outcomes.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-ink text-sm mb-1">7. Availability</h4>
                <p>
                  The service is provided on an "as available" basis. While we strive for 99.9%
                  uptime, service disruptions or cloud maintenance may occur without liability.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-ink text-sm mb-1">8. Termination</h4>
                <p>
                  You may terminate your account at any time. Arigato Labs reserves the right to
                  suspend access for intentional abuse or security infractions.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-ink text-sm mb-1">9. Governing Law</h4>
                <p>
                  These terms are governed by the laws of India, within the jurisdiction of the
                  founder Kumar Devanshu.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-ink text-sm mb-1">10. Contact</h4>
                <p>
                  For legal notices or questions, contact{' '}
                  <span className="font-mono text-primary font-bold">
                    {founderEmail}
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DISCLAIMER */}
        {activeTab === 'disclaimer' && (
          <div className="space-y-4 text-xs sm:text-sm text-charcoal leading-relaxed animate-in fade-in duration-200">
            <div className="p-5 bg-surface-card rounded-2xl border border-hairline space-y-3">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                <AlertTriangle size={16} /> Disclaimer & Liability Limitations
              </div>

              <p>
                <strong>HabitsSeen</strong> and all Arigato Labs materials are provided{' '}
                <strong>"as is"</strong> and <strong>"as available"</strong> without warranties of
                any kind, express or implied.
              </p>

              <p>
                <strong>Arigato Labs</strong> and founder <strong>Kumar Devanshu</strong> are{' '}
                <strong>not liable</strong> for loss of data, missed routines, broken streaks,
                lost productivity, or any direct or indirect damages arising from the use or
                inability to use the application.
              </p>

              <p>
                Productivity, lifestyle habits, sobriety timers, and streak suggestions are{' '}
                <strong>helpers and self-tracking instruments</strong>, not professional medical,
                psychiatric, legal, or financial advice. If you suffer from substance dependence or
                mental health distress, please consult certified healthcare professionals.
              </p>

              <p className="text-xs text-stone">
                Third-party services (such as Google Authentication and Firebase Hosting) operate
                under their own terms and privacy practices.
              </p>
            </div>

            <div className="text-center text-xs text-stone pt-2">
              Copyright © 2026 Arigato Labs. All Rights Reserved.
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
