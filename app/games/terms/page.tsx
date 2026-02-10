import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demo Games Terms of Service | BullMoney',
  description: 'Terms of Service for BullMoney demo games platform',
  robots: 'noindex, nofollow',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service - Demo Games</h1>
        
        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-red-900 mb-3">⚠️ IMPORTANT: DEMO ONLY - NO REAL GAMBLING</h2>
            <p className="text-red-800 leading-relaxed mb-0">
              <strong>THIS IS NOT A GAMBLING SITE.</strong> All games use demo currency with ZERO real-world value. 
              No real money can be deposited, wagered, or withdrawn. This platform is for entertainment purposes only.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing BullMoney Games (&quot;the Platform&quot;), you agree to these Terms of Service. 
              If you do not agree, do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Demo Currency Only</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>No Real Money:</strong> All games use demo currency that has NO cash value</li>
              <li><strong>No Deposits:</strong> You cannot deposit real money into the Platform</li>
              <li><strong>No Withdrawals:</strong> Demo winnings cannot be withdrawn or converted to cash</li>
              <li><strong>No Purchases:</strong> Demo currency cannot be bought or sold</li>
              <li><strong>Entertainment Only:</strong> Games are for fun and skill development only</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Not a Gambling Service</h2>
            <p className="font-semibold">
              BullMoney Games is NOT a gambling, betting, or gaming service. We do not:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Accept real money wagers</li>
              <li>Offer real money prizes</li>
              <li>Facilitate gambling transactions</li>
              <li>Operate under gambling licenses (not required for demo games)</li>
              <li>Promise any financial returns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Age Restriction</h2>
            <p>
              You must be <strong>18 years or older</strong> (or the legal age in your jurisdiction) to use this Platform. 
              By accessing the Platform, you confirm you meet the age requirement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Prohibited Jurisdictions</h2>
            <p>
              This Platform is not intended for use in jurisdictions where demo games or similar entertainment 
              services are restricted. Users are responsible for compliance with local laws. We reserve the right 
              to block access from any jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Donations</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Voluntary:</strong> All donations are voluntary contributions</li>
              <li><strong>Non-Refundable:</strong> Donations are final and non-refundable</li>
              <li><strong>No Benefits:</strong> Donations do not provide in-game advantages or benefits</li>
              <li><strong>Not Investments:</strong> Donations are not investments and provide no financial return</li>
              <li><strong>Purpose:</strong> Donations fund gaming license applications and platform development</li>
              <li><strong>Transparency:</strong> Donation totals are displayed publicly</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Account Terms</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are responsible for maintaining account security</li>
              <li>One account per person</li>
              <li>We may suspend accounts that violate these Terms</li>
              <li>No account has monetary value</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
            <p>
              All content, designs, logos, and trademarks are owned by BullMoney or licensed to us. 
              You may not copy, reproduce, or distribute any content without permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p>
              BullMoney Games is provided &quot;AS IS&quot; without warranties. We are not liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Any losses from use of the Platform</li>
              <li>Technical issues or downtime</li>
              <li>User disputes</li>
              <li>Third-party content or links</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Responsible Gaming</h2>
            <p>
              Even with demo currency, we encourage responsible gaming:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Set time limits for play sessions</li>
              <li>Take regular breaks</li>
              <li>Remember this is entertainment, not income</li>
              <li>If you have gambling concerns, seek help: <a href="https://www.gamblersanonymous.org" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">GamblersAnonymous.org</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
            <p>
              We may update these Terms at any time. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact</h2>
            <p>
              For questions about these Terms, contact: <strong>support@bullmoney.shop</strong>
            </p>
          </section>

          <div className="bg-gray-50 rounded-xl p-6 mt-8">
            <p className="text-sm text-gray-600 mb-0">
              <strong>Last Updated:</strong> February 10, 2026<br/>
              <strong>Effective Date:</strong> February 10, 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
