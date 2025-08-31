/**
 * Content Filtering Service
 * Handles filtering of inappropriate words in posts and comments
 */

export interface FilterResult {
  filteredContent: string;
  wasFiltered: boolean;
  flaggedWords: string[];
  replacements: { original: string; replacement: string }[];
}

export interface FilterWord {
  id: string;
  word: string;
  replacement: string;
  severity: 'mild' | 'moderate' | 'severe';
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentFilterConfig {
  enabled: boolean;
  strictMode: boolean;
  customReplacements: Record<string, string>;
  whitelist: string[];
  categories: string[];
}

class ContentFilterService {
  private defaultFilterWords: Omit<FilterWord, 'id' | 'createdAt' | 'updatedAt'>[] = [
    // Mild profanity
    { word: 'damn', replacement: 'd***', severity: 'mild', category: 'profanity', isActive: true },
    { word: 'hell', replacement: 'h***', severity: 'mild', category: 'profanity', isActive: true },
    { word: 'crap', replacement: 'c***', severity: 'mild', category: 'profanity', isActive: true },
    
    // Moderate profanity
    { word: 'shit', replacement: 's***', severity: 'moderate', category: 'profanity', isActive: true },
    { word: 'bitch', replacement: 'b****', severity: 'moderate', category: 'profanity', isActive: true },
    { word: 'ass', replacement: 'a**', severity: 'moderate', category: 'profanity', isActive: true },
    { word: 'asshole', replacement: 'a******', severity: 'moderate', category: 'profanity', isActive: true },
    
    // Severe profanity
    { word: 'fuck', replacement: 'f***', severity: 'severe', category: 'profanity', isActive: true },
    { word: 'fucking', replacement: 'f******', severity: 'severe', category: 'profanity', isActive: true },
    { word: 'motherfucker', replacement: 'm***********', severity: 'severe', category: 'profanity', isActive: true },
    
    // Hate speech
    { word: 'nigger', replacement: '[REMOVED]', severity: 'severe', category: 'hate-speech', isActive: true },
    { word: 'faggot', replacement: '[REMOVED]', severity: 'severe', category: 'hate-speech', isActive: true },
    { word: 'retard', replacement: '[REMOVED]', severity: 'severe', category: 'hate-speech', isActive: true },
    
    // Spam/inappropriate
    { word: 'viagra', replacement: '[SPAM]', severity: 'moderate', category: 'spam', isActive: true },
    { word: 'casino', replacement: '[SPAM]', severity: 'mild', category: 'spam', isActive: true },
    { word: 'porn', replacement: '[INAPPROPRIATE]', severity: 'moderate', category: 'adult', isActive: true },
  ];

  private config: ContentFilterConfig = {
    enabled: true,
    strictMode: false,
    customReplacements: {},
    whitelist: [],
    categories: ['profanity', 'hate-speech', 'spam', 'adult'],
  };

  private filterWords: FilterWord[] = [];

  constructor() {
    this.initializeFilterWords();
    this.loadConfig();
  }

