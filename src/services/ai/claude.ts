import { RAFI_SYSTEM_PROMPT } from './prompts';
import { tools, handleToolCall } from './tools';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ContentBlock {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

interface ClaudeResponse {
  id: string;
  content: ContentBlock[];
  stop_reason: string;
}

class ClaudeService {
  private apiKey: string;
  private conversationHistory: Message[] = [];

  constructor() {
    this.apiKey = ''; // Set via configure()
  }

  configure(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(userMessage: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('API ključ nije podešen. Idi u Postavke i unesi Claude API key.');
    }

    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    try {
      const response = await this.processWithTools();

      this.conversationHistory.push({
        role: 'assistant',
        content: response,
      });

      return response;
    } catch (error) {
      this.conversationHistory.pop(); // Remove failed message
      throw error;
    }
  }

  private async processWithTools(): Promise<string> {
    let messages = [...this.conversationHistory];
    let iterations = 0;
    const maxIterations = 5; // Prevent infinite tool loops

    while (iterations < maxIterations) {
      iterations++;

      const response = await this.callAPI(messages);

      // Check if Claude wants to use a tool
      const toolUse = response.content.find((c) => c.type === 'tool_use');

      if (!toolUse || !toolUse.name) {
        // No tool call - return the text response
        const textContent = response.content.find((c) => c.type === 'text');
        return textContent?.text || 'Nemam odgovor za to.';
      }

      // Execute the local tool and continue the conversation
      const toolResult = await handleToolCall(
        toolUse.name,
        toolUse.input || {}
      );

      messages = [
        ...messages,
        {
          role: 'assistant' as const,
          content: JSON.stringify(response.content),
        },
        {
          role: 'user' as const,
          content: JSON.stringify([
            {
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(toolResult),
            },
          ]),
        },
      ];
    }

    return 'Izvini, trebalo mi je previše koraka da obradim ovaj zahtjev.';
  }

  private async callAPI(messages: Message[]): Promise<ClaudeResponse> {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: RAFI_SYSTEM_PROMPT,
        tools,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getHistory(): Message[] {
    return [...this.conversationHistory];
  }
}

export const claude = new ClaudeService();
