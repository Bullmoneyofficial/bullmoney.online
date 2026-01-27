"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, CheckCircle2, FileText, Lock, Globe, Database, Cookie, CreditCard, Bell, Users, Scale, Ban, Mail } from "lucide-react";
import { EnhancedModal } from "./EnhancedModal";
import { DisclaimerSection } from "./DisclaimerSection";

// Neon styles for legal disclaimer modal
const LEGAL_NEON_STYLES = `
  .legal-neon-blue-text {
    color: #3b82f6;
    text-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6;
  }
  .legal-neon-white-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
  }
  .legal-neon-red-text {
    color: #ef4444;
    text-shadow: 0 0 4px #ef4444, 0 0 8px #ef4444;
  }
  .legal-neon-red-icon {
    filter: drop-shadow(0 0 4px #ef4444) drop-shadow(0 0 8px #ef4444);
  }
  .legal-neon-green-icon {
    filter: drop-shadow(0 0 4px #22c55e) drop-shadow(0 0 8px #22c55e);
  }
  .legal-tab-active {
    background: rgba(59, 130, 246, 0.2);
    border-color: #3b82f6;
    color: #3b82f6;
  }
  .legal-tab-inactive {
    background: transparent;
    border-color: rgba(59, 130, 246, 0.3);
    color: rgba(255, 255, 255, 0.6);
  }
`;

export interface LegalDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy' | 'disclaimer';
}

