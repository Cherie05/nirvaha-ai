import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import {
  AiProvider,
  ClassificationResult,
  ClassificationEnvelope,
  MATERIAL_CODES,
  flattenEnvelope,
} from './ai-provider.interface';
import { CLASSIFICATION_SYSTEM_INSTRUCTION } from './classification.prompt';

@Injectable()
export class GeminiService implements AiProvider {
  readonly name = 'gemini';
  private readonly logger = new Logger(GeminiService.name);
  private readonly modelName: string;
  private readonly apiKeys: string[];
  private currentKeyIndex = 0;

  constructor(private configService: ConfigService) {
    this.apiKeys = this.configService.get<string[]>('gemini.apiKeys') || [];
    this.modelName =
      this.configService.get<string>('gemini.model') || 'gemini-3.6-flash';

    if (this.apiKeys.length === 0) {
      this.logger.warn('No Gemini API keys found in configuration.');
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKeys.length > 0;
  }

  private getAiInstance(): GoogleGenAI {
    const apiKey = this.apiKeys[this.currentKeyIndex];
    return new GoogleGenAI({ apiKey });
  }

  private rotateKey() {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    this.logger.warn(
      `Rotated to API key index ${this.currentKeyIndex} of ${this.apiKeys.length}`,
    );
  }

  async classify(
    imageBuffer: Buffer,
    mimetype: string,
  ): Promise<ClassificationResult> {
    if (this.apiKeys.length === 0) {
      throw new ServiceUnavailableException(
        'AI not configured — set GEMINI_API_KEY in src/backend/.env',
      );
    }

    // Multi-item: every distinct object in the photo gets its own resin code
    // and quantity. Grammar-constrained so "mixed" is not even expressible.
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              is_recyclable: { type: Type.BOOLEAN },
              item_name: { type: Type.STRING },
              material_type: {
                type: Type.STRING,
                enum: [...MATERIAL_CODES],
              },
              quantity: { type: Type.INTEGER },
              estimated_weight_grams: { type: Type.INTEGER },
              recycling_instructions: { type: Type.STRING },
              confidence: {
                type: Type.STRING,
                enum: ['high', 'medium', 'low'],
              },
              confidence_score: { type: Type.NUMBER },
            },
            required: [
              'is_recyclable',
              'item_name',
              'material_type',
              'quantity',
              'estimated_weight_grams',
              'recycling_instructions',
              'confidence',
              'confidence_score',
            ],
          },
        },
        requires_manual_sorting: { type: Type.BOOLEAN },
      },
      required: ['items', 'requires_manual_sorting'],
    };

    let attempt = 0;
    let lastError: any = null;
    const overallStart = Date.now();
    const totalBudgetMs =
      this.configService.get<number>('gemini.totalBudgetMs') || 45_000;

    while (attempt < this.apiKeys.length) {
      try {
        const ai = this.getAiInstance();

        // Share the remaining budget across the keys still to try, so trying
        // all three can never take longer than the budget allows.
        const remainingKeys = this.apiKeys.length - attempt;
        const remainingBudget = totalBudgetMs - (Date.now() - overallStart);
        const perAttemptMs = Math.max(
          5_000,
          Math.min(25_000, Math.floor(remainingBudget / remainingKeys)),
        );

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), perAttemptMs);

        let response: any;
        try {
          response = await ai.models.generateContent({
            model: this.modelName,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      data: imageBuffer.toString('base64'),
                      mimeType: mimetype,
                    },
                  },
                ],
              },
            ],
            config: {
              systemInstruction: CLASSIFICATION_SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
              responseSchema: responseSchema,
              abortSignal: controller.signal,
            },
          });
        } finally {
          clearTimeout(timeout);
        }

        let jsonText = response.text || '';
        jsonText = jsonText
          .trim()
          .replace(/^```(?:json)?/i, '')
          .replace(/```$/, '')
          .trim();

        const env = JSON.parse(jsonText) as ClassificationEnvelope;
        return flattenEnvelope(env);
      } catch (error: any) {
        lastError = error;
        const keyLabel = `key ${this.currentKeyIndex + 1}/${this.apiKeys.length}`;

        // A malformed body from the model is not the key's fault, but another
        // key may return clean JSON, so it is still worth rotating.
        let reason = 'error';
        if (error.name === 'AbortError') reason = 'timeout';
        else if (error.status === 429 || `${error.message}`.includes('429'))
          reason = 'quota';
        else if (error.status === 404 || `${error.message}`.includes('404'))
          reason = 'model-not-found';
        else if (error.status === 403 || error.status === 401)
          reason = 'key-rejected';
        else if (error instanceof SyntaxError) reason = 'bad-json';

        const remaining = this.apiKeys.length - attempt - 1;
        this.logger.warn(
          `Gemini ${keyLabel} failed (${reason}). ${remaining} key(s) left before Ollama fallback.`,
        );

        this.rotateKey();
        attempt++;

        // Every key is tried, but never at the cost of stalling the phone:
        // three 25s timeouts in series would be 75s. Stop once the budget is
        // spent and let the orchestrator fall back.
        if (Date.now() - overallStart > totalBudgetMs) {
          this.logger.warn(
            `Gemini budget of ${totalBudgetMs}ms exhausted after ${attempt} key(s). Falling back.`,
          );
          break;
        }
      }
    }

    const tried = Math.min(attempt, this.apiKeys.length);
    this.logger.error(
      `All ${tried} Gemini key(s) failed. Last error: ${lastError?.message ?? 'unknown'}`,
    );
    throw new ServiceUnavailableException(
      `AI camera scan failed: all ${tried} Gemini key(s) failed. Falling back to local model.`,
    );
  }
}
