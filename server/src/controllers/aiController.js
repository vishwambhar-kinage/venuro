import { askGemini, executeSemanticRAG, isGeminiReady } from '../services/geminiService.js';
import { RAGService } from '../services/ragService.js';
import { dataStore } from '../models/dataStore.js';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/chat
// Main AI chat endpoint — Gemini 1.5 Flash or Semantic Vector RAG
// ─────────────────────────────────────────────────────────────────────────────
export const chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const trimmedMsg = message.trim();

    // 1. Try Gemini Cloud AI if key configured
    if (isGeminiReady()) {
      const geminiResult = await askGemini(trimmedMsg, { chatHistory: history });
      if (geminiResult && geminiResult.reply) {
        return res.json({
          success: true,
          reply: geminiResult.reply,
          source: 'gemini',
          model: 'gemini-1.5-flash',
          matchedEvents: geminiResult.matchedEvents,
          relevantKnowledge: geminiResult.relevantKnowledge,
        });
      }
    }

    // 2. High-speed Semantic Vector RAG Engine
    const ragResult = executeSemanticRAG(trimmedMsg, req.user);
    return res.json({
      success: true,
      reply: ragResult.reply,
      source: 'semantic-rag-vector',
      model: 'Cosine-TFIDF-Vector-RAG',
      intent: ragResult.intent,
      matchedEvents: ragResult.matchedEvents,
      relevantKnowledge: ragResult.relevantKnowledge,
      suggestedFollowUps: ragResult.suggestedFollowUps,
    });
  } catch (err) {
    console.error('[AI] chat error:', err.message);
    return res.status(500).json({ success: false, message: 'AI service temporarily unavailable.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET or POST /api/ai/semantic-search
// Dedicated Vector Semantic Search endpoint (Interview Demo Feature)
// ─────────────────────────────────────────────────────────────────────────────
export const semanticSearch = async (req, res) => {
  try {
    const query = req.query.q || req.body.query || '';
    if (!query.trim()) {
      return res.status(400).json({ success: false, message: 'Search query is required (e.g. ?q=rock concert in mumbai)' });
    }

    const { topKB, topEvents } = RAGService.retrieveContext(query);
    const queryVector = RAGService.generateEmbedding(query);

    // Compute detailed similarity breakdown for interview demonstration
    const events = dataStore.getAllEvents({ status: 'active' });
    const scoredResults = events.map(evt => {
      const text = `${evt.title} ${evt.category} ${evt.genre?.join(' ')} ${evt.city} ${evt.venueName} ${evt.description}`;
      const evtVector = RAGService.generateEmbedding(text);
      const similarity = RAGService.cosineSimilarity(queryVector, evtVector);
      return {
        event: {
          id: evt._id,
          title: evt.title,
          category: evt.category,
          city: evt.city,
          venueName: evt.venueName,
          rating: evt.rating,
          language: evt.language,
          genre: evt.genre,
        },
        cosineSimilarityScore: parseFloat(similarity.toFixed(4)),
        relevancePercentage: `${Math.min(100, Math.round(similarity * 150))}%`,
      };
    }).sort((a, b) => b.cosineSimilarityScore - a.cosineSimilarityScore);

    return res.json({
      success: true,
      query,
      algorithm: 'Vector Cosine Similarity & TF-IDF Vector Space Model',
      totalAnalyzed: events.length,
      topMatchedEvents: scoredResults.slice(0, 5),
      matchedKnowledgeBase: topKB,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/recommendations
// Returns event recommendations for the homepage
// ─────────────────────────────────────────────────────────────────────────────
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || 'usr_normal_1';
    const recommendations = RAGService.getPersonalizedRecommendations(userId);
    return res.json({
      success: true,
      recommendations,
      count: recommendations.length,
      algorithm: 'Collaborative Category & Interest Weighting',
    });
  } catch (err) {
    const fallback = (dataStore.getAllEvents?.() || []).slice(0, 6);
    return res.json({ success: true, recommendations: fallback, count: fallback.length });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/status
// Returns AI engine telemetry & vector search status
// ─────────────────────────────────────────────────────────────────────────────
export const getAIStatus = (req, res) => {
  return res.json({
    success: true,
    gemini: {
      ready: isGeminiReady(),
      model: isGeminiReady() ? 'gemini-1.5-flash' : null,
    },
    semanticEngine: {
      ready: true,
      vectorEmbeddingDimensions: 'Dynamic Sparse TF-IDF Vector Space',
      similarityMetric: 'Cosine Similarity (Normalized Dot Product)',
      knowledgeBaseDocumentsCount: 5,
      catalogIndexedEventsCount: (dataStore.events || []).length,
    },
    activeEngine: isGeminiReady() ? 'Gemini 1.5 Flash (RAG-Augmented)' : 'Local High-Speed Semantic Vector RAG',
  });
};
