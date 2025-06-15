import OpenAI from "openai";

interface ArticleEnhancement {
  summary: string;
  enhancement: string;
  keyPoints: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
    });
  }

  async enhanceArticle(content: string, title: string): Promise<ArticleEnhancement> {
    try {
      const prompt = `
        Analyze the following news article and provide a comprehensive enhancement in JSON format:

        Title: ${title}
        Content: ${content}

        Please provide:
        1. A concise summary (2-3 sentences)
        2. An enhanced version with additional context and analysis
        3. Key points (3-5 bullet points)
        4. Sentiment analysis (positive, neutral, or negative)

        Respond with JSON in this exact format:
        {
          "summary": "concise summary here",
          "enhancement": "enhanced article with additional context and analysis",
          "keyPoints": ["point 1", "point 2", "point 3"],
          "sentiment": "positive|neutral|negative"
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert news analyst. Provide comprehensive article analysis and enhancement in the requested JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      return {
        summary: result.summary || '',
        enhancement: result.enhancement || '',
        keyPoints: result.keyPoints || [],
        sentiment: result.sentiment || 'neutral',
      };
    } catch (error) {
      console.error('AI enhancement failed:', error);
      throw new Error('Failed to enhance article with AI');
    }
  }

  async summarizeArticle(content: string): Promise<string> {
    try {
      const prompt = `Please summarize the following article concisely in 2-3 sentences, focusing on the main points:\n\n${content}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('AI summarization failed:', error);
      throw new Error('Failed to summarize article with AI');
    }
  }

  async generateReadingInsights(articles: any[]): Promise<{
    trends: string[];
    recommendations: string[];
    topicsOfInterest: string[];
  }> {
    try {
      const articleTitles = articles.map(a => a.title).join('\n');
      
      const prompt = `
        Based on these article titles, analyze reading patterns and provide insights in JSON format:
        
        ${articleTitles}
        
        Provide:
        1. Current trends (3-4 items)
        2. Content recommendations (3-4 items)
        3. Topics of interest (3-4 items)
        
        Respond with JSON:
        {
          "trends": ["trend 1", "trend 2", "trend 3"],
          "recommendations": ["rec 1", "rec 2", "rec 3"],
          "topicsOfInterest": ["topic 1", "topic 2", "topic 3"]
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a content analyst specializing in news consumption patterns."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      return {
        trends: result.trends || [],
        recommendations: result.recommendations || [],
        topicsOfInterest: result.topicsOfInterest || [],
      };
    } catch (error) {
      console.error('AI insights generation failed:', error);
      return {
        trends: [],
        recommendations: [],
        topicsOfInterest: [],
      };
    }
  }
}

export const aiService = new AIService();
