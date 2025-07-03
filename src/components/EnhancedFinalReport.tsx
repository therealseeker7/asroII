import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Volume2, VolumeX, Play, Pause, Sparkles, Star, Heart, Brain, Zap } from 'lucide-react';
import { geminiAI, type EnhancedReport } from '../services/geminiAI';

interface EnhancedFinalReportProps {
  reportData: EnhancedReport;
  onRestart: () => void;
  onDownloadPDF: () => void;
  onShare: () => void;
}

export function EnhancedFinalReport({ reportData, onRestart, onDownloadPDF, onShare }: EnhancedFinalReportProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [currentSection, setCurrentSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: Star },
    { id: 'psychology', label: 'Psychology', icon: Brain },
    { id: 'astrology', label: 'Astrology', icon: Sparkles },
    { id: 'predictions', label: 'Predictions', icon: Zap },
    { id: 'affirmations', label: 'Affirmations', icon: Heart }
  ];

  const generateVoiceNarration = async () => {
    setIsGeneratingAudio(true);
    try {
      const audioUrl = await geminiAI.generateVoiceNarration(reportData.voice_narration_script);
      setAudioUrl(audioUrl);
    } catch (error) {
      console.error('Failed to generate voice narration:', error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const toggleAudio = () => {
    if (!audioUrl) {
      generateVoiceNarration();
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getZodiacEmoji = (sign: string) => {
    const zodiacEmojis = {
      'Aries': '♈', 'Taurus': '♉', 'Gemini': '♊', 'Cancer': '♋',
      'Leo': '♌', 'Virgo': '♍', 'Libra': '♎', 'Scorpio': '♏',
      'Sagittarius': '♐', 'Capricorn': '♑', 'Aquarius': '♒', 'Pisces': '♓'
    };
    return zodiacEmojis[sign] || '⭐';
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'overview':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-300 bg-clip-text text-transparent mb-4">
                {reportData.user_info.name}'s Cosmic Blueprint
              </h1>
              <div className="flex items-center justify-center gap-4 text-white/60 text-sm">
                <span>{reportData.user_info.birth_day}</span>
                <span>•</span>
                <span>{formatDate(reportData.user_info.dob)}</span>
                <span>•</span>
                <span>{reportData.user_info.age}</span>
              </div>
              <p className="text-white/80 mt-2">{reportData.user_info.birth_place}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
                <Star size={20} />
                Combined Summary
              </h3>
              <p className="text-white/90 leading-relaxed">{reportData.combined_summary}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
                <Sparkles size={20} />
                Zodiac Archetype
              </h3>
              <p className="text-white/90 leading-relaxed">{reportData.zodiac_archetype}</p>
            </div>
          </motion.div>
        );

      case 'psychology':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
                <Brain size={20} />
                Psychological Insights
              </h3>
              <p className="text-white/90 leading-relaxed">{reportData.detailed_psychology}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-purple-300 mb-4">
                How Others See You
              </h3>
              <p className="text-white/90 leading-relaxed">{reportData.personality_overview}</p>
            </div>
          </motion.div>
        );

      case 'astrology':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
                <Sparkles size={20} />
                Astrological Analysis
              </h3>
              <p className="text-white/90 leading-relaxed">{reportData.detailed_astrology}</p>
            </div>
          </motion.div>
        );

      case 'predictions':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
                <Zap size={20} />
                Future Insights
              </h3>
              <div className="space-y-4">
                {reportData.predictions.map((prediction, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                    </div>
                    <p className="text-white/90 leading-relaxed">{prediction}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 'affirmations':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
                <Heart size={20} />
                Personal Affirmations
              </h3>
              <div className="space-y-4">
                {reportData.affirmations.map((affirmation, index) => (
                  <div key={index} className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-400/20">
                    <p className="text-white/90 leading-relaxed italic">"{affirmation}"</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7 }}
      className="h-full w-full flex flex-col max-w-6xl mx-auto p-4 text-white"
    >
      {/* Header with Voice Controls */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-t-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Cosmic Blueprint</h2>
              <p className="text-white/60 text-sm">Generated {new Date(reportData.user_info.report_generated).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAudio}
              disabled={isGeneratingAudio}
              className="p-3 bg-purple-500/20 border border-purple-400/30 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50"
            >
              {isGeneratingAudio ? (
                <Sparkles className="animate-spin" size={20} />
              ) : isPlaying ? (
                <Pause size={20} />
              ) : (
                <Volume2 size={20} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/5 backdrop-blur-xl border-x border-white/10 p-4">
        <div className="flex gap-2 overflow-x-auto">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setCurrentSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  currentSection === section.id
                    ? 'bg-purple-500/80 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <Icon size={16} />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white/5 backdrop-blur-xl border-x border-white/10 p-4 sm:p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {renderSection()}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-b-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <button 
            onClick={onDownloadPDF}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-500/80 text-white font-semibold rounded-full transition-all duration-300 hover:bg-blue-500 shadow-lg hover:scale-105"
          >
            <Download size={18} /> Download PDF
          </button>
          <button 
            onClick={onShare}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-transparent border border-white/30 text-white font-semibold rounded-full transition-all duration-300 hover:bg-white/10 shadow-lg hover:scale-105"
          >
            <Share2 size={18} /> Share Report
          </button>
        </div>
        <div className="mt-4 text-center">
          <button onClick={onRestart} className="text-white/50 hover:text-white transition text-sm">
            Create New Report
          </button>
          <p className="text-xs text-white/40 mt-2">
            Press D to download • S to share • R to restart
          </p>
        </div>
      </div>
    </motion.div>
  );
}