import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronRight, Sparkles, CheckCircle } from 'lucide-react';

interface PsychologicalQuestionnaireProps {
  userId: string;
  userName: string;
  onComplete: (extractedData: Record<string, any>) => void;
}

interface Question {
  id: number;
  text: string;
  tier: 1 | 2 | 3 | 4;
  category: string;
}

interface Answer {
  questionId: number;
  question: string;
  answer: string;
  responseTime: number;
  wordCount: number;
  emotionDetected: string;
  toneAnalysis: {
    confidence: number;
    energy: number;
    verbosity: number;
    hesitation: number;
    authenticity: number;
  };
}

const PSYCHOLOGICAL_QUESTIONS: Question[] = [
  // Tier 1 - Foundational Questions (Open Context)
  {
    id: 1,
    text: "What's something you care about deeply but rarely talk about?",
    tier: 1,
    category: "core_values"
  },
  {
    id: 2,
    text: "What's a decision you've made that still shapes how you see the world?",
    tier: 1,
    category: "formative_experiences"
  },
  {
    id: 3,
    text: "What gives your life meaning right now?",
    tier: 1,
    category: "purpose_motivation"
  },
  
  // Tier 2 - Contradiction Probes
  {
    id: 4,
    text: "Have you ever claimed something about yourself that you weren't entirely sure was true?",
    tier: 2,
    category: "self_perception"
  },
  {
    id: 5,
    text: "What do people assume about you that isn't entirely wrong, but isn't the whole story either?",
    tier: 2,
    category: "social_perception"
  },
  
  // Tier 3 - Metaphorical, Archetypal Prompts
  {
    id: 6,
    text: "If your thoughts had a texture today, what would they feel like and why?",
    tier: 3,
    category: "emotional_state"
  },
  {
    id: 7,
    text: "If you had to paint your personality in 3 brush strokes, what colors would you choose?",
    tier: 3,
    category: "self_expression"
  },
  
  // Tier 4 - Shadow Traits & Defensive Patterns
  {
    id: 8,
    text: "Is there a part of yourself you show only to gain advantage? What is it?",
    tier: 4,
    category: "shadow_traits"
  },
  {
    id: 9,
    text: "Do you feel more comfortable leading openly, or influencing subtly from the background? Why?",
    tier: 4,
    category: "power_dynamics"
  }
];