// ============================================================================
// COMPREHENSIVE TERMS OF SERVICE
// ============================================================================
const TERMS_SECTIONS = [
  {
    number: "01",
    title: "Acceptance of Terms",
    text: "By accessing or using Bullmoney (\"the Platform\"), including our website, mobile applications, APIs, tools, trading journal, community features, educational courses, shop, and all related services, you agree to be bound by these Terms of Service (\"Terms\"), our Privacy Policy, and all applicable laws and regulations worldwide. If you do not agree with any part of these terms, you must immediately cease using our services. Your continued use of the Platform constitutes acceptance of these Terms and any future modifications.",
  },
  {
    number: "02",
    title: "Eligibility & Age Requirements",
    text: "You must be at least 18 years of age (or the age of majority in your jurisdiction, whichever is higher) to use this Platform. By using Bullmoney, you represent and warrant that: (a) you are of legal age to form a binding contract; (b) you have the full right, power, and authority to agree to these Terms; (c) you are not prohibited by any applicable laws from using our services; (d) your use of the Platform does not violate any applicable law, regulation, or third-party rights. We reserve the right to request proof of age at any time.",
  },
  {
    number: "03",
    title: "Account Registration & Security",
    text: "To access certain features, you must register for an account. You agree to: (a) provide accurate, current, and complete information during registration; (b) maintain and update your account information; (c) maintain the security and confidentiality of your login credentials; (d) notify us immediately of any unauthorized access or use of your account; (e) accept responsibility for all activities that occur under your account. We reserve the right to suspend, terminate, or refuse service to any account at our sole discretion without prior notice or liability.",
  },
  {
    number: "04",
    title: "No Financial Advice - Educational Purpose Only",
    text: "CRITICAL NOTICE: Bullmoney is strictly an educational platform and software provider. We are NOT registered financial advisors, investment advisors, brokers, broker-dealers, investment banks, or registered investment analysts under any jurisdiction including but not limited to the SEC (USA), FCA (UK), ASIC (Australia), CySEC (Cyprus), FSCA (South Africa), MAS (Singapore), or any other regulatory body worldwide. All content including trade setups, analyses, indicators, courses, signals, community posts, and any other materials are for EDUCATIONAL AND INFORMATIONAL PURPOSES ONLY. Nothing on this Platform constitutes personalized investment advice, a recommendation, or solicitation to buy, sell, or hold any financial instrument. You acknowledge that all trading decisions are made solely by you at your own risk.",
  },
  {
    number: "05",
    title: "Extreme Risk Warning - Trading Losses",
    text: "WARNING: Trading foreign exchange (Forex), contracts for difference (CFDs), cryptocurrencies, futures, options, stocks, and any other financial instruments carries EXTREME RISK and may not be suitable for all investors. The high degree of leverage available in trading can work against you as well as for you. You could sustain a TOTAL LOSS of your initial investment and potentially owe additional funds. Past performance is not indicative of future results. Statistics show that 70-90% of retail traders lose money. Do NOT trade with money you cannot afford to lose. By using this Platform, you acknowledge you understand and accept these risks.",
  },
  {
    number: "06",
    title: "Third-Party Broker Disclaimer",
    text: "Bullmoney does NOT own, operate, manage, or control any brokerage, trading platform, or financial institution. Any broker integrations (including but not limited to MetaTrader 4/5, Vantage, XM, or others) are provided for convenience only. We do not guarantee the solvency, reliability, or regulatory compliance of any third-party broker. Your relationship with any broker is governed by their terms of service. We are not responsible for: (a) broker downtime or technical failures; (b) execution delays or slippage; (c) broker insolvency or fund loss; (d) disputes between you and your broker; (e) any actions or omissions by third-party services. Choose your broker carefully and verify their regulatory status independently.",
  },
  {
    number: "07",
    title: "Shop Policy - Digital Goods & NO REFUNDS",
    text: "All products sold via Bullmoney Shop (including but not limited to indicators, trading tools, PDFs, e-books, software, courses, signal services, and digital downloads) are intangible digital goods. Due to the nature of digital content that can be instantly accessed, copied, or downloaded, ALL SALES ARE FINAL AND NON-REFUNDABLE. No refunds, returns, exchanges, or chargebacks will be processed under any circumstances. By completing a purchase, you waive any right to a refund. These products are tools and educational materials; they do NOT guarantee profitability or any specific financial outcome. Attempting a chargeback may result in permanent account termination and legal action.",
  },
  {
    number: "08",
    title: "Affiliate Disclosure & Compensation",
    text: "Bullmoney may contain affiliate links, referral codes, and sponsored content. We may receive compensation, commissions, or other benefits when you click on links, sign up for services, or make purchases through our referral links with third-party brokers or services. This compensation does not affect the price you pay. However, this compensation may influence which products or services we feature. We are committed to providing honest reviews but acknowledge this potential conflict of interest. Always conduct your own due diligence before signing up for any service.",
  },
  {
    number: "09",
    title: "Intellectual Property Rights",
    text: "All content on Bullmoney, including but not limited to text, graphics, logos, icons, images, audio clips, video clips, data compilations, software, indicators, trading tools, course materials, and the overall design and arrangement, is the exclusive property of Bullmoney or its content suppliers and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not: (a) copy, reproduce, distribute, publish, display, perform, modify, create derivative works, transmit, or exploit any content; (b) reverse engineer, decompile, or disassemble any software; (c) remove any copyright or proprietary notices; (d) use our trademarks without written permission. Violation may result in legal action.",
  },
  {
    number: "10",
    title: "User Content & Community Guidelines",
    text: "By posting content (analyses, comments, trade ideas, images, etc.) on our community features (Bull Feed, forums, comments), you grant Bullmoney a worldwide, non-exclusive, royalty-free, perpetual, irrevocable license to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display such content. You are solely responsible for your content and must not post: (a) financial advice (you are not registered to give advice); (b) illegal, harmful, threatening, abusive, harassing, defamatory, or discriminatory content; (c) spam, scams, or misleading information; (d) copyrighted material you don't own; (e) malicious code or links. We reserve the right to remove any content and terminate accounts without notice.",
  },
  {
    number: "11",
    title: "Limitation of Liability",
    text: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, BULLMONEY, ITS OWNERS, DIRECTORS, EMPLOYEES, AGENTS, AFFILIATES, PARTNERS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO: (a) trading losses or lost profits; (b) loss of data or business interruption; (c) personal injury or property damage; (d) reliance on any information provided; (e) errors or omissions in content; (f) unauthorized access to your data; (g) any third-party conduct or content; (h) any damages arising from your use or inability to use the Platform. This limitation applies regardless of the theory of liability and even if we have been advised of the possibility of such damages. IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID TO US IN THE PAST 12 MONTHS, OR $100 USD, WHICHEVER IS LESS.",
  },
  {
    number: "12",
    title: "Indemnification",
    text: "You agree to defend, indemnify, and hold harmless Bullmoney, its officers, directors, employees, contractors, agents, affiliates, licensors, and suppliers from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including attorney's fees) arising from: (a) your use of and access to the Platform; (b) your violation of any term of these Terms; (c) your violation of any third-party right, including intellectual property, property, or privacy rights; (d) any claim that your content caused damage to a third party; (e) your trading activities and financial decisions; (f) your violation of any applicable law. This defense and indemnification obligation will survive these Terms and your use of the Platform.",
  },
  {
    number: "13",
    title: "Disclaimer of Warranties",
    text: "THE PLATFORM AND ALL CONTENT, PRODUCTS, AND SERVICES ARE PROVIDED \"AS IS\" AND \"AS AVAILABLE\" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. WE SPECIFICALLY DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO: (a) implied warranties of merchantability, fitness for a particular purpose, and non-infringement; (b) warranties arising from course of dealing, usage, or trade practice; (c) warranties that the Platform will be uninterrupted, timely, secure, or error-free; (d) warranties regarding the accuracy, reliability, or completeness of any content; (e) warranties that any defects will be corrected; (f) warranties that the Platform is free of viruses or harmful components. Some jurisdictions do not allow exclusion of implied warranties, so some of these exclusions may not apply to you.",
  },
  {
    number: "14",
    title: "Jurisdictional Restrictions & Compliance",
    text: "Our services are not intended for distribution to, or use by, any person in any country or jurisdiction where such distribution or use would be contrary to local law or regulation or would subject us to any registration requirement. Users are solely responsible for determining whether their access and use of the Platform complies with applicable local laws. We specifically exclude our services from being offered to residents of jurisdictions where such services are prohibited or heavily restricted, including but not limited to certain US states where CFD trading is restricted, countries under international sanctions, and regions where financial services require specific licensing that we do not hold. By using our services, you represent that you are legally permitted to do so in your jurisdiction.",
  },
  {
    number: "15",
    title: "Dispute Resolution & Arbitration",
    text: "ANY DISPUTE, CLAIM, OR CONTROVERSY ARISING OUT OF OR RELATING TO THESE TERMS OR THE PLATFORM SHALL BE RESOLVED THROUGH BINDING ARBITRATION, rather than in court. There is no judge or jury in arbitration. You agree to WAIVE YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION or representative proceeding. Arbitration shall be conducted on an individual basis only. The arbitration shall be administered in accordance with the rules of a recognized arbitration body in the jurisdiction chosen by Bullmoney. Each party shall bear its own costs. The arbitrator's decision shall be final and binding. This arbitration agreement shall survive termination of these Terms.",
  },
  {
    number: "16",
    title: "Governing Law & Venue",
    text: "These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Bullmoney is registered, without regard to its conflict of law provisions. You agree that any legal action or proceeding that cannot be resolved through arbitration shall be brought exclusively in the courts located in that jurisdiction. You consent to the personal jurisdiction and venue of such courts. You waive any objection to the laying of venue and any claim that such forum is inconvenient. If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.",
  },
  {
    number: "17",
    title: "Modifications to Terms",
    text: "We reserve the right to modify, amend, or update these Terms at any time without prior notice. Changes become effective immediately upon posting on the Platform. Your continued use of the Platform after any changes constitutes your acceptance of the new Terms. It is your responsibility to review these Terms periodically for changes. We may also, in the future, offer new services and/or features. Such new features and/or services shall be subject to the terms and conditions of these Terms. If you do not agree to the modified Terms, you must stop using the Platform immediately.",
  },
  {
    number: "18",
    title: "Termination",
    text: "We may terminate or suspend your account and access to the Platform immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms. Upon termination: (a) your right to use the Platform will immediately cease; (b) you must cease all use of our services; (c) any provisions of these Terms which by their nature should survive will survive termination, including ownership provisions, warranty disclaimers, indemnity, limitations of liability, and dispute resolution provisions. Termination will not affect any rights and obligations accrued prior to termination.",
  },
];

