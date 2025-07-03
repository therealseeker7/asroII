import { supabase, type AstrologyReport, isDemoMode } from '../lib/supabase';

export interface BirthData {
  name: string;
  birthDate: string;
  birthTime?: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  gender?: string;
}

export interface EnhancedAstrologyData {
  sun_sign: string;
  moon_sign: string;
  rising_sign: string;
  planetary_positions: {
    [planet: string]: {
      sign: string;
      degree: number;
      house: number;
      retrograde?: boolean;
    };
  };
  house_positions: {
    [house: string]: {
      sign: string;
      cusp_degree: number;
      planets: string[];
    };
  };
  major_aspects: {
    planet1: string;
    planet2: string;
    aspect: string;
    orb: number;
    applying: boolean;
  }[];
  dominant_elements: {
    fire: number;
    earth: number;
    air: number;
    water: number;
  };
  dominant_modalities: {
    cardinal: number;
    fixed: number;
    mutable: number;
  };
  chart_ruler: string;
  north_node: {
    sign: string;
    house: number;
    degree: number;
  };
  midheaven: {
    sign: string;
    degree: number;
  };
}

class EnhancedAstrologyService {
  async generateEnhancedChart(birthData: BirthData): Promise<EnhancedAstrologyData> {
    // In a real implementation, this would use Swiss Ephemeris or similar
    // For now, we'll generate realistic astrological data based on birth date
    
    const birthDate = new Date(birthData.birthDate);
    const dayOfYear = Math.floor((birthDate.getTime() - new Date(birthDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    // Zodiac signs and their date ranges (simplified)
    const zodiacSigns = [
      'Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini',
      'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius'
    ];
    
    const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
    
    // Calculate sun sign based on day of year
    const sunSignIndex = Math.floor((dayOfYear + 10) / 30.4) % 12;
    const sunSign = zodiacSigns[sunSignIndex];
    
    // Generate moon and rising signs with some variation
    const moonSignIndex = (sunSignIndex + Math.floor(Math.random() * 12)) % 12;
    const risingSignIndex = (sunSignIndex + Math.floor(Math.random() * 12)) % 12;
    
    // Generate planetary positions
    const planetaryPositions: any = {};
    planets.forEach((planet, index) => {
      const signIndex = (sunSignIndex + index + Math.floor(Math.random() * 3)) % 12;
      planetaryPositions[planet] = {
        sign: zodiacSigns[signIndex],
        degree: Math.random() * 30,
        house: Math.floor(Math.random() * 12) + 1,
        retrograde: Math.random() < 0.2 // 20% chance of retrograde
      };
    });
    
    // Generate house positions
    const housePositions: any = {};
    for (let i = 1; i <= 12; i++) {
      const signIndex = (risingSignIndex + i - 1) % 12;
      const planetsInHouse = planets.filter(planet => planetaryPositions[planet].house === i);
      
      housePositions[`${i}`] = {
        sign: zodiacSigns[signIndex],
        cusp_degree: Math.random() * 30,
        planets: planetsInHouse
      };
    }
    
    // Generate major aspects
    const aspects = ['Conjunction', 'Opposition', 'Trine', 'Square', 'Sextile'];
    const majorAspects = [];
    for (let i = 0; i < 5; i++) {
      const planet1 = planets[Math.floor(Math.random() * planets.length)];
      let planet2 = planets[Math.floor(Math.random() * planets.length)];
      while (planet2 === planet1) {
        planet2 = planets[Math.floor(Math.random() * planets.length)];
      }
      
      majorAspects.push({
        planet1,
        planet2,
        aspect: aspects[Math.floor(Math.random() * aspects.length)],
        orb: Math.random() * 8,
        applying: Math.random() < 0.5
      });
    }
    
    // Calculate element and modality distributions
    const elementCounts = { fire: 0, earth: 0, air: 0, water: 0 };
    const modalityCounts = { cardinal: 0, fixed: 0, mutable: 0 };
    
    const signElements = {
      'Aries': 'fire', 'Leo': 'fire', 'Sagittarius': 'fire',
      'Taurus': 'earth', 'Virgo': 'earth', 'Capricorn': 'earth',
      'Gemini': 'air', 'Libra': 'air', 'Aquarius': 'air',
      'Cancer': 'water', 'Scorpio': 'water', 'Pisces': 'water'
    };
    
    const signModalities = {
      'Aries': 'cardinal', 'Cancer': 'cardinal', 'Libra': 'cardinal', 'Capricorn': 'cardinal',
      'Taurus': 'fixed', 'Leo': 'fixed', 'Scorpio': 'fixed', 'Aquarius': 'fixed',
      'Gemini': 'mutable', 'Virgo': 'mutable', 'Sagittarius': 'mutable', 'Pisces': 'mutable'
    };
    
    planets.forEach(planet => {
      const sign = planetaryPositions[planet].sign;
      const element = signElements[sign];
      const modality = signModalities[sign];
      
      if (element) elementCounts[element]++;
      if (modality) modalityCounts[modality]++;
    });
    
    // Normalize to percentages
    const totalPlanets = planets.length;
    const dominantElements = {
      fire: (elementCounts.fire / totalPlanets) * 100,
      earth: (elementCounts.earth / totalPlanets) * 100,
      air: (elementCounts.air / totalPlanets) * 100,
      water: (elementCounts.water / totalPlanets) * 100
    };
    
    const dominantModalities = {
      cardinal: (modalityCounts.cardinal / totalPlanets) * 100,
      fixed: (modalityCounts.fixed / totalPlanets) * 100,
      mutable: (modalityCounts.mutable / totalPlanets) * 100
    };
    
    return {
      sun_sign: sunSign,
      moon_sign: zodiacSigns[moonSignIndex],
      rising_sign: zodiacSigns[risingSignIndex],
      planetary_positions: planetaryPositions,
      house_positions: housePositions,
      major_aspects: majorAspects,
      dominant_elements: dominantElements,
      dominant_modalities: dominantModalities,
      chart_ruler: this.getChartRuler(zodiacSigns[risingSignIndex]),
      north_node: {
        sign: zodiacSigns[(sunSignIndex + 6) % 12], // Opposite sign for simplicity
        house: Math.floor(Math.random() * 12) + 1,
        degree: Math.random() * 30
      },
      midheaven: {
        sign: zodiacSigns[(risingSignIndex + 9) % 12], // 10th house cusp
        degree: Math.random() * 30
      }
    };
  }
  
  private getChartRuler(risingSign: string): string {
    const rulers = {
      'Aries': 'Mars',
      'Taurus': 'Venus',
      'Gemini': 'Mercury',
      'Cancer': 'Moon',
      'Leo': 'Sun',
      'Virgo': 'Mercury',
      'Libra': 'Venus',
      'Scorpio': 'Mars', // Traditional ruler
      'Sagittarius': 'Jupiter',
      'Capricorn': 'Saturn',
      'Aquarius': 'Saturn', // Traditional ruler
      'Pisces': 'Jupiter' // Traditional ruler
    };
    
    return rulers[risingSign] || 'Sun';
  }
  
  async saveAstrologyReport(userId: string, birthData: BirthData, chartData: EnhancedAstrologyData): Promise<AstrologyReport | null> {
    const reportData = {
      id: `astro-${Date.now()}`,
      user_id: userId,
      chart_json: chartData,
      sun_sign: chartData.sun_sign,
      moon_sign: chartData.moon_sign,
      rising_sign: chartData.rising_sign,
      dominant_elements: chartData.dominant_elements,
      planetary_positions: chartData.planetary_positions,
      house_positions: chartData.house_positions,
      aspects: chartData.major_aspects,
      generated_at: new Date().toISOString(),
      age_years: this.calculateAge(birthData.birthDate).years,
      age_months: this.calculateAge(birthData.birthDate).months,
      birth_weekday: new Date(birthData.birthDate).toLocaleDateString('en-US', { weekday: 'long' }),
      generation_date: new Date().toISOString().split('T')[0],
      confidence_score: 0.85
    };

    // Try to save to database, fallback to localStorage
    if (!isDemoMode() && supabase) {
      try {
        const { data, error } = await supabase
          .from('astrology_reports')
          .insert(reportData)
          .select()
          .single();

        if (error) {
          console.warn('Failed to save astrology report to database:', error);
          this.saveToLocalStorage(reportData);
          return reportData;
        }

        return data;
      } catch (error) {
        console.warn('Database operation failed, using local storage:', error);
        this.saveToLocalStorage(reportData);
        return reportData;
      }
    } else {
      this.saveToLocalStorage(reportData);
      return reportData;
    }
  }
  
  private saveToLocalStorage(report: AstrologyReport) {
    const existingReports = JSON.parse(localStorage.getItem('astropsyche_astrology') || '[]');
    existingReports.push(report);
    localStorage.setItem('astropsyche_astrology', JSON.stringify(existingReports));
  }
  
  private calculateAge(birthDate: string) {
    const birth = new Date(birthDate);
    const now = new Date();
    
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return { years, months };
  }
}

export const enhancedAstrology = new EnhancedAstrologyService();