export function PsychologicalQuestionnaire({ userId, userName, onComplete }: PsychologicalQuestionnaireProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConsent, setShowConsent] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);
  const [allowDataUsage, setAllowDataUsage] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentQuestion = PSYCHOLOGICAL_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / PSYCHOLOGICAL_QUESTIONS.length) * 100;
  const isComplete = currentQuestionIndex >= PSYCHOLOGICAL_QUESTIONS.length;

  useEffect(() => {
    setStartTime(Date.now());
    setCurrentAnswer('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentQuestionIndex]);

  const analyzeResponse = (text: string) => {
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Emotion detection
    const emotionKeywords = {
      joy: ['happy', 'excited', 'love', 'amazing', 'wonderful', 'great', 'fantastic', 'joy', 'delighted'],
      sadness: ['sad', 'disappointed', 'hurt', 'lonely', 'depressed', 'down', 'melancholy', 'grief'],
      anger: ['angry', 'frustrated', 'annoyed', 'mad', 'furious', 'irritated', 'rage', 'upset'],
      fear: ['scared', 'worried', 'anxious', 'nervous', 'afraid', 'concerned', 'terrified', 'panic'],
      surprise: ['surprised', 'shocked', 'unexpected', 'amazed', 'wow', 'astonished'],
      contemplative: ['think', 'reflect', 'consider', 'ponder', 'wonder', 'contemplate', 'introspect'],
      neutral: ['okay', 'fine', 'normal', 'usual', 'regular', 'alright', 'standard']
    };

    let detectedEmotion = 'neutral';
    let maxMatches = 0;

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const matches = keywords.filter(keyword => 
        words.some(word => word.includes(keyword))
      ).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedEmotion = emotion;
      }
    }

    // Tone analysis
    const confidence = Math.min(1, wordCount / 15);
    const energy = words.filter(word => 
      ['very', 'really', 'extremely', 'absolutely', 'totally', 'completely', 'definitely'].some(energetic => 
        word.includes(energetic)
      )
    ).length / Math.max(wordCount, 1);
    
    const verbosity = Math.min(1, wordCount / 30);
    const hesitation = words.filter(word => 
      ['maybe', 'perhaps', 'think', 'probably', 'might', 'sort', 'kind', 'somewhat', 'possibly'].some(hesitant => 
        word.includes(hesitant)
      )
    ).length / Math.max(wordCount, 1);

    const authenticity = Math.max(0.3, 1 - (hesitation * 0.4) + (confidence * 0.3) - (energy > 0.3 ? 0.1 : 0));

    return {
      emotion: detectedEmotion,
      tone: {
        confidence: Math.round(confidence * 100) / 100,
        energy: Math.round(energy * 100) / 100,
        verbosity: Math.round(verbosity * 100) / 100,
        hesitation: Math.round(hesitation * 100) / 100,
        authenticity: Math.round(Math.max(0, Math.min(1, authenticity)) * 100) / 100
      }
    };
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || !currentQuestion) return;

    setIsSubmitting(true);
    const responseTime = Math.floor((Date.now() - startTime) / 1000);
    const analysis = analyzeResponse(currentAnswer.trim());

    const answer: Answer = {
      questionId: currentQuestion.id,
      question: currentQuestion.text,
      answer: currentAnswer.trim(),
      responseTime,
      wordCount: currentAnswer.trim().split(/\s+/).length,
      emotionDetected: analysis.emotion,
      toneAnalysis: analysis.tone
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    // Move to next question or complete
    setTimeout(() => {
      if (currentQuestionIndex < PSYCHOLOGICAL_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Generate psychological profile
        const extractedData = generatePsychologicalProfile(newAnswers, allowDataUsage);
        onComplete(extractedData);
      }
      setIsSubmitting(false);
    }, 1000);
  };

  const generatePsychologicalProfile = (answers: Answer[], dataConsent: boolean) => {
    // Analyze patterns across all answers
    const totalWords = answers.reduce((sum, answer) => sum + answer.wordCount, 0);
    const avgResponseTime = answers.reduce((sum, answer) => sum + answer.responseTime, 0) / answers.length;
    const avgAuthenticity = answers.reduce((sum, answer) => sum + answer.toneAnalysis.authenticity, 0) / answers.length;
    const avgConfidence = answers.reduce((sum, answer) => sum + answer.toneAnalysis.confidence, 0) / answers.length;
    const avgVerbosity = answers.reduce((sum, answer) => sum + answer.toneAnalysis.verbosity, 0) / answers.length;
    const avgHesitation = answers.reduce((sum, answer) => sum + answer.toneAnalysis.hesitation, 0) / answers.length;

    // Emotion distribution
    const emotions = answers.map(a => a.emotionDetected);
    const emotionCounts = emotions.reduce((acc, emotion) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

    // Determine psychological archetype
    let archetype = 'The Balanced Explorer';
    let motivationalType = 'balanced seeker';
    let communicationMode = 'thoughtful';

    if (avgVerbosity > 0.6 && avgAuthenticity > 0.7) {
      archetype = 'The Reflective Storyteller';
      motivationalType = 'narrative-driven introspector';
      communicationMode = 'expressive and detailed';
    } else if (avgConfidence > 0.7 && avgHesitation < 0.3) {
      archetype = 'The Decisive Visionary';
      motivationalType = 'action-oriented leader';
      communicationMode = 'direct and confident';
    } else if (avgHesitation > 0.4 && avgAuthenticity > 0.6) {
      archetype = 'The Thoughtful Analyst';
      motivationalType = 'careful contemplator';
      communicationMode = 'measured and considerate';
    } else if (dominantEmotion === 'contemplative' || dominantEmotion === 'neutral') {
      archetype = 'The Philosophical Observer';
      motivationalType = 'wisdom-seeking observer';
      communicationMode = 'analytical and reserved';
    }

    // Extract core traits from answers
    const coreTraits = [];
    if (avgAuthenticity > 0.7) coreTraits.push('authentic');
    if (avgVerbosity > 0.5) coreTraits.push('expressive');
    if (avgConfidence > 0.6) coreTraits.push('self-assured');
    if (avgHesitation > 0.4) coreTraits.push('thoughtful');
    if (dominantEmotion === 'contemplative') coreTraits.push('introspective');
    if (totalWords > 200) coreTraits.push('articulate');

    // Shadow traits (areas for growth)
    const shadowTraits = [];
    if (avgHesitation > 0.5) shadowTraits.push('tendency to overthink');
    if (avgConfidence < 0.4) shadowTraits.push('self-doubt patterns');
    if (avgVerbosity < 0.3) shadowTraits.push('communication guardedness');
    if (avgResponseTime > 60) shadowTraits.push('perfectionist tendencies');

    return {
      name: userName,
      psych_profile: {
        archetype,
        core_traits: coreTraits,
        motivational_type: motivationalType,
        shadow_traits: shadowTraits,
        emotion_profile: `${dominantEmotion} dominant with ${avgAuthenticity > 0.7 ? 'high' : 'moderate'} authenticity`,
        honesty_index: avgAuthenticity,
        communication_mode: communicationMode,
        tone_signature: `${avgVerbosity > 0.5 ? 'verbose' : 'concise'}, ${avgConfidence > 0.6 ? 'confident' : 'measured'}`,
        response_patterns: {
          avg_word_count: Math.round(totalWords / answers.length),
          avg_response_time: Math.round(avgResponseTime),
          emotional_range: Object.keys(emotionCounts).length,
          dominant_emotion: dominantEmotion
        }
      },
      answers: answers,
      data_consent: dataConsent,
      session_completed_at: new Date().toISOString()
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && currentAnswer.trim()) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  if (showConsent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full w-full flex items-center justify-center p-4"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8">
          <div className="text-center mb-6">
            <Brain className="mx-auto mb-4 text-purple-400" size={48} />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Psychological Assessment</h2>
            <p className="text-white/70 text-sm sm:text-base">
              We'll ask you 9 thoughtful questions to understand your personality patterns and create your cosmic blueprint.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Deep Psychological Insights</p>
                <p className="text-white/60 text-xs">Questions designed to reveal your authentic self</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Tone & Emotion Analysis</p>
                <p className="text-white/60 text-xs">AI analyzes your communication patterns</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Personalized Archetype</p>
                <p className="text-white/60 text-xs">Discover your unique psychological profile</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-1">
                <input
                  type="checkbox"
                  checked={allowDataUsage}
                  onChange={(e) => setAllowDataUsage(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                  allowDataUsage 
                    ? 'bg-purple-500 border-purple-500' 
                    : 'border-white/30 bg-transparent'
                }`}>
                  {allowDataUsage && (
                    <CheckCircle className="w-3 h-3 text-white absolute top-0.5 left-0.5" size={12} />
                  )}
                </div>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Improve Future Reports</p>
                <p className="text-white/60 text-xs">Allow anonymous use of your responses to enhance our AI psychology system</p>
              </div>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setConsentGiven(true);
                setShowConsent(false);
              }}
              className="flex-1 bg-purple-500/80 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:bg-purple-500 active:scale-95 shadow-lg"
            >
              Begin Assessment
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full w-full flex items-center justify-center text-white p-4"
      >
        <div className="text-center">
          <Sparkles className="animate-spin mx-auto mb-4 text-purple-400" size={48} />
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Assessment Complete!</h2>
          <p className="text-white/70 text-sm sm:text-base">Analyzing your psychological patterns...</p>
          <div className="mt-4 bg-white/10 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-xs text-white/60">
              Processed {answers.length} responses • {answers.reduce((sum, a) => sum + a.wordCount, 0)} words analyzed
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full w-full flex items-center justify-center p-4"
    >
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl p-6 sm:p-8">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-white/60 mb-2">
            <span>Question {currentQuestionIndex + 1} of {PSYCHOLOGICAL_QUESTIONS.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div
              className="bg-purple-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="mt-2 text-xs text-white/40">
            Tier {currentQuestion.tier} • {currentQuestion.category.replace('_', ' ')}
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <h2 className="text-lg sm:text-xl font-light text-white mb-4 leading-relaxed">
              {currentQuestion.text}
            </h2>
          </motion.div>
        </AnimatePresence>

        {/* Answer Input */}
        <div className="mb-6">
          <textarea
            ref={textareaRef}
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Take your time to reflect and share your authentic thoughts..."
            className="w-full h-32 sm:h-40 bg-black/20 border border-white/20 rounded-lg p-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 resize-none text-sm sm:text-base"
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center mt-2 text-xs text-white/40">
            <span>{currentAnswer.length} characters</span>
            <span>Ctrl+Enter to submit</span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col items-center">
          <motion.button
            onClick={handleSubmitAnswer}
            disabled={!currentAnswer.trim() || isSubmitting}
            className={`px-6 sm:px-8 py-3 bg-purple-500/80 text-white font-bold rounded-full transition-all duration-300 shadow-lg backdrop-blur-sm border border-purple-400/50 flex items-center gap-2 text-sm sm:text-base ${
              !currentAnswer.trim() || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
            }`}
            whileHover={currentAnswer.trim() && !isSubmitting ? { scale: 1.05 } : {}}
            whileTap={currentAnswer.trim() && !isSubmitting ? { scale: 0.95 } : {}}
          >
            {isSubmitting ? (
              'Processing...'
            ) : (
              <>
                {currentQuestionIndex === PSYCHOLOGICAL_QUESTIONS.length - 1 ? 'Complete Assessment' : 'Continue'}
                <ChevronRight size={20} />
              </>
            )}
          </motion.button>
          <p className="text-xs text-white/40 mt-2 text-center">
            Take your time • Be authentic • There are no wrong answers
          </p>
        </div>
      </div>
    </motion.div>
  );
}