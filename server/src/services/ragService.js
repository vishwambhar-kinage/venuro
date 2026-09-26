import { dataStore } from '../models/dataStore.js';

/**
 * AI-Powered RAG (Retrieval-Augmented Generation) & Vector Search Service
 * Provides natural-language event discovery, contextual Q&A, and personalized recommendations.
 */

// Domain Knowledge Base for Venuro
export const PLATFORM_KNOWLEDGE_BASE = [
  {
    id: 'kb_refund_policy',
    category: 'policies',
    title: 'Cancellation and Refund Policy',
    content: 'Venuro provides flexible tiered cancellations: Cancel >24 hours prior to showtime for a 100% full refund credited to your Venuro Wallet or original payment method. Cancel between 4 to 24 hours prior for a 70% refund. Cancellations made less than 4 hours before showtime are non-refundable. All convenience fees are non-refundable.',
    keywords: ['refund', 'cancel', 'cancellation', 'money back', 'return', 'policy']
  },
  {
    id: 'kb_seat_locking',
    category: 'booking_faq',
    title: 'Real-Time Seat Locking Mechanism',
    content: 'When you select seats on the interactive seat matrix, Venuro uses a Redis distributed lock to hold those seats exclusively for you for 5 minutes (300 seconds). A live countdown timer will display at checkout. If the payment is not completed within 5 minutes, the seats are automatically released for other users.',
    keywords: ['lock', 'timer', 'held', '5 minutes', 'double booking', 'redis', 'reserved']
  },
  {
    id: 'kb_qr_tickets',
    category: 'booking_faq',
    title: 'Digital QR Tickets and Entry Verification',
    content: 'Every confirmed booking generates a tamper-proof cryptographic QR Code ticket. You can download, print, or present the live QR code on your mobile device at the venue gate. Event coordinators scan this code using our coordinator validation scanner for instant paperless admission.',
    keywords: ['qr', 'ticket', 'entry', 'scanner', 'pass', 'gate', 'admit']
  },
  {
    id: 'kb_pricing_tiers',
    category: 'seat_tiers',
    title: 'Seat Tiers & Amenities',
    content: 'Venuro venues feature 4 distinct seating tiers: VIP (Front prime view, plush reclining loungers, complimentary snacks & priority lounge access), Premium (Center rows with optimal audio-visual sweetspot), Standard (Comfortable mid-rear seating), and Economy (Affordable upper-tier value seating).',
    keywords: ['vip', 'premium', 'standard', 'economy', 'tiers', 'pricing', 'seats', 'lounger']
  },
  {
    id: 'kb_venue_general_guidelines',
    category: 'venue_faq',
    title: 'General Venue Guidelines and Prohibited Items',
    content: 'Outside food, beverages, sharp objects, professional DSLR cameras, and recording devices are strictly prohibited across all auditoriums and arenas. Wheelchair-accessible ramps and dedicated companion seating are available at all certified Venuro venues.',
    keywords: ['food', 'camera', 'rules', 'prohibited', 'wheelchair', 'accessible', 'parking', 'entry']
  }
];

export class RAGService {
  /**
   * Generates a normalized semantic term frequency vector for text
   */
  static generateEmbedding(text) {
    if (!text) return {};
    const tokens = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);

    const freq = {};
    tokens.forEach(token => {
      freq[token] = (freq[token] || 0) + 1;
    });

