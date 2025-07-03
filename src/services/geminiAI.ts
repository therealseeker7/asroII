const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const GEMINI_TTS_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export interface PsychologicalProfile {
  archetype: {
    name: string;
    description: string;
    inspirational_line: string;
    core_traits: string[];
    shadow_traits: string[];
    seen_by_others: string;
  };
  emotion_signature: string;
  communication_patterns: {
    verbosity: number;
    authenticity: number;
    confidence: number;
    emotional_range: string[];
  };
  motivational_drivers: string[];
  growth_areas: string[];
  predictions: string[];
}

export interface EnhancedReport {
  user_info: {
    name: string;
    dob: string;
    birth_day: string;
    birth_time: string;
    birth_place: string;
    gender: string;
    age: string;
    report_generated: string;
  };
  combined_summary: string;
  detailed_astrology: string;
  detailed_psychology: string;
  personality_overview: string;
  zodiac_archetype: string;
  predictions: string[];
  affirmations: string[];
  voice_narration_script: string;
}

class GeminiAIService {
  private async callGeminiAPI(prompt: string, temperature: number = 0.8): Promise<string> {
    if (!GEMINI_API_KEY) {
      console.warn('Gemini API key not configured, using fallback responses');
      return this.getFallbackResponse(prompt);
    }

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates[0]?.content?.parts[0]?.text || '';
    } catch (error) {
      console.error('Gemini API call failed:', error);
      return this.getFallbackResponse(prompt);
    }
  }

  private getFallbackResponse(prompt: string): string {
    if (prompt.includes('psychological profile')) {
      return JSON.stringify({
        archetype: {
          name: "The Thoughtful Explorer",
          description: "A reflective soul who seeks meaning through deep contemplation and authentic connection.",
          inspirational_line: "Your depth of thought illuminates paths others cannot see.",
          core_traits: ["introspective", "authentic", "empathetic", "curious"],
          shadow_traits: ["overthinking", "self-doubt", "perfectionism"],
          seen_by_others: "wise, mysterious, deeply caring"
        },
        emotion_signature: "contemplative with bursts of passionate insight",
        communication_patterns: {
          verbosity: 0.7,
          authenticity: 0.8,
          confidence: 0.6,
          emotional_range: ["contemplative", "curious", "empathetic"]
        },
        motivational_drivers: ["understanding", "growth", "authentic connection"],
        growth_areas: ["self-compassion", "trusting intuition", "embracing imperfection"],
        predictions: ["A period of significant personal insight approaching", "New opportunities for meaningful connection"]
      });
    }
    return "I appreciate your thoughtful response. Let me reflect on what you've shared...";
  }

  async generateDynamicQuestion(
    previousAnswers: any[],
    currentTier: number,
    userName: string
  ): Promise<string> {
    const prompt = `You are an emotionally intelligent AI psychologist conducting a deep personality assessment.

USER: ${userName}
CURRENT TIER: ${currentTier} (1=foundational, 2=contradiction probes, 3=metaphorical, 4=shadow traits)

PREVIOUS RESPONSES ANALYSIS:
${previousAnswers.map((answer, i) => `
Q${i + 1}: ${answer.question}
A${i + 1}: ${answer.answer}
Emotion: ${answer.emotionDetected}
Authenticity: ${answer.toneAnalysis.authenticity}
Verbosity: ${answer.toneAnalysis.verbosity}
`).join('\n')}

Based on their response patterns, generate ONE strategic follow-up question that:
- Matches Tier ${currentTier} depth (${this.getTierDescription(currentTier)})
- Explores contradictions or hidden aspects revealed in their answers
- Feels natural and conversational, not clinical
- Probes deeper into their psychological patterns
- Uses their own language patterns when possible

Return ONLY the question, no explanation.`;

    const response = await this.callGeminiAPI(prompt, 0.9);
    return response.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
  }

  private getTierDescription(tier: number): string {
    const descriptions = {
      1: "foundational values and experiences",
      2: "contradiction probes and self-perception gaps", 
      3: "metaphorical and archetypal exploration",
      4: "shadow traits and power dynamics"
    };
    return descriptions[tier] || "deep psychological exploration";
  }

  async analyzePsychologicalProfile(
    answers: any[],
    userName: string,
    birthData: any
  ): Promise<PsychologicalProfile> {
    const prompt = `You are an expert psychologist analyzing personality patterns. Create a comprehensive psychological profile.

USER: ${userName}
BIRTH DATA: ${JSON.stringify(birthData)}

RESPONSES ANALYSIS:
${answers.map((answer, i) => `
Question ${i + 1}: ${answer.question}
Answer: ${answer.answer}
Word Count: ${answer.wordCount}
Response Time: ${answer.responseTime}s
Emotion: ${answer.emotionDetected}
Tone Analysis: ${JSON.stringify(answer.toneAnalysis)}
`).join('\n')}

TASK: Create a deep psychological profile that reveals:
1. Core personality archetype (creative, unique name)
2. Authentic traits vs shadow aspects
3. Communication patterns and emotional signature
4. How others perceive them vs their inner reality
5. Motivational drivers and growth areas
6. Future predictions based on psychological patterns

REQUIRED JSON FORMAT:
{
  "archetype": {
    "name": "The [Creative Archetype Name]",
    "description": "2-3 sentence description",
    "inspirational_line": "Poetic, inspiring one-liner",
    "core_traits": ["trait1", "trait2", "trait3", "trait4"],
    "shadow_traits": ["shadow1", "shadow2", "shadow3"],
    "seen_by_others": "How the world perceives them"
  },
  "emotion_signature": "Dominant emotional pattern with nuances",
  "communication_patterns": {
    "verbosity": 0.0-1.0,
    "authenticity": 0.0-1.0,
    "confidence": 0.0-1.0,
    "emotional_range": ["emotion1", "emotion2", "emotion3"]
  },
  "motivational_drivers": ["driver1", "driver2", "driver3"],
  "growth_areas": ["area1", "area2", "area3"],
  "predictions": ["prediction1", "prediction2", "prediction3"]
}

Focus on:
- Specific contradictions revealed in responses
- Unique insights that feel personally crafted
- Poetic but practical language
- Psychological depth without generic descriptions`;

    const response = await this.callGeminiAPI(prompt, 0.7);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse psychological profile:', error);
    }

    // Fallback profile
    return JSON.parse(this.getFallbackResponse('psychological profile'));
  }

  async generateEnhancedReport(
    psychProfile: PsychologicalProfile,
    astrologyData: any,
    userInfo: any
  ): Promise<EnhancedReport> {
    const prompt = `You are a master astro-psychologist creating a comprehensive cosmic blueprint report.

USER INFO: ${JSON.stringify(userInfo)}
PSYCHOLOGICAL PROFILE: ${JSON.stringify(psychProfile)}
ASTROLOGY DATA: ${JSON.stringify(astrologyData)}

Create a comprehensive report that blends psychology and astrology into a cohesive narrative. Write in the voice of a wise, empathetic astrologer who sees both the stars and the soul.

REQUIRED JSON FORMAT:
{
  "combined_summary": "3-4 paragraph summary blending astro + psych insights",
  "detailed_astrology": "Detailed astrological analysis with house positions, aspects, and planetary influences",
  "detailed_psychology": "Deep psychological insights from their response patterns and communication style",
  "personality_overview": "How the world sees them vs their inner reality",
  "zodiac_archetype": "Their dominant astrological archetype and what it means",
  "predictions": ["prediction1", "prediction2", "prediction3", "prediction4"],
  "affirmations": ["affirmation1", "affirmation2", "affirmation3", "affirmation4"],
  "voice_narration_script": "Emotionally resonant script for TTS narration (2-3 minutes when spoken)"
}

TONE: Personal, poetic, wise astrologer guiding a seeker through stars and shadow. Use their name frequently. Make it feel like a personal reading from a trusted guide.

FOCUS ON:
- Integration of psychological patterns with astrological influences
- Specific, personal insights (not generic horoscope language)
- Emotional resonance and validation
- Practical guidance for growth
- Poetic but accessible language
- Future-focused with hope and empowerment`;

    const response = await this.callGeminiAPI(prompt, 0.8);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const reportData = JSON.parse(jsonMatch[0]);
        return {
          user_info: {
            name: userInfo.name,
            dob: userInfo.birthDate,
            birth_day: new Date(userInfo.birthDate).toLocaleDateString('en-US', { weekday: 'long' }),
            birth_time: userInfo.birthTime || 'Unknown',
            birth_place: userInfo.birthPlace,
            gender: userInfo.gender || 'Not specified',
            age: this.calculateAge(userInfo.birthDate),
            report_generated: new Date().toISOString()
          },
          ...reportData
        };
      }
    } catch (error) {
      console.error('Failed to parse enhanced report:', error);
    }

    // Fallback report
    return this.getFallbackReport(userInfo, psychProfile);
  }

  private calculateAge(birthDate: string): string {
    const birth = new Date(birthDate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    return `${years}y ${months >= 0 ? months : months + 12}m`;
  }

  private getFallbackReport(userInfo: any, psychProfile: PsychologicalProfile): EnhancedReport {
    return {
      user_info: {
        name: userInfo.name,
        dob: userInfo.birthDate,
        birth_day: new Date(userInfo.birthDate).toLocaleDateString('en-US', { weekday: 'long' }),
        birth_time: userInfo.birthTime || 'Unknown',
        birth_place: userInfo.birthPlace,
        gender: userInfo.gender || 'Not specified',
        age: this.calculateAge(userInfo.birthDate),
        report_generated: new Date().toISOString()
      },
      combined_summary: `${userInfo.name}, you are a fascinating blend of cosmic influences and psychological depth. Your responses reveal someone who thinks deeply about life while maintaining authentic connections with others. The stars at your birth created a unique blueprint that manifests in your thoughtful approach to relationships and your quest for meaningful experiences.`,
      detailed_astrology: "Your astrological chart reveals a complex personality with strong influences from both your sun and moon signs. The planetary positions at your birth suggest someone who balances logic with intuition, creating a unique perspective on life's challenges and opportunities.",
      detailed_psychology: `Your psychological profile shows ${psychProfile.archetype.name} - ${psychProfile.archetype.description} Your communication patterns reveal ${psychProfile.emotion_signature}, with a natural tendency toward ${psychProfile.motivational_drivers.join(', ')}.`,
      personality_overview: `Others see you as ${psychProfile.archetype.seen_by_others}, while your inner world is rich with ${psychProfile.emotion_signature}. This creates an interesting dynamic between your public persona and private self.`,
      zodiac_archetype: "Your dominant astrological influences create a personality that seeks both stability and growth, making you a natural bridge between different worlds and perspectives.",
      predictions: psychProfile.predictions,
      affirmations: [
        `I trust my unique journey of growth and discovery.`,
        `My authentic self is exactly what the world needs.`,
        `I honor both my strengths and my areas for growth.`,
        `I am worthy of love and belonging exactly as I am.`
      ],
      voice_narration_script: `Welcome, ${userInfo.name}, to your cosmic blueprint. You are ${psychProfile.archetype.name}, and your journey through the stars has led you to this moment of self-discovery. ${psychProfile.archetype.inspirational_line} Your path is unique, marked by ${psychProfile.motivational_drivers.join(', ')}, and illuminated by your natural gifts of ${psychProfile.archetype.core_traits.join(', ')}. Trust in your journey, embrace your authentic self, and know that you are exactly where you need to be.`
    };
  }

  async generateVoiceNarration(script: string): Promise<string | null> {
    // In a real implementation, this would use Gemini's TTS capabilities
    // For now, we'll return a placeholder URL
    console.log('Generating voice narration for script:', script.substring(0, 100) + '...');
    
    // Simulate TTS generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return a mock audio URL (in production, this would be the actual TTS audio)
    return `data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA`;
  }
}

export const geminiAI = new GeminiAIService();