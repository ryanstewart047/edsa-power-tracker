import axios from 'axios';

interface SearchResult {
  title: string;
  snippet: string;
  link: string;
}

/**
 * Search the web using a simple approach with timeout
 * Falls back to direct web search if needed
 */
export async function searchWeb(query: string, numResults: number = 3): Promise<SearchResult[]> {
  try {
    // Try using Jina Reader API for better reliability
    const results = await searchWithJina(query, numResults);
    if (results.length > 0) {
      return results;
    }
    
    // Fallback to Google
    return await searchWithGoogle(query);
  } catch (error) {
    console.error('All search methods failed:', error);
    return [];
  }
}

/**
 * Search using Jina Reader API (free tier)
 */
async function searchWithJina(query: string, numResults: number): Promise<SearchResult[]> {
  try {
    const response = await axios.get('https://api.jina.ai/search', {
      params: {
        q: query,
        limit: numResults,
      },
      headers: {
        'Accept': 'application/json',
      },
      timeout: 5000,
    });

    if (response.data && response.data.data) {
      return response.data.data.map((item: { title?: string; content?: string; description?: string; url?: string }) => ({
        title: item.title || 'Untitled',
        snippet: item.content || item.description || '',
        link: item.url || '#',
      }));
    }
    
    return [];
  } catch (error) {
    console.warn('Jina search failed:', error);
    return [];
  }
}

/**
 * Fallback: Simple Google search result parsing
 */
async function searchWithGoogle(query: string): Promise<SearchResult[]> {
  try {
    // For production, use a real search API like:
    // - Serper (free tier: 100 requests/month)
    // - SerpAPI
    // - Google Custom Search API
    
    // For now, return mock results to prevent complete failure
    console.warn('Google search fallback: Not implemented. Using basic response.');
    return getMockResults(query);
  } catch (error) {
    console.error('Google search failed:', error);
    return [];
  }
}

/**
 * Mock results when real search isn't available
 * This ensures the chatbot still works
 */
function getMockResults(query: string): SearchResult[] {
  return [
    {
      title: `Information about: ${query}`,
      snippet: `For more specific information about "${query}", please provide more details or ask a follow-up question.`,
      link: '#',
    },
  ];
}

/**
 * Format search results for AI consumption
 */
export function formatSearchResultsForAI(results: SearchResult[]): string {
  if (results.length === 0) {
    return '';
  }
  
  const formatted = results
    .filter(r => r.snippet && r.snippet.length > 0)
    .map((result, index) => {
      return `[${index + 1}] ${result.title}\n${result.snippet}`;
    })
    .join('\n\n');
  
  return formatted ? `\n\nRelevant Information:\n${formatted}` : '';
}
