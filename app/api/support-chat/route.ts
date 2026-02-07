import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// FREE AI SUPPORT CHAT — Smart contextual answering for BullMoney support
// Uses intelligent pattern matching + knowledge base + optional Groq free tier
// =============================================================================

const SYSTEM_PROMPT = `You are BullMoney's friendly AI support assistant. You help customers with orders, shipping, returns, payments, and general questions about the BullMoney brand (trading lifestyle streetwear & accessories).

Key facts:
- Brand: BullMoney — premium trading/finance lifestyle brand
- Products: Streetwear, accessories, hats, hoodies, tees, etc.
- Shipping: 7-14 business days standard, 3-7 express, worldwide
- Returns: 30 days, unworn/unused, original packaging. Limited edition = final sale
- Refunds: 5-10 business days after receiving return
- Payments: Visa, Mastercard, Amex, Apple Pay, Google Pay, Shop Pay, some crypto
- Fastest support: Telegram @Bullmoneyshop (~15 min response)
- Social: Instagram @bullmoney.shop, Discord discord.com/invite/9vVB44ZrNA, TikTok @bullmoney.shop, X @BULLMONEYFX
- Bulk/wholesale orders available — DM on Telegram
- New drops regularly — follow socials for notifications
- Damaged items: Send photo within 48 hours via Telegram/Instagram for immediate replacement

Be concise, friendly, and helpful. Use short paragraphs. If you don't know something specific about their order, direct them to Telegram @Bullmoneyshop for fastest personal help.`;

// Comprehensive knowledge base for local AI fallback
const KNOWLEDGE_BASE = [
  { keywords: ['ship', 'shipping', 'deliver', 'delivery', 'how long', 'when arrive', 'when will', 'days', 'time', 'fast'], answer: 'Standard shipping takes 7-14 business days worldwide. Express shipping (where available) is 3-7 business days. You\'ll get a tracking number by email once your order ships. We ship to every country!' },
  { keywords: ['track', 'tracking', 'where is', 'order status', 'find order', 'my order'], answer: 'Once your order ships, you\'ll receive an email with a tracking number and link. You can also check your order status in your account dashboard under "Orders". If tracking shows delivered but you haven\'t received it, check with neighbours first, then contact us within 7 days.' },
  { keywords: ['return', 'send back', 'exchange', 'swap'], answer: 'We accept returns within 30 days of delivery for unworn/unused items in original packaging. DM us on Telegram (@Bullmoneyshop) or Instagram to start a return. Note: Limited edition items are final sale and cannot be returned.' },
  { keywords: ['refund', 'money back', 'get refund', 'when refund'], answer: 'Once we receive your return, refunds are processed within 5-10 business days. The refund goes back to your original payment method. You\'ll get an email confirmation when it\'s processed.' },
  { keywords: ['damaged', 'broken', 'wrong item', 'defect', 'ripped', 'torn', 'quality'], answer: 'Sorry to hear that! Send us a photo of the damage via Telegram (@Bullmoneyshop) or Instagram DM within 48 hours of delivery. We\'ll send a replacement or issue a full refund right away — no need to return the damaged item first.' },
  { keywords: ['payment', 'pay', 'card', 'visa', 'mastercard', 'apple pay', 'crypto', 'bitcoin', 'method'], answer: 'We accept all major credit/debit cards (Visa, Mastercard, Amex), Apple Pay, Google Pay, and Shop Pay. Crypto payments may be available for select items. All transactions are encrypted with SSL/TLS — your payment info is always secure.' },
  { keywords: ['cancel', 'cancel order', 'stop order', 'change order', 'modify'], answer: 'We process orders quickly! Contact us within 2 hours of placing your order via Telegram (@Bullmoneyshop) for the fastest response. After that, changes may not be possible once production begins.' },
  { keywords: ['size', 'sizing', 'fit', 'measurements', 'chart', 'small', 'medium', 'large', 'xl'], answer: 'Check the size guide on each product page for detailed measurements. Our items generally run true to size. If you\'re between sizes, we recommend going up. Still unsure? DM us on Telegram with your height/weight and we\'ll help you pick the right size!' },
  { keywords: ['wholesale', 'bulk', 'business', 'team', 'group order', 'resell'], answer: 'Yes! We offer bulk pricing for teams, trading communities, and businesses. DM us on Telegram (@Bullmoneyshop) with your requirements for a custom quote. We can also do custom branding for larger orders.' },
  { keywords: ['collab', 'collaborate', 'partner', 'influencer', 'sponsor', 'ambassador'], answer: 'We love collaborations! Reach out to us on Instagram (@bullmoney.shop) or Telegram with your proposal. We work with traders, influencers, and trading communities.' },
  { keywords: ['installment', 'plan', 'split', 'afterpay', 'klarna', 'later'], answer: 'Shop Pay installments may be available at checkout for qualifying orders. You can split your purchase into 4 interest-free payments. Look for the option at checkout!' },
  { keywords: ['drop', 'new', 'restock', 'collection', 'limited', 'sold out', 'when back', 'upcoming'], answer: 'We drop new collections and limited editions regularly! Follow us on Instagram and TikTok (@bullmoney.shop) for first access and notifications. Limited edition items sell out fast and usually don\'t restock.' },
  { keywords: ['coupon', 'discount', 'promo', 'code', 'sale', 'deal', 'offer'], answer: 'Follow us on Instagram (@bullmoney.shop) and join our Telegram for exclusive discount codes and early access to sales. Sign up for our newsletter on the store for automatic welcome discounts!' },
  { keywords: ['contact', 'reach', 'support', 'help', 'talk', 'human', 'agent', 'person', 'real'], answer: 'Here\'s how to reach us:\n\n🔹 Telegram @Bullmoneyshop — Fastest (~15 min)\n🔹 Instagram @bullmoney.shop — (~1-2 hrs)\n🔹 Discord — Open a ticket (~1-6 hrs)\n🔹 X @BULLMONEYFX — (~2-12 hrs)\n\nEvery message gets a personal reply from our team!' },
  { keywords: ['hello', 'hi', 'hey', 'sup', 'yo', 'what\'s up', 'good morning', 'good evening'], answer: 'Hey! 👋 Welcome to BullMoney support. How can I help you today? I can help with orders, shipping, returns, sizing, or anything else about the store!' },
  { keywords: ['thank', 'thanks', 'thx', 'appreciate', 'helpful', 'great'], answer: 'You\'re welcome! Happy to help. If you need anything else, feel free to ask anytime. For urgent matters, Telegram (@Bullmoneyshop) is always the fastest way to reach us! 🔥' },
  { keywords: ['not received', 'missing', 'lost', 'never came', 'didn\'t arrive', 'no package'], answer: 'Sorry about that! First, check your tracking number — if it shows "delivered" but you haven\'t received it, check with neighbours or your building\'s package area. If still missing, contact us within 7 days via Telegram (@Bullmoneyshop) and we\'ll investigate with the carrier and sort it out.' },
  { keywords: ['custom', 'customize', 'personaliz', 'engrav', 'print my'], answer: 'We offer custom options for bulk/team orders. For individual customization, availability varies by product. DM us on Telegram (@Bullmoneyshop) with what you\'re looking for and we\'ll let you know what\'s possible!' },
  { keywords: ['trading', 'forex', 'crypto', 'stocks', 'invest', 'signal', 'course', 'learn'], answer: 'BullMoney is a trading lifestyle brand — we make premium streetwear and accessories for the trading community. While we don\'t provide trading signals or courses directly through the store, check out our main site and community channels for trading content!' },
];

