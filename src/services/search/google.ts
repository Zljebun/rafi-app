const GOOGLE_SEARCH_URL = 'https://customsearch.googleapis.com/customsearch/v1';

interface SearchResult {
  title: string;
  snippet: string;
  link: string;
}

class GoogleSearchService {
  private apiKey: string = '';
  private cx: string = '';

  configure(apiKey: string, cx: string) {
    this.apiKey = apiKey;
    this.cx = cx;
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.cx;
  }

  async search(query: string, numResults: number = 5): Promise<SearchResult[]> {
    if (!this.isConfigured()) {
      throw new Error('Google Search nije podešen. Idi u Postavke.');
    }

    const params = new URLSearchParams({
      key: this.apiKey,
      cx: this.cx,
      q: query,
      num: Math.min(numResults, 10).toString(),
    });

    const response = await fetch(`${GOOGLE_SEARCH_URL}?${params}`);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Google Search ${response.status}: ${errorBody}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    return data.items.map((item: any) => ({
      title: item.title || '',
      snippet: item.snippet || '',
      link: item.link || '',
    }));
  }
}

export const googleSearch = new GoogleSearchService();
