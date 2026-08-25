import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import {
  AiProvider,
  ClassificationResult,
  ClassificationEnvelope,
  DetectedItem,
  MATERIAL_CODES,
  flattenEnvelope,
} from './ai-provider.interface';
import { CLASSIFICATION_SYSTEM_INSTRUCTION } from './classification.prompt';

@Injectable()
export class OllamaService implements AiProvider, OnApplicationBootstrap {
  readonly name = 'ollama';
  private readonly logger = new Logger(OllamaService.name);
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly keepAlive: string;
  private readonly warmup: boolean;
  private readonly maxImagePx: number;

  private isAvailableCache = false;
  private lastAvailableCheck = 0;
  private readonly cacheDurationMs = 30_000;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('ollama.baseUrl')!;
    this.model = this.configService.get<string>('ollama.model')!;
    this.timeoutMs = this.configService.get<number>('ollama.timeoutMs')!;
    this.keepAlive = this.configService.get<string>('ollama.keepAlive')!;
    this.warmup = this.configService.get<boolean>('ollama.warmup')!;
    this.maxImagePx = this.configService.get<number>('ollama.maxImagePx')!;
  }

  async onApplicationBootstrap() {
    if (this.warmup) {
      this.logger.log(`Warming up Ollama model ${this.model}...`);
      try {
        const available = await this.checkAvailability();
        if (available) {
          const startTime = Date.now();
          await this.triggerWarmup();
          this.logger.log(
            `Ollama warm: ${this.model} ready in ${Date.now() - startTime}ms`,
          );
        } else {
          this.logger.warn('Ollama unavailable during warmup phase.');
        }
      } catch (err: any) {
        if (
          err?.cause?.code === 'ECONNREFUSED' ||
          err?.code === 'ECONNREFUSED'
        ) {
          this.logger.warn(
            `Ollama health probe failed with ECONNREFUSED. Note: Ollama by default binds only to 127.0.0.1. To allow Docker to reach it, set OLLAMA_HOST="0.0.0.0:11434" in your system environment variables and fully restart Ollama from the system tray.`,
          );
        } else {
          this.logger.warn(`Failed to warm up Ollama: ${err.message}`);
        }
      }
    }
  }

  private async checkAvailability(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!res.ok) return false;

      const data = await res.json();
      const models = data.models || [];
      return models.some((m: any) => m.name === this.model);
    } catch {
      return false;
    }
  }

  async isAvailable(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastAvailableCheck > this.cacheDurationMs) {
      this.isAvailableCache = await this.checkAvailability();
      this.lastAvailableCheck = now;
    }
    return this.isAvailableCache;
  }

  private async triggerWarmup() {
    // A tiny non-blocking request to load the model into VRAM
    try {
      fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'hello' }],
          keep_alive: this.keepAlive,
        }),
      }).catch(() => {
        /* Fire and forget */
      });
    } catch {
      /* Ignore */
    }
  }

  private async resizeImage(imageBuffer: Buffer): Promise<Buffer> {
    const metadata = await sharp(imageBuffer).metadata();
    if (!metadata.width || !metadata.height) return imageBuffer;

    if (metadata.width > this.maxImagePx || metadata.height > this.maxImagePx) {
      return sharp(imageBuffer)
        .resize({
          width: this.maxImagePx,
          height: this.maxImagePx,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toBuffer();
    }
    return imageBuffer;
  }

  async classify(
    imageBuffer: Buffer,
    mimetype: string,
  ): Promise<ClassificationResult> {
    this.logger.debug(`Classifying image with mimetype: ${mimetype}`);
    const isAvailable = await this.isAvailable();
    if (!isAvailable) {
      throw new ServiceUnavailableException(
        'Ollama service is unreachable or model is missing',
      );
    }

    const resizedBuffer = await this.resizeImage(imageBuffer);
    const base64Image = resizedBuffer.toString('base64');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          stream: false,
          keep_alive: this.keepAlive,
          messages: [
            {
              role: 'user',
              content: CLASSIFICATION_SYSTEM_INSTRUCTION,
              images: [base64Image],
            },
          ],
          format: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    is_recyclable: { type: 'boolean' },
                    item_name: { type: 'string' },
                    material_type: {
                      type: 'string',
                      enum: [...MATERIAL_CODES],
                    },
                    quantity: { type: 'integer' },
                    estimated_weight_grams: { type: 'integer' },
                    recycling_instructions: { type: 'string' },
                    confidence: {
                      type: 'string',
                      enum: ['high', 'medium', 'low'],
                    },
                    confidence_score: { type: 'number' },
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
              requires_manual_sorting: { type: 'boolean' },
            },
            required: ['items', 'requires_manual_sorting'],
          },
          options: { temperature: 0, num_ctx: 4096 },
        }),
      });

      if (!res.ok) {
        throw new ServiceUnavailableException(
          `Ollama returned status ${res.status}`,
        );
      }

      const jsonResponse = await res.json();
      const content = jsonResponse?.message?.content;
      if (!content) {
        throw new UnprocessableEntityException(
          'Ollama returned empty response',
        );
      }

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new UnprocessableEntityException('Ollama returned invalid JSON');
      }

      // Clamp confidence and coerce weights
      let confidence =
        typeof parsed.confidence_score === 'number'
          ? parsed.confidence_score
          : 0;
      if (confidence < 0) confidence = 0;
      if (confidence > 1) confidence = 1;
      if (isNaN(confidence)) confidence = 0;

      let weight =
        typeof parsed.estimated_weight_grams === 'number'
          ? parsed.estimated_weight_grams
          : 0;
      if (weight < 0 || isNaN(weight)) weight = 0;

      let quantity = typeof parsed.quantity === 'number' ? parsed.quantity : 1;
      if (quantity < 0 || isNaN(quantity)) quantity = 1;

      // Small local models return sloppy values, so every field is clamped
      // before it can reach the client.
      const rawItems: any[] = Array.isArray(parsed.items) ? parsed.items : [];
      const items: DetectedItem[] = rawItems.map((it: any) => {
        let score = Number(it?.confidence_score);
        if (!isFinite(score)) score = 0;
        score = Math.min(1, Math.max(0, score));

        let q = Number(it?.quantity);
        if (!isFinite(q) || q < 0) q = 1;

        let w = Number(it?.estimated_weight_grams);
        if (!isFinite(w) || w < 0) w = 0;

        const label = score >= 0.8 ? 'high' : score >= 0.6 ? 'medium' : 'low';

        return {
          is_recyclable: Boolean(it?.is_recyclable),
          item_name: String(it?.item_name || 'Unknown'),
          material_type: MATERIAL_CODES.includes(it?.material_type)
            ? String(it.material_type)
            : 'OTHER 7',
          quantity: Math.round(q),
          estimated_weight_grams: Math.round(w),
          recycling_instructions: String(it?.recycling_instructions || ''),
          confidence: label,
          confidence_score: score,
        };
      });

      const env: ClassificationEnvelope = {
        items,
        requires_manual_sorting: Boolean(parsed.requires_manual_sorting),
      };
      return flattenEnvelope(env);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new ServiceUnavailableException(
          'Ollama classification timed out',
        );
      }
      throw new ServiceUnavailableException(
        `Ollama connection failed: ${error.message}`,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