    // Normalize
    const magnitude = Math.sqrt(Object.values(freq).reduce((sum, val) => sum + val * val, 0)) || 1;
    const normalized = {};
    for (const [k, v] of Object.entries(freq)) {
      normalized[k] = v / magnitude;
    }
    return normalized;
  }

  /**
   * Calculates Cosine Similarity between two sparse vectors
   */
  static cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    for (const key in vecA) {
      if (vecB[key]) {
        dotProduct += vecA[key] * vecB[key];
      }
    }
    return dotProduct;
  }

  /**
   * Retrieves relevant knowledge base items & events based on user prompt
   */
  static retrieveContext(query) {
    const queryVector = this.generateEmbedding(query);
    const events = dataStore.getAllEvents({ status: 'active' });

    // 1. Score Knowledge Base Items
    const scoredKB = PLATFORM_KNOWLEDGE_BASE.map(kb => {
      const kbText = `${kb.title} ${kb.content} ${kb.keywords.join(' ')}`;
      const kbVector = this.generateEmbedding(kbText);
      const score = this.cosineSimilarity(queryVector, kbVector);
      return { ...kb, score };
    }).sort((a, b) => b.score - a.score);

    // 2. Score Events
    const scoredEvents = events.map(evt => {
      const eventText = `${evt.title} ${evt.category} ${evt.genre.join(' ')} ${evt.city} ${evt.venueName} ${evt.description} ${evt.language} ${evt.cast.join(' ')}`;
      const evtVector = this.generateEmbedding(eventText);
      let score = this.cosineSimilarity(queryVector, evtVector);

      // Boost score if city or category appears verbatim
      const qLower = query.toLowerCase();
      if (qLower.includes(evt.category.toLowerCase())) score += 0.25;
      if (qLower.includes(evt.city.toLowerCase())) score += 0.25;
      if (evt.genre.some(g => qLower.includes(g.toLowerCase()))) score += 0.2;
      if (qLower.includes(evt.title.toLowerCase())) score += 0.4;

      return { event: evt, score };
    }).sort((a, b) => b.score - a.score);

    return {
      topKB: scoredKB.filter(k => k.score > 0.05).slice(0, 2),
      topEvents: scoredEvents.filter(e => e.score > 0.08).slice(0, 4).map(e => e.event)
    };
  }

  /**
   * Primary AI Assistant entrypoint: Synthesizes intelligent contextual answer
   */
  static async askAiAssistant(query, user = null) {
    const qLower = query.toLowerCase().trim();
    const { topKB, topEvents } = this.retrieveContext(query);

    let answer = '';
    let intent = 'discovery';
    let suggestedFollowUps = [
      'Show me top-rated live concerts',
      'What is your ticket cancellation policy?',
      'Find comedy shows this weekend under ₹1000'
    ];

    // Intent detection
    if (qLower.includes('refund') || qLower.includes('cancel') || qLower.includes('money back')) {
      intent = 'refund_policy';
      const policy = PLATFORM_KNOWLEDGE_BASE.find(k => k.id === 'kb_refund_policy');
      answer = `### 💰 Venuro Refund & Cancellation Policy\n\n${policy.content}\n\n* **> 24 hours prior**: 100% ticket refund.\n* **4 - 24 hours prior**: 70% refund.\n* **< 4 hours prior**: Non-refundable.\n\n*Refunds are processed automatically to your Venuro Wallet or bank account.*`;
      suggestedFollowUps = [
        'How do I cancel my active booking?',
        'How does temporary seat locking work?',
        'Explore trending concerts'
      ];
    } else if (qLower.includes('seat') || qLower.includes('lock') || qLower.includes('timer') || qLower.includes('tier')) {
      intent = 'seat_info';
      const seatKB = PLATFORM_KNOWLEDGE_BASE.find(k => k.id === 'kb_seat_locking');
      const tierKB = PLATFORM_KNOWLEDGE_BASE.find(k => k.id === 'kb_pricing_tiers');
      answer = `### 💺 Venuro Smart Seating & Locking\n\n**Real-Time Lock**: ${seatKB.content}\n\n**Seating Categories**:\n- **VIP**: Luxurious recliner seats with priority concierge.\n- **Premium**: Prime visual and acoustic focal zone.\n- **Standard & Economy**: Great value seating options.`;
      suggestedFollowUps = [
        'What shows are available in Mumbai?',
        'Can outside food be brought to venues?',
        'How do digital QR tickets work?'
      ];
    } else if (qLower.includes('qr') || qLower.includes('ticket') || qLower.includes('scanner') || qLower.includes('entry')) {
      intent = 'ticket_faq';
      const qrKB = PLATFORM_KNOWLEDGE_BASE.find(k => k.id === 'kb_qr_tickets');
      answer = `### 🎟️ Cryptographic QR Tickets\n\n${qrKB.content}\n\nSimply navigate to your **User Dashboard -> My Bookings** to view and download your verified ticket anytime.`;
      suggestedFollowUps = [
        'Show me movies in English & Hindi',
        'What is the refund policy?',
        'Recommend top sports matches'
      ];
    } else if (topEvents.length > 0) {
      intent = 'discovery';
      const eventListStr = topEvents.map(e => `* **${e.title}** (${e.category.toUpperCase()}) - ${e.city} @ ${e.venueName} [Rating: ⭐ ${e.rating}/5]`).join('\n');
      answer = `I found **${topEvents.length} great experiences** matching your query:\n\n${eventListStr}\n\n✨ *Click on any card below to view showtimes, select seats with real-time locks, and book digital tickets!*`;
      suggestedFollowUps = [
        `Tell me more about ${topEvents[0].title}`,
        'What are the ticket prices for VIP seats?',
        'Show me events in Bengaluru'
      ];
    } else {
      intent = 'general';
      const allEvents = dataStore.getAllEvents({ status: 'active' }).slice(0, 3);
      answer = `Welcome to **Venuro AI Assistant**! 🎟️\n\nI can help you discover movies, concerts, live sports, and theater experiences, explain venue rules, check seat locking, and guide you through bookings.\n\nHere are a few popular experiences happening right now:`;
      topEvents.push(...allEvents);
      suggestedFollowUps = [
        'Find rock and pop concerts',
        'What are the latest movie releases?',
        'How do I cancel my tickets?'
      ];
    }

    return {
      answer,
      intent,
      matchedEvents: topEvents,
      relevantKnowledge: topKB,
      suggestedFollowUps
    };
  }

  /**
   * Generates AI personalized recommendations for a user based on history
   */
  static getPersonalizedRecommendations(userId) {
    const user = dataStore.findUserById(userId);
    const userBookings = dataStore.getBookingsForUser(userId);
    const allEvents = dataStore.getAllEvents({ status: 'active' });

    const preferredCategories = new Set(user?.preferences || ['Concerts', 'Movies']);
    userBookings.forEach(b => {
      const evt = dataStore.findEventById(b.eventId);
      if (evt) preferredCategories.add(evt.category);
    });

    const recommended = allEvents.filter(e =>
      Array.from(preferredCategories).some(cat => cat.toLowerCase() === e.category.toLowerCase())
    ).slice(0, 6);

    return recommended.length > 0 ? recommended : allEvents.slice(0, 6);
  }
}