function findBestLocalAnswer(query: string): string {
  const lower = query.toLowerCase().trim();
  
  // Score each knowledge entry
  let bestScore = 0;
  let bestAnswer = '';
  
  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) {
        score += kw.length; // Longer keyword matches = higher score
        // Bonus for exact word match
        const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lower)) score += 3;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestAnswer = entry.answer;
    }
  }
  
  // If decent match found, return it
  if (bestScore >= 4) return bestAnswer;
  
  // Generic helpful fallback
  return `Thanks for reaching out! I want to make sure you get the best help possible.\n\nFor personalized assistance, message us on:\n🔹 Telegram @Bullmoneyshop — Fastest (~15 min)\n🔹 Instagram @bullmoney.shop\n🔹 Discord — Open a support ticket\n\nOr try rephrasing your question and I'll do my best to help! I'm great with shipping, returns, payments, sizing, and order questions.`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastUserMessage = messages?.filter((m: any) => m.role === 'user')?.at(-1)?.content || '';
    
    // Try Groq free API if available (completely free tier, no key needed for small volume)
    // But always have local fallback
    try {
      const groqKey = process.env.GROQ_API_KEY;
      if (groqKey) {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.slice(-6)],
            max_tokens: 300, temperature: 0.7,
          }),
        });
        if (groqRes.ok) {
          const data = await groqRes.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) return NextResponse.json({ reply, source: 'ai' });
        }
      }
    } catch { /* fall through to local */ }
    
    // Smart local fallback — always works, free, no API key needed
    const reply = findBestLocalAnswer(lastUserMessage);
    return NextResponse.json({ reply, source: 'local' });
    
  } catch {
    return NextResponse.json({ reply: 'Hey! Something went wrong on our end. Please try again or DM us directly on Telegram @Bullmoneyshop for immediate help!', source: 'error' }, { status: 200 });
  }
}
