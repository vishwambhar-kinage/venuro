import { RAGService, PLATFORM_KNOWLEDGE_BASE } from './ragService.js';

/**
 * Gemini AI Service & RAG Engine — Venuro Platform
 *
 * Provides:
 * 1. Google Gemini 1.5 Flash integration with RAG contextual injection
 * 2. High-speed Vector Semantic Search with Cosine Similarity
 * 3. Domain Knowledge Retrieval & Context Synthesis
 */

let genAI = null;
let flashModel = null;
let geminiReady = false;

// ── Initialize Gemini ─────────────────────────────────────────────────────────
const initGemini = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your_gemini') || apiKey.includes('AIzaSy_')) {
    console.log('⚡ [AI Engine] Running High-Speed Semantic RAG & Vector Engine');
    console.log('     → (Optional) Add GEMINI_API_KEY to server/.env for cloud LLM');
    return;
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    genAI = new GoogleGenerativeAI(apiKey);
    flashModel = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 512,
      },
    });
    geminiReady = true;
    console.log('🤖 [Gemini] Google Gemini 1.5 Flash connected — AI chat active!');
  } catch (err) {
    console.log(`⚠️  [Gemini] Cloud Init failed (${err.message}) — using Semantic RAG engine`);
  }
};

initGemini();

export const isGeminiReady = () => geminiReady;

// ── System Prompt Builder (RAG Augmented) ─────────────────────────────────────
const buildSystemPrompt = (query, contextEvents = [], topKB = []) => {
  const eventList = (contextEvents.length ? contextEvents : [])
    .slice(0, 6)
    .map(e => `• ${e.title} (${e.category?.toUpperCase()}) in ${e.city} at ${e.venueName} | Rating: ⭐ ${e.rating || '4.9'} | Language: ${e.language || 'English/Hindi'}`)
    .join('\n');

  const kbContext = topKB
    .map(k => `[${k.title}]: ${k.content}`)
    .join('\n');

  return `You are Venu 🎟️, the intelligent AI assistant for Venuro — India's premier entertainment reservation platform.

VENURO PLATFORM CONTEXT & KNOWLEDGE:
${kbContext || 'Venuro offers Movies, Concerts, Sports, Live Shows, and VR Experiences.'}

CURRENT TOP RELEVANT EVENTS:
${eventList || 'Explore our live catalog for Dune 2, Coldplay, IPL 2026, Zakir Khan, and more.'}

PRICING & SEATING:
• VIP: Prime recliner seating with concierge (₹1500)
• Premium: Center focal acoustic zone (₹900)
• Standard: High-comfort seating (₹500)
• Economy: Value seating (₹250)

KEY POLICIES:
• Seat Locking: Redis atomic SET NX EX holds seats for 5 minutes during checkout.
• Cancellations: 100% refund if >24h prior, 70% refund if 4-24h prior.
• QR Passes: HMAC-SHA256 cryptographically signed tickets in User Dashboard.
• Payments: UPI, Cards, NetBanking via Razorpay.

RESPONSE GUIDELINES:
1. Provide concise, friendly, and accurate information with markdown formatting.
2. Directly reference relevant events, venue names, and seat tiers from the context.
3. Suggest the next step (e.g. selecting seats, exploring showtimes, or checking passes).`;
};

// ── Ask Gemini with RAG Context ───────────────────────────────────────────────
export const askGemini = async (userMessage, context = {}) => {
  if (!geminiReady || !flashModel) return null;

  const { chatHistory = [] } = context;
  const { topKB, topEvents } = RAGService.retrieveContext(userMessage);

  try {
    const chat = flashModel.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: buildSystemPrompt(userMessage, topEvents, topKB) }],
        },
        {
          role: 'model',
          parts: [{ text: "Hi! I'm Venu 🎟️, your Venuro AI assistant. How can I help you find movies, concerts, sports, or manage your bookings today?" }],
        },
        ...chatHistory.slice(-6).map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        })),
      ],
    });

    const result = await chat.sendMessage(userMessage);
    return {
      reply: result.response.text(),
      matchedEvents: topEvents,
      relevantKnowledge: topKB,
    };
  } catch (err) {
    console.error('[Gemini] Cloud API query failed, falling back to local RAG:', err.message);
    return null;
  }
};

// ── Semantic RAG Engine (High Speed Vector & Intent Matcher) ─────────────────
export const executeSemanticRAG = (message, user = null) => {
  const result = RAGService.askAiAssistant(message, user);
  return {
    reply: result.answer,
    intent: result.intent,
    matchedEvents: result.matchedEvents || [],
    relevantKnowledge: result.relevantKnowledge || [],
    suggestedFollowUps: result.suggestedFollowUps || [],
  };
};