// ============================================================================
// COMPREHENSIVE PRIVACY POLICY
// ============================================================================
const PRIVACY_SECTIONS = [
  {
    number: "01",
    title: "Introduction & Commitment to Privacy",
    text: "Bullmoney (\"we\", \"us\", \"our\") is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, share, and protect your information when you use our website, applications, and services (collectively, \"the Platform\"). This policy applies to all users worldwide and is designed to comply with international privacy regulations including GDPR (EU), CCPA (California), LGPD (Brazil), POPIA (South Africa), PDPA (Singapore/Thailand), and other applicable data protection laws. By using our Platform, you consent to the data practices described in this policy.",
  },
  {
    number: "02",
    title: "Information We Collect - Account Data",
    text: "When you create an account, we collect: (a) Email address (required for authentication and communication); (b) Password (encrypted/hashed, never stored in plain text); (c) Username/display name (for community features); (d) MT5/MT4 trading account numbers (for broker verification and affiliate tracking); (e) Profile information (optional: avatar, bio, social media handles); (f) Referral codes and affiliate relationships; (g) Account preferences and settings; (h) VIP/membership status and subscription details. This data is necessary to provide our services and is stored securely in our database hosted on Supabase with industry-standard encryption.",
  },
  {
    number: "03",
    title: "Information We Collect - Trading Data",
    text: "If you use our trading journal or broker integration features, we may collect: (a) Trade entries and exits (symbol, price, volume, time); (b) Profit and loss calculations; (c) Position sizes and risk metrics; (d) Trading strategies and notes you add; (e) Screenshots and images of trades; (f) Account balance and equity (when connected via MetaAPI); (g) Trading statistics and performance analytics. This data helps us provide personalized trading analytics and educational insights. Your trading data is private by default and is never shared without your explicit consent.",
  },
  {
    number: "04",
    title: "Information We Collect - Community Data",
    text: "When using community features (Bull Feed, forums, comments), we collect: (a) Posts, analyses, and trade ideas you share; (b) Comments and reactions to others' content; (c) Copy trade actions and price alerts you set; (d) Interactions with other users; (e) Content you upload (images, charts). By posting to community features, you acknowledge this content may be visible to other users based on your privacy settings. We retain this data to provide community services and may use it for moderation and improving user experience.",
  },
  {
    number: "05",
    title: "Information We Collect - Technical & Device Data",
    text: "We automatically collect technical information including: (a) IP address (partially anonymized for privacy); (b) Browser type and version; (c) Operating system and device type; (d) Device identifiers; (e) Screen resolution and viewport size; (f) Referring URLs and exit pages; (g) Pages viewed and time spent; (h) Click patterns and interactions; (i) Error logs and crash reports; (j) Performance metrics (FPS, load times). This data helps us optimize performance, troubleshoot issues, and improve user experience across different devices and browsers.",
  },
  {
    number: "06",
    title: "Cookies & Tracking Technologies",
    text: "We use cookies and similar technologies including: (a) Essential cookies - required for authentication and security; (b) Functional cookies - remember your preferences and settings; (c) Analytics cookies - understand usage patterns (Vercel Analytics, Google Analytics); (d) Local storage - store session data and offline capabilities; (e) Session storage - temporary data during your visit. You can control cookies through your browser settings, but disabling certain cookies may affect Platform functionality. We do not use advertising tracking cookies or sell your data to advertisers.",
  },
  {
    number: "07",
    title: "Push Notifications & Subscriptions",
    text: "If you enable push notifications, we collect: (a) Push subscription endpoint URL; (b) Encryption keys (p256dh); (c) Authentication secrets; (d) Browser/device information; (e) Your notification preferences (trades, livestreams, news, VIP content). This data is used solely to send you notifications you have opted into. You can disable notifications at any time through your browser settings or within the Platform. Notification data is stored securely and is not shared with third parties.",
  },
  {
    number: "08",
    title: "How We Use Your Information",
    text: "We use your information to: (a) Provide, maintain, and improve our services; (b) Process transactions and send related information; (c) Authenticate your identity and maintain account security; (d) Send you technical notices, updates, security alerts; (e) Respond to your comments, questions, and support requests; (f) Monitor and analyze trends, usage, and activities; (g) Detect, prevent, and address technical issues and fraud; (h) Personalize and improve your experience; (i) Send marketing communications (with your consent); (j) Comply with legal obligations. We do NOT use your data to make trading decisions on your behalf or provide personalized financial advice.",
  },
  {
    number: "09",
    title: "Data Sharing & Third Parties",
    text: "We may share your information with: (a) Service providers (Supabase for database, Vercel for hosting, payment processors); (b) Analytics providers (in aggregated, anonymized form); (c) Broker partners (only your referral/affiliate code relationship); (d) Legal authorities when required by law or to protect our rights. We do NOT: (i) Sell your personal data to third parties; (ii) Share your trading data without consent; (iii) Provide your contact information to marketers; (iv) Use your data for purposes not disclosed in this policy. Third-party services have their own privacy policies, and we encourage you to review them.",
  },
  {
    number: "10",
    title: "Data Security Measures",
    text: "We implement comprehensive security measures including: (a) SSL/TLS encryption for all data transmission; (b) Password hashing using industry-standard algorithms; (c) Database encryption at rest; (d) Row-level security in Supabase ensuring users only access their own data; (e) Regular security audits and vulnerability assessments; (f) Access controls and authentication for all systems; (g) Secure development practices; (h) Incident response procedures. While we strive to protect your data, no method of transmission over the Internet is 100% secure. You are responsible for maintaining the confidentiality of your credentials.",
  },
  {
    number: "11",
    title: "Data Retention",
    text: "We retain your data for as long as necessary to provide our services and fulfill the purposes described in this policy. Specifically: (a) Account data - retained while your account is active, deleted upon request; (b) Trading journal data - retained indefinitely for your records unless you delete it; (c) VIP messages - automatically deleted after 24 hours; (d) Crash logs and analytics - retained for 90 days for debugging; (e) Transaction records - retained as required by law (typically 7 years); (f) Backup data - may persist in backups for up to 30 days after deletion. You can request deletion of your data at any time, subject to legal retention requirements.",
  },
  {
    number: "12",
    title: "Your Privacy Rights - GDPR (EU/EEA)",
    text: "If you are in the EU/EEA, you have the following rights under GDPR: (a) Right to access - request copies of your personal data; (b) Right to rectification - request correction of inaccurate data; (c) Right to erasure (\"right to be forgotten\") - request deletion of your data; (d) Right to restrict processing - limit how we use your data; (e) Right to data portability - receive your data in a machine-readable format; (f) Right to object - object to certain processing activities; (g) Rights related to automated decision-making - not be subject to decisions based solely on automated processing. To exercise these rights, contact us at the email provided below.",
  },
  {
    number: "13",
    title: "Your Privacy Rights - CCPA (California)",
    text: "If you are a California resident, you have the following rights under CCPA: (a) Right to know - what personal information we collect, use, disclose, and sell; (b) Right to delete - request deletion of your personal information; (c) Right to opt-out - opt out of the sale of personal information (we do not sell your data); (d) Right to non-discrimination - we will not discriminate against you for exercising your rights. California residents can make requests by contacting us. We will verify your identity before processing requests. You may designate an authorized agent to make requests on your behalf.",
  },
  {
    number: "14",
    title: "Your Privacy Rights - Other Jurisdictions",
    text: "We respect privacy rights under various laws including: (a) LGPD (Brazil) - similar rights to GDPR; (b) POPIA (South Africa) - right to access, correction, deletion; (c) PDPA (Singapore/Thailand) - consent-based data processing; (d) PIPEDA (Canada) - right to access and challenge data; (e) Privacy Act (Australia) - APP compliance. Regardless of your location, you can: (i) Access your data through account settings; (ii) Update or correct your information; (iii) Delete your account and associated data; (iv) Opt out of marketing communications; (v) Contact us with privacy concerns.",
  },
  {
    number: "15",
    title: "International Data Transfers",
    text: "Your data may be transferred to, and maintained on, servers located outside of your country. If you are located in the EU/EEA, we ensure adequate safeguards are in place for transfers to countries without an adequacy decision from the European Commission, including: (a) Standard Contractual Clauses; (b) Data Processing Agreements with our service providers; (c) Appropriate security measures. By using our services, you consent to the transfer of your information to countries outside your residence, which may have different data protection rules.",
  },
  {
    number: "16",
    title: "Children's Privacy",
    text: "Our Platform is not intended for individuals under 18 years of age (or the age of majority in your jurisdiction). We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. If we discover that we have collected personal information from a child without parental consent, we will take steps to delete that information promptly. If you are under 18, do not use this Platform, do not provide any personal information, and do not attempt to register for an account.",
  },
  {
    number: "17",
    title: "Third-Party Links & Services",
    text: "Our Platform may contain links to third-party websites, services, or applications (including broker websites, social media platforms, and payment processors). This Privacy Policy does not apply to third-party sites. We are not responsible for the privacy practices of these third parties. We encourage you to read the privacy policies of any third-party site you visit. Third-party integrations (like MetaAPI for broker connection or Spotify for music) have their own data handling practices, and your use of these services is subject to their respective terms and privacy policies.",
  },
  {
    number: "18",
    title: "Changes to Privacy Policy & Contact",
    text: "We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically. For significant changes, we may provide notice through email or prominent display on the Platform. Your continued use after changes constitutes acceptance of the modified policy. For privacy-related questions, data requests, or to exercise your rights, contact us at: privacy@bullmoney.online. We aim to respond to all legitimate requests within 30 days.",
  },
];

