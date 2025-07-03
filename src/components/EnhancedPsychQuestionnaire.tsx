import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronRight, Sparkles, CheckCircle, User, Users } from 'lucide-react';
import { geminiAI } from '../services/geminiAI';

interface EnhancedPsychQuestionnaireProps {
  userId: string;
  userName: string;
  birthData: any;
  onComplete: (extractedData: Record<string, any>) => void;
}

interface Question {
  id: number;
  text: string;
  tier: 1 | 2 | 3 | 4;
  category: string;
  isDynamic?: boolean;
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

const FOUNDATIONAL_QUESTIONS: Question[] = [
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
  }
];

export function EnhancedPsychQuestionnaire({ userId, userName, birthData, onComplete }: EnhancedPsychQuestionnaireProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>(FOUNDATIONAL_QUESTIONS);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [showConsent, setShowConsent] = useState(true);
  const [allowDataUsage, setAllowDataUsage] = useState(false);
  const [gender, setGender] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / 9) * 100; // Target 9 questions total
  const isComplete = currentQuestionIndex >= questions.length && questions.length >= 9;

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
    
    // Enhanced emotion detection
    const emotionKeywords = {
      joy: ['happy', 'excited', 'love', 'amazing', 'wonderful', 'great', 'fantastic', 'joy', 'delighted', 'thrilled', 'passionate'],
      sadness: ['sad', 'disappointed', 'hurt', 'lonely', 'depressed', 'down', 'melancholy', 'grief', 'loss', 'empty'],
      anger: ['angry', 'frustrated', 'annoyed', 'mad', 'furious', 'irritated', 'rage', 'upset', 'resentful', 'bitter'],
      fear: ['scared', 'worried', 'anxious', 'nervous', 'afraid', 'concerned', 'terrified', 'panic', 'overwhelmed'],
      surprise: ['surprised', 'shocked', 'unexpected', 'amazed', 'wow', 'astonished', 'stunned', 'bewildered'],
      contemplative: ['think', 'reflect', 'consider', 'ponder', 'wonder', 'contemplate', 'introspect', 'analyze', 'understand'],
      confident: ['confident', 'sure', 'certain', 'believe', 'know', 'trust', 'strong', 'capable', 'determined'],
      vulnerable: ['vulnerable', 'uncertain', 'confused', 'lost', 'struggling', 'questioning', 'doubt', 'insecure'],
      neutral: ['okay', 'fine', 'normal', 'usual', 'regular', 'alright', 'standard', 'typical']
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

    // Enhanced tone analysis
    const confidence = Math.min(1, wordCount / 15);
    const energy = words.filter(word => 
      ['very', 'really', 'extremely', 'absolutely', 'totally', 'completely', 'definitely', 'incredibly', 'deeply'].some(energetic => 
        word.includes(energetic)
      )
    ).length / Math.max(wordCount, 1);
    
    const verbosity = Math.min(1, wordCount / 30);
    const hesitation = words.filter(word => 
      ['maybe', 'perhaps', 'think', 'probably', 'might', 'sort', 'kind', 'somewhat', 'possibly', 'guess', 'suppose'].some(hesitant => 
        word.includes(hesitant)
      )
    ).length / Math.max(wordCount, 1);

    // Authenticity based on emotional depth, specificity, and personal language
    const personalPronouns = words.filter(word => ['i', 'me', 'my', 'myself'].includes(word)).length;
    const specificDetails = words.filter(word => word.length > 6).length; // Longer words often indicate specificity
    const emotionalWords = Object.values(emotionKeywords).flat().filter(keyword => 
      words.some(word => word.includes(keyword))
    ).length;
    
    const authenticity = Math.max(0.3, 
      (personalPronouns / Math.max(wordCount, 1)) * 0.3 +
      (specificDetails / Math.max(wordCount, 1)) * 0.3 +
      (emotionalWords / Math.max(wordCount, 1)) * 0.2 +
      (1 - hesitation) * 0.2
    );

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

  const generateNextQuestion = async (currentAnswers: Answer[]) => {
    if (currentAnswers.length < 3) return; // Only start generating after foundational questions
    
    setIsGeneratingQuestion(true);
    
    try {
      const currentTier = Math.min(4, Math.floor(currentAnswers.length / 2) + 1);
      const dynamicQuestion = await geminiAI.generateDynamicQuestion(currentAnswers, currentTier, userName);
      
      const newQuestion: Question = {
        id: questions.length + 1,
        text: dynamicQuestion,
        tier: currentTier as 1 | 2 | 3 | 4,
        category: `dynamic_tier_${currentTier}`,
        isDynamic: true
      };
      
      setQuestions(prev => [...prev, newQuestion]);
    } catch (error) {
      console.error('Failed to generate dynamic question:', error);
      // Add a fallback question
      const fallbackQuestions = [
        "What's a strength you've exaggerated to others?",
        "If your thoughts had a texture today, what would they feel like?",
        "Do you feel more comfortable leading openly, or influencing subtly from the background?"
      ];
      
      const fallbackQuestion: Question = {
        id: questions.length + 1,
        text: fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)],
        tier: 3,
        category: "fallback",
        isDynamic: true
      };
      
      setQuestions(prev => [...prev, fallbackQuestion]);
    } finally {
      setIsGeneratingQuestion(false);
    }
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

    // Generate next question if needed
    if (newAnswers.length < 9 && newAnswers.length >= 3) {
      await generateNextQuestion(newAnswers);
    }

    // Move to next question or complete
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1 && newAnswers.length < 9) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else if (newAnswers.length >= 9) {
        // Generate comprehensive psychological profile
        generateFinalProfile(newAnswers);
      }
      setIsSubmitting(false);
    }, 1000);
  };

  const generateFinalProfile = async (answers: Answer[]) => {
    try {
      const psychProfile = await geminiAI.analyzePsychologicalProfile(answers, userName, birthData);
      
      const extractedData = {
        name: userName,
        gender: gender,
        psych_profile: psychProfile,
        answers: answers,
        data_consent: allowDataUsage,
        session_completed_at: new Date().toISOString(),
        total_questions: answers.length,
        avg_response_time: answers.reduce((sum, a) => sum + a.responseTime, 0) / answers.length,
        total_words: answers.reduce((sum, a) => sum + a.wordCount, 0),
        emotional_journey: answers.map(a => a.emotionDetected),
        authenticity_progression: answers.map(a => a.toneAnalysis.authenticity)
      };
      
      onComplete(extractedData);
    } catch (error) {
      console.error('Failed to generate psychological profile:', error);
      // Fallback to basic profile
      onComplete({
        name: userName,
        gender: gender,
        answers: answers,
        data_consent: allowDataUsage,
        session_completed_at: new Date().toISOString()
      });
    }
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
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">AI-Powered Psychological Assessment</h2>
            <p className="text-white/70 text-sm sm:text-base">
              Our advanced AI will ask you strategic questions to understand your personality patterns and create your cosmic blueprint.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Dynamic Question Generation</p>
                <p className="text-white/60 text-xs">AI adapts questions based on your responses</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Advanced Tone Analysis</p>
                <p className="text-white/60 text-xs">Detects emotion, authenticity, and communication patterns</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Personalized Archetype</p>
                <p className="text-white/60 text-xs">Discover your unique psychological profile with AI insights</p>
              </div>
            </div>
          </div>

          {/* Gender Selection */}
          <div className="mb-6">
            <label className="block text-white font-medium text-sm mb-3">Gender (for personalized insights)</label>
            <div className="flex gap-3">
              {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((option) => (
                <button
                  key={option}
                  onClick={() => setGender(option)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs transition-all ${
                    gender === option
                      ? 'bg-purple-500/80 text-white border border-purple-400'
                      : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                  }`}
                >
                  {option}
                </button>
              ))}
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
              onClick={() => setShowConsent(false)}
              disabled={!gender}
              className={`flex-1 font-semibold py-3 rounded-lg transition-all duration-300 active:scale-95 shadow-lg ${
                gender 
                  ? 'bg-purple-500/80 text-white hover:bg-purple-500' 
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
              }`}
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
          <p className="text-white/70 text-sm sm:text-base">Generating your comprehensive cosmic blueprint...</p>
          <div className="mt-4 bg-white/10 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-xs text-white/60">
              Processed {answers.length} responses • {answers.reduce((sum, a) => sum + a.wordCount, 0)} words analyzed
            </p>
            <p className="text-xs text-white/60 mt-1">
              Integrating psychological patterns with astrological influences
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
            <span>Question {currentQuestionIndex + 1} of 9</span>
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
          <div className="mt-2 flex items-center justify-between text-xs text-white/40">
            <span>Tier {currentQuestion?.tier} • {currentQuestion?.category.replace('_', ' ')}</span>
            {currentQuestion?.isDynamic && (
              <span className="flex items-center gap-1">
                <Sparkles size={12} />
                AI Generated
              </span>
            )}
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion?.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <h2 className="text-lg sm:text-xl font-light text-white mb-4 leading-relaxed">
              {currentQuestion?.text}
            </h2>
          </motion.div>
        </AnimatePresence>

        {/* Loading State for Question Generation */}
        {isGeneratingQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-3 bg-purple-500/20 border border-purple-400/30 rounded-lg"
          >
            <div className="flex items-center gap-2 text-purple-300 text-sm">
              <Sparkles className="animate-spin" size={16} />
              AI is crafting your next question based on your responses...
            </div>
          </motion.div>
        )}

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
            <span>{currentAnswer.length} characters • {currentAnswer.trim().split(/\s+/).filter(w => w.length > 0).length} words</span>
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
                {currentQuestionIndex >= 8 ? 'Complete Assessment' : 'Continue'}
                <ChevronRight size={20} />
              </>
            )}
          </motion.button>
          <p className="text-xs text-white/40 mt-2 text-center">
            Be authentic • There are no wrong answers • AI learns from your patterns
          </p>
        </div>
      </div>
    </motion.div>
  );
}