  /**
   * Initialize filter words with default values
   */
  private initializeFilterWords(): void {
    this.filterWords = this.defaultFilterWords.map((word, index) => ({
      ...word,
      id: `default-${index}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): void {
    try {
      const savedConfig = localStorage.getItem('contentFilterConfig');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }

      const savedWords = localStorage.getItem('contentFilterWords');
      if (savedWords) {
        const customWords = JSON.parse(savedWords);
        this.filterWords = [...this.filterWords, ...customWords];
      }
    } catch (error) {
      console.error('Failed to load content filter config:', error);
    }
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('contentFilterConfig', JSON.stringify(this.config));
      
      // Save only custom words (not default ones)
      const customWords = this.filterWords.filter(word => !word.id.startsWith('default-'));
      localStorage.setItem('contentFilterWords', JSON.stringify(customWords));
    } catch (error) {
      console.error('Failed to save content filter config:', error);
    }
  }

  /**
   * Filter content for inappropriate words
   */
  public filterContent(content: string): FilterResult {
    if (!this.config.enabled || !content) {
      return {
        filteredContent: content,
        wasFiltered: false,
        flaggedWords: [],
        replacements: [],
      };
    }

    let filteredContent = content;
    const flaggedWords: string[] = [];
    const replacements: { original: string; replacement: string }[] = [];

    // Get active filter words
    const activeWords = this.filterWords.filter(word => word.isActive);

    // Apply filtering
    for (const filterWord of activeWords) {
      // Skip if word is in whitelist
      if (this.config.whitelist.includes(filterWord.word.toLowerCase())) {
        continue;
      }

      // Create regex pattern for word matching
      const pattern = this.createWordPattern(filterWord.word);
      const regex = new RegExp(pattern, 'gi');

      // Check if word exists in content
      const matches = filteredContent.match(regex);
      if (matches) {
        // Add to flagged words
        flaggedWords.push(...matches.map(match => match.toLowerCase()));

        // Get replacement text
        const replacement = this.config.customReplacements[filterWord.word.toLowerCase()] 
          || filterWord.replacement;

        // Replace the word
        filteredContent = filteredContent.replace(regex, replacement);

        // Track replacement
        matches.forEach(match => {
          replacements.push({
            original: match,
            replacement: replacement,
          });
        });
      }
    }

    return {
      filteredContent,
      wasFiltered: flaggedWords.length > 0,
      flaggedWords: [...new Set(flaggedWords)], // Remove duplicates
      replacements,
    };
  }

  /**
   * Create regex pattern for word matching
   */
  private createWordPattern(word: string): string {
    // Escape special regex characters
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    if (this.config.strictMode) {
      // Strict mode: match exact word boundaries
      return `\\b${escapedWord}\\b`;
    } else {
      // Lenient mode: match word with common character substitutions
      const pattern = escapedWord
        .replace(/a/gi, '[a@4]')
        .replace(/e/gi, '[e3]')
        .replace(/i/gi, '[i1!]')
        .replace(/o/gi, '[o0]')
        .replace(/s/gi, '[s$5]')
        .replace(/t/gi, '[t7]');
      
      return `\\b${pattern}\\b`;
    }
  }

  /**
   * Add a new filter word
   */
  public addFilterWord(word: Omit<FilterWord, 'id' | 'createdAt' | 'updatedAt'>): FilterWord {
    const newWord: FilterWord = {
      ...word,
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.filterWords.push(newWord);
    this.saveConfig();
    
    return newWord;
  }

  /**
   * Update an existing filter word
   */
  public updateFilterWord(id: string, updates: Partial<Omit<FilterWord, 'id' | 'createdAt'>>): FilterWord | null {
    const wordIndex = this.filterWords.findIndex(word => word.id === id);
    
    if (wordIndex === -1) {
      return null;
    }

    this.filterWords[wordIndex] = {
      ...this.filterWords[wordIndex],
      ...updates,
      updatedAt: new Date(),
    };

    this.saveConfig();
    return this.filterWords[wordIndex];
  }

  /**
   * Remove a filter word
   */
  public removeFilterWord(id: string): boolean {
    // Don't allow removal of default words
    if (id.startsWith('default-')) {
      return false;
    }

    const wordIndex = this.filterWords.findIndex(word => word.id === id);
    
    if (wordIndex === -1) {
      return false;
    }

    this.filterWords.splice(wordIndex, 1);
    this.saveConfig();
    
    return true;
  }

  /**
   * Get all filter words
   */
  public getFilterWords(): FilterWord[] {
    return [...this.filterWords];
  }

  /**
   * Get filter words by category
   */
  public getFilterWordsByCategory(category: string): FilterWord[] {
    return this.filterWords.filter(word => word.category === category);
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<ContentFilterConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  /**
   * Get current configuration
   */
  public getConfig(): ContentFilterConfig {
    return { ...this.config };
  }

  /**
   * Reset to default configuration
   */
  public resetConfig(): void {
    this.config = {
      enabled: true,
      strictMode: false,
      customReplacements: {},
      whitelist: [],
      categories: ['profanity', 'hate-speech', 'spam', 'adult'],
    };
    
    this.initializeFilterWords();
    this.saveConfig();
  }

  /**
   * Test if content would be filtered
   */
  public testContent(content: string): { hasInappropriateContent: boolean; flaggedWords: string[] } {
    const result = this.filterContent(content);
    return {
      hasInappropriateContent: result.wasFiltered,
      flaggedWords: result.flaggedWords,
    };
  }

  /**
   * Get statistics about filtering
   */
  public getStats(): {
    totalWords: number;
    activeWords: number;
    categoryCounts: Record<string, number>;
    severityCounts: Record<string, number>;
  } {
    const activeWords = this.filterWords.filter(word => word.isActive);
    
    const categoryCounts: Record<string, number> = {};
    const severityCounts: Record<string, number> = {};

    activeWords.forEach(word => {
      categoryCounts[word.category] = (categoryCounts[word.category] || 0) + 1;
      severityCounts[word.severity] = (severityCounts[word.severity] || 0) + 1;
    });

    return {
      totalWords: this.filterWords.length,
      activeWords: activeWords.length,
      categoryCounts,
      severityCounts,
    };
  }
}

// Export singleton instance
export const contentFilterService = new ContentFilterService();
export default contentFilterService;