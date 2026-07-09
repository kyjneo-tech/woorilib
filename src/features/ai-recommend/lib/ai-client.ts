export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiProvider {
  chat(messages: Message[]): Promise<string>;
}

export class CanopyWaveProvider implements AiProvider {
  private apiKey = process.env.CANOPY_WAVE_API_KEY;
  private endpoint = 'https://inference.canopywave.io/v1/chat/completions';

  constructor() {
    if (!this.apiKey) {
      console.warn('CANOPY_WAVE_API_KEY is not set');
    }
  }

  async chat(messages: Message[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Canopy Wave API Key가 설정되지 않았습니다.');
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'moonshotai/kimi-k2.6',
          messages,
          temperature: 0.2, // 낮은 값으로 환각 방지 및 결정론적 응답 제고
          response_format: { type: 'json_object' }, // JSON 반환 규격 준수 강제
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Canopy Wave API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Canopy Wave API Error:', error);
      throw error;
    }
  }
}

export const aiProvider = new CanopyWaveProvider();