// ============================================================================
// COMPREHENSIVE FINANCIAL DISCLAIMER
// ============================================================================
const DISCLAIMER_SECTIONS = [
  {
    number: "01",
    title: "No Financial Advice - Critical Warning",
    text: "CRITICAL NOTICE: Bullmoney, including all its content, tools, courses, indicators, signals, analyses, trade setups, community posts, and any other materials, is provided for EDUCATIONAL AND INFORMATIONAL PURPOSES ONLY. Nothing on this Platform constitutes, or should be construed as: (a) investment advice; (b) financial advice; (c) trading advice; (d) tax advice; (e) legal advice; (f) a recommendation to buy, sell, or hold any security or financial instrument; (g) an offer or solicitation to buy or sell; (h) an endorsement of any specific investment strategy. We are not licensed financial advisors, and our content is not a substitute for professional financial advice.",
  },
  {
    number: "02",
    title: "Extreme Risk Warning - You May Lose Everything",
    text: "WARNING: Trading financial instruments including Forex, CFDs, cryptocurrencies, futures, options, stocks, and commodities carries a HIGH LEVEL OF RISK and may not be suitable for all investors. You may LOSE ALL OF YOUR INVESTED CAPITAL and potentially more than your initial deposit due to leverage. Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite. Statistics show that between 70% and 90% of retail traders lose money. Never trade with money you cannot afford to lose. Never borrow money to trade. Seek advice from an independent financial advisor if you have any doubts.",
  },
  {
    number: "03",
    title: "No Guarantee of Results",
    text: "Past performance is NOT indicative of future results. Any reference to historical returns, past performance, or trading results is for illustrative purposes only and should not be construed as a guarantee of future performance. Trading results can vary significantly based on market conditions, trader experience, risk management, and many other factors. We make NO guarantees, representations, or warranties of any kind, express or implied, regarding: (a) the accuracy of any information provided; (b) the success of any trading strategy; (c) the profitability of any trade setup or signal; (d) the performance of any indicator or tool. You trade at your own risk.",
  },
  {
    number: "04",
    title: "Hypothetical Performance Disclaimer",
    text: "Hypothetical or simulated performance results have significant limitations. They do not represent actual trading and may not accurately reflect the impact of material economic and market factors. Simulated results are generally prepared with the benefit of hindsight and do not account for financial risk in actual trading. Factors such as liquidity, slippage, market impact, and commission costs may cause actual trading results to differ materially from hypothetical results. You should not assume that any backtested strategy or hypothetical result shown will be profitable in real trading.",
  },
  {
    number: "05",
    title: "Leverage & Margin Risk",
    text: "Leveraged trading (margin trading) allows you to control large positions with a small amount of capital. While leverage can amplify profits, it can equally amplify losses. You could lose more than your initial deposit. Understanding leverage is critical before you trade. In highly leveraged positions, a small price movement against you can result in a margin call and complete loss of your investment. Different jurisdictions have different leverage restrictions; you must comply with applicable regulations. We do not provide leveraged products directly; any leverage is offered by your chosen broker under their terms.",
  },
  {
    number: "06",
    title: "Third-Party Broker Disclaimer",
    text: "Bullmoney does NOT provide brokerage services. We do not hold client funds, execute trades on your behalf, or provide regulated financial services. Any broker mentioned, recommended, or integrated with our Platform (including but not limited to Vantage, XM, MetaTrader platforms, or any other broker) is a third party with their own terms, conditions, risks, and regulatory status. We are NOT responsible for: (a) broker solvency or fund safety; (b) trade execution quality; (c) broker regulatory compliance; (d) any disputes with your broker; (e) any losses resulting from broker-related issues. Always verify your broker's regulatory status independently and never deposit more than you can afford to lose.",
  },
  {
    number: "07",
    title: "Educational Content Disclaimer",
    text: "All educational content, courses, tutorials, webinars, and training materials are provided for learning purposes only. They are based on the author's personal experiences and opinions. The information may be incomplete, outdated, or incorrect. Markets evolve, and strategies that worked in the past may not work in the future. You should independently verify all information before making any trading or investment decisions. Educational content does not account for your personal financial situation, risk tolerance, or investment objectives. What works for one trader may not work for another.",
  },
  {
    number: "08",
    title: "Trade Signals & Setups Disclaimer",
    text: "Any trade signals, setups, analyses, or trade ideas shared on the Platform (whether from us or community members) are opinions and should NOT be construed as trading recommendations. You must conduct your own research and make your own trading decisions. We do NOT guarantee the accuracy, completeness, or timeliness of any trade signals. By the time you see a signal, market conditions may have changed. Entry and exit points, stop losses, and targets are examples only. Your actual fills may differ due to market conditions. You are solely responsible for any trades you execute based on any information from our Platform.",
  },
  {
    number: "09",
    title: "Indicators & Tools Disclaimer",
    text: "Trading indicators and tools sold or provided through Bullmoney are technical aids designed to assist with analysis. They are NOT trading systems, NOT automated trading robots, and NOT a substitute for proper education and experience. No indicator or tool can guarantee profitable trades. All indicators have limitations and can produce false signals. Past indicator performance on historical data does not guarantee future results. You should thoroughly understand how any indicator works before using it with real money. Indicators are tools to assist decision-making, not make decisions for you.",
  },
  {
    number: "10",
    title: "Tax & Legal Considerations",
    text: "Trading and investing have significant tax implications that vary by jurisdiction. Capital gains, income tax, and other taxes may apply to your trading profits. We do NOT provide tax advice, and nothing on our Platform should be construed as such. You are solely responsible for determining and fulfilling your tax obligations. We strongly recommend consulting with a qualified tax professional in your jurisdiction. Additionally, certain trading activities may be restricted or prohibited in your jurisdiction. You are responsible for ensuring your compliance with all applicable laws and regulations.",
  },
  {
    number: "11",
    title: "Market Risks & Volatility",
    text: "Financial markets are subject to various risks including but not limited to: (a) market risk - adverse price movements; (b) liquidity risk - inability to execute at desired prices; (c) gap risk - prices moving significantly between sessions; (d) systemic risk - broad market failures; (e) geopolitical risk - events affecting global markets; (f) regulatory risk - changes in laws or regulations; (g) technology risk - platform failures, data errors; (h) counterparty risk - failure of brokers or other parties. During periods of high volatility, spreads may widen significantly, execution may be delayed, and prices may gap substantially.",
  },
  {
    number: "12",
    title: "Cryptocurrency-Specific Risks",
    text: "If trading cryptocurrencies, additional risks include: (a) extreme volatility - price swings of 10%+ in a single day are common; (b) regulatory uncertainty - laws vary widely by jurisdiction; (c) exchange risk - cryptocurrency exchanges may be hacked or fail; (d) wallet security - loss of private keys means permanent loss of funds; (e) market manipulation - crypto markets are less regulated; (f) technology risk - smart contract bugs, protocol failures; (g) limited recourse - lost or stolen crypto is often unrecoverable. Cryptocurrency trading may be prohibited or restricted in your jurisdiction.",
  },
  {
    number: "13",
    title: "VIP & Premium Content Disclaimer",
    text: "VIP memberships, premium signals, and exclusive content do NOT guarantee improved trading results or profits. Premium content provides additional educational materials and community features but does not increase your likelihood of success. Success in trading depends on your skills, discipline, risk management, market conditions, and many other factors beyond our control. VIP access does not constitute investment advice or a managed account service. You remain solely responsible for all trading decisions regardless of your membership level.",
  },
  {
    number: "14",
    title: "Community Content Disclaimer",
    text: "Content posted by community members (trade ideas, analyses, signals) represents the personal opinions of those users, NOT Bullmoney. We do not verify, endorse, or guarantee the accuracy of user-generated content. Community members are not licensed financial advisors. Following trades or ideas posted by other users is entirely at your own risk. You should independently verify any information before acting on it. We are not responsible for any losses resulting from following community content. Be especially cautious of users making unrealistic profit claims.",
  },
  {
    number: "15",
    title: "Forward-Looking Statements",
    text: "The Platform may contain forward-looking statements including projections, forecasts, targets, and opinions about future market movements. These statements are based on current expectations and assumptions and are subject to known and unknown risks. Actual results may differ materially from any forward-looking statements. Markets are inherently unpredictable, and no one can consistently predict future price movements. Do not rely on forward-looking statements as predictions of future events.",
  },
  {
    number: "16",
    title: "Limitation of Liability",
    text: "TO THE FULLEST EXTENT PERMITTED BY LAW, BULLMONEY AND ITS OWNERS, DIRECTORS, EMPLOYEES, AGENTS, AFFILIATES, AND PARTNERS SHALL NOT BE LIABLE FOR ANY DAMAGES WHATSOEVER, INCLUDING BUT NOT LIMITED TO: (a) any direct, indirect, incidental, special, consequential, or exemplary damages; (b) damages for loss of profits, goodwill, use, data, or other intangible losses; (c) trading losses or missed trading opportunities; (d) damages resulting from reliance on any content; (e) damages from unauthorized access or modification of your data; (f) damages arising from any third-party content or services. This limitation applies regardless of the legal theory and even if we have been advised of the possibility of such damages.",
  },
  {
    number: "17",
    title: "Assumption of Risk",
    text: "By using Bullmoney, you acknowledge and agree that: (a) you are solely responsible for all trading decisions; (b) you understand the risks involved in trading; (c) you have the financial ability to sustain losses; (d) you will not hold us liable for any losses; (e) you have read and understood all disclaimers; (f) you are using the Platform for educational purposes; (g) you will seek professional advice for specific trading decisions; (h) you accept full responsibility for the outcomes of your trading activities. Trading involves substantial risk of loss and is not suitable for all investors.",
  },
  {
    number: "18",
    title: "Contact & Legal Notices",
    text: "For questions about these disclaimers, our services, or legal matters, contact us at: legal@bullmoney.online. These disclaimers are incorporated by reference into our Terms of Service and Privacy Policy. They constitute a binding agreement between you and Bullmoney. If any provision is found to be unenforceable, the remaining provisions will continue in full force and effect. These disclaimers are effective as of the date of your first use of the Platform and will be updated from time to time. Your continued use constitutes acceptance of any modifications. Last updated: January 2026.",
  },
];

export const LegalDisclaimerModal = ({ isOpen, onClose, initialTab = 'disclaimer' }: LegalDisclaimerModalProps) => {
  const [openSection, setOpenSection] = useState<string | null>("01");
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'disclaimer'>(initialTab);

  // Reset to initial tab when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setOpenSection("01");
    }
  }, [isOpen, initialTab]);

  const getCurrentSections = () => {
    switch (activeTab) {
      case 'terms':
        return TERMS_SECTIONS;
      case 'privacy':
        return PRIVACY_SECTIONS;
      case 'disclaimer':
      default:
        return DISCLAIMER_SECTIONS;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'terms':
        return 'Terms of Service';
      case 'privacy':
        return 'Privacy Policy';
      case 'disclaimer':
      default:
        return 'Financial Disclaimer';
    }
  };

  const getTabIcon = () => {
    switch (activeTab) {
      case 'terms':
        return <FileText className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 legal-neon-red-icon flex-shrink-0" style={{ color: '#ef4444' }} />;
      case 'privacy':
        return <Lock className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 legal-neon-red-icon flex-shrink-0" style={{ color: '#ef4444' }} />;
      case 'disclaimer':
      default:
        return <ShieldAlert className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 legal-neon-red-icon flex-shrink-0" style={{ color: '#ef4444' }} />;
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LEGAL_NEON_STYLES }} />
      <EnhancedModal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="max-w-4xl"
        title={
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2">
            {getTabIcon()}
            <span className="text-xs xs:text-sm sm:text-base truncate legal-neon-white-text">{getTabTitle()}</span>
          </div>
        }
      >
        <div className="flex flex-col -mx-3 xs:-mx-4 sm:-mx-5 md:-mx-6 -mt-3 xs:-mt-4 sm:-mt-5 md:-mt-6 -mb-3 xs:-mb-4 sm:-mb-5 md:-mb-6" style={{ height: 'calc(85vh - 60px)', maxHeight: 'calc(85vh - 60px)', minHeight: '300px' }}>
          {/* Tab Navigation - Fixed at top */}
          <div className="flex gap-1 xs:gap-1.5 sm:gap-2 px-3 xs:px-4 sm:px-5 md:px-6 py-2 xs:py-2.5 sm:py-3 overflow-x-auto flex-shrink-0 bg-black border-b border-blue-500/30">
            <button
              onClick={() => { setActiveTab('terms'); setOpenSection("01"); }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 sm:py-2 rounded-md sm:rounded-lg border-2 text-[9px] xs:text-[10px] sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'terms' ? 'legal-tab-active' : 'legal-tab-inactive hover:border-blue-500/50'
              }`}
            >
              <FileText className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Terms</span>
              <span className="xs:hidden">TOS</span>
            </button>
            <button
              onClick={() => { setActiveTab('privacy'); setOpenSection("01"); }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 sm:py-2 rounded-md sm:rounded-lg border-2 text-[9px] xs:text-[10px] sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'privacy' ? 'legal-tab-active' : 'legal-tab-inactive hover:border-blue-500/50'
              }`}
            >
              <Lock className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5" />
              Privacy
            </button>
            <button
              onClick={() => { setActiveTab('disclaimer'); setOpenSection("01"); }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 sm:py-2 rounded-md sm:rounded-lg border-2 text-[9px] xs:text-[10px] sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'disclaimer' ? 'legal-tab-active' : 'legal-tab-inactive hover:border-blue-500/50'
              }`}
            >
              <ShieldAlert className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Disclaimer</span>
              <span className="xs:hidden">Risk</span>
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div 
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden footer-scrollbar px-3 xs:px-4 sm:px-5 md:px-6 py-2 xs:py-3 sm:py-4 space-y-2 xs:space-y-3 sm:space-y-4 text-xs sm:text-sm leading-relaxed"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              touchAction: 'pan-y'
            }}
          >
            {/* Critical Legal Notice - Neon styled */}
            <div 
              className="relative overflow-hidden rounded-lg p-2 xs:p-2.5 sm:p-3 md:p-4 bg-black"
              style={{
                border: '2px solid #ef4444',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.5), 0 0 16px rgba(239, 68, 68, 0.3), inset 0 0 8px rgba(239, 68, 68, 0.1)'
              }}
            >
              <div className="relative flex gap-1.5 xs:gap-2 sm:gap-3">
                <div className="shrink-0">
                  <AlertTriangle className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 legal-neon-red-icon" style={{ color: '#ef4444' }} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[8px] xs:text-[9px] sm:text-xs font-bold legal-neon-white-text tracking-wide uppercase mb-0.5">
                    {activeTab === 'terms' && 'Binding Legal Agreement'}
                    {activeTab === 'privacy' && 'Your Privacy Rights'}
                    {activeTab === 'disclaimer' && 'Critical Risk Warning'}
                  </h2>
                  <p className="text-[7px] xs:text-[8px] sm:text-[10px] leading-tight" style={{ color: '#fca5a5', textShadow: '0 0 4px rgba(252, 165, 165, 0.5)' }}>
                    {activeTab === 'terms' && 'By using Bullmoney, you agree to these Terms. This affects your legal rights.'}
                    {activeTab === 'privacy' && 'We collect and process your data as described below. Your privacy is important.'}
                    {activeTab === 'disclaimer' && 'Trading involves substantial risk of loss. NOT financial advice. You may lose all capital.'}
                  </p>
                </div>
              </div>
            </div>

            <p className="legal-neon-white-text text-[9px] xs:text-[10px] sm:text-xs">
              By accessing <span className="font-semibold legal-neon-blue-text">Bullmoney</span>, you agree to be bound by these {getTabTitle().toLowerCase()} and all applicable laws.
            </p>

            {/* Quick Summary Box */}
            <div 
              className="relative overflow-hidden rounded-lg p-2 xs:p-2.5 sm:p-3 bg-black/50"
              style={{
                border: '1px solid #3b82f6',
                boxShadow: '0 0 4px rgba(59, 130, 246, 0.3)'
              }}
            >
              <h3 className="text-[9px] xs:text-[10px] sm:text-xs font-bold legal-neon-blue-text mb-1.5">Quick Summary</h3>
              <ul className="space-y-1 text-[8px] xs:text-[9px] sm:text-[10px]" style={{ color: '#9ca3af' }}>
                {activeTab === 'terms' && (
                  <>
                    <li className="flex items-start gap-2"><span className="text-blue-400">•</span> You must be 18+ to use this platform</li>
                    <li className="flex items-start gap-2"><span className="text-blue-400">•</span> This is educational content ONLY, not financial advice</li>
                    <li className="flex items-start gap-2"><span className="text-blue-400">•</span> All digital product sales are FINAL - no refunds</li>
                    <li className="flex items-start gap-2"><span className="text-blue-400">•</span> We may use affiliate links and receive compensation</li>
                    <li className="flex items-start gap-2"><span className="text-blue-400">•</span> You are solely responsible for your trading decisions</li>
                  </>
                )}
                {activeTab === 'privacy' && (
                  <>
                    <li className="flex items-start gap-2"><span className="text-blue-400">•</span> We collect account, trading, and technical data</li>
                    <li className="flex items-start gap-2"><span className="text-blue-400">•</span> Your data is stored securely with encryption</li>
                    <li className="flex items-start gap-2"><span className="text-blue-400">•</span> We do NOT sell your personal data to third parties</li>
                    <li className="flex items-start gap-2"><span className="text-blue-400">•</span> You have rights to access, correct, and delete your data</li>
                    <li className="flex items-start gap-2"><span className="text-blue-400">•</span> Compliant with GDPR, CCPA, LGPD, and other privacy laws</li>
                  </>
                )}
                {activeTab === 'disclaimer' && (
                  <>
                    <li className="flex items-start gap-2"><span className="text-red-400">⚠</span> <span className="text-red-300">70-90% of retail traders LOSE money</span></li>
                    <li className="flex items-start gap-2"><span className="text-red-400">⚠</span> <span className="text-red-300">You could lose ALL your invested capital</span></li>
                    <li className="flex items-start gap-2"><span className="text-blue-400">•</span> We are NOT licensed financial advisors</li>
                    <li className="flex items-start gap-2"><span className="text-blue-400">•</span> Past performance does NOT guarantee future results</li>
                    <li className="flex items-start gap-2"><span className="text-blue-400">•</span> Never trade with money you cannot afford to lose</li>
                  </>
                )}
              </ul>
            </div>

            <div className="space-y-1.5 xs:space-y-2 sm:space-y-2.5">
              {getCurrentSections().map((section) => (
                <DisclaimerSection
                  key={section.number}
                  number={section.number}
                  title={section.title}
                  text={section.text}
                  isOpen={openSection === section.number}
                  onToggle={(id) => setOpenSection((prev) => (prev === id ? null : id))}
                />
              ))}
            </div>

            {/* Neon divider */}
            <div className="py-1">
              <div 
                className="h-px w-full"
                style={{
                  background: '#3b82f6',
                  boxShadow: '0 0 4px #3b82f6, 0 0 8px #3b82f6'
                }}
              />
            </div>

            {/* International Compliance Notice */}
            <div 
              className="relative overflow-hidden rounded-lg p-2 xs:p-2.5 sm:p-3 bg-black/50"
              style={{
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Globe className="w-3 h-3 xs:w-3.5 xs:h-3.5" style={{ color: '#3b82f6' }} />
                <h3 className="text-[8px] xs:text-[9px] sm:text-xs font-bold legal-neon-blue-text">International Compliance</h3>
              </div>
              <p className="text-[7px] xs:text-[8px] sm:text-[10px]" style={{ color: '#9ca3af' }}>
                Compliant with:
                <span className="text-blue-400"> GDPR</span> (EU),
                <span className="text-blue-400"> CCPA</span> (CA),
                <span className="text-blue-400"> LGPD</span> (BR),
                <span className="text-blue-400"> POPIA</span> (ZA),
                <span className="text-blue-400"> PDPA</span> (SG),
                <span className="text-blue-400"> PIPEDA</span> (CA)
              </p>
            </div>

            <p className="italic text-[7px] xs:text-[8px] sm:text-[9px] text-center" style={{ color: '#9ca3af' }}>
              By clicking &quot;I Agree&quot; you confirm you have read and accept all Terms, Privacy Policy, and Disclaimers.
            </p>

            {/* Last Updated */}
            <p className="text-center text-[7px] xs:text-[8px]" style={{ color: '#6b7280' }}>
              Last Updated: January 2026 | v2.0
            </p>
          </div>

          {/* Footer button - Fixed at bottom */}
          <div 
            className="flex-shrink-0 bg-black px-3 xs:px-4 sm:px-5 py-3 xs:py-3.5 sm:py-4 flex justify-center sm:justify-end border-t-2 border-blue-500/50"
            style={{
              boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.9)',
              paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))'
            }}
          >
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative flex w-full sm:w-auto items-center justify-center gap-1.5 px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 sm:py-3.5 overflow-hidden rounded-lg sm:rounded-xl text-xs xs:text-sm sm:text-base font-bold transition-all active:scale-95"
              style={{
                border: '2px solid #22c55e',
                boxShadow: '0 0 12px #22c55e, 0 0 24px rgba(34, 197, 94, 0.6)',
                background: 'black'
              }}
            >
              <span className="relative z-10 flex items-center gap-1.5 xs:gap-2 whitespace-nowrap" style={{ color: '#22c55e', textShadow: '0 0 6px #22c55e, 0 0 12px #22c55e' }}>
                I Agree & Understand
                <CheckCircle2 className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5" style={{ color: '#22c55e' }} />
              </span>
            </motion.button>
          </div>
        </div>
      </EnhancedModal>
    </>
  );
};

export default LegalDisclaimerModal;
