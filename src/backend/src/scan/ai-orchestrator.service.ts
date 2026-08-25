import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from './gemini.service';
import { OllamaService } from './ollama.service';
import { ClassificationResult } from './ai-provider.interface';

export interface OrchestratorResult {
  result: ClassificationResult;
  provider: 'gemini' | 'ollama';
  latencyMs: number;
  fellBack: boolean;
}

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);
  private readonly strategy: 'auto' | 'gemini' | 'ollama';

  constructor(
    private readonly configService: ConfigService,
    private readonly geminiService: GeminiService,
    private readonly ollamaService: OllamaService,
  ) {
    this.strategy =
      this.configService.get<'auto' | 'gemini' | 'ollama'>('ai.provider') ||
      'auto';
  }

  async classify(
    imageBuffer: Buffer,
    mimetype: string,
  ): Promise<OrchestratorResult> {
    const startTime = Date.now();
    let fellBack = false;

    // Fast-path: Forced models
    if (this.strategy === 'gemini') {
      const result = await this.geminiService.classify(imageBuffer, mimetype);
      return {
        result,
        provider: 'gemini',
        latencyMs: Date.now() - startTime,
        fellBack: false,
      };
    }

    if (this.strategy === 'ollama') {
      const result = await this.ollamaService.classify(imageBuffer, mimetype);
      return {
        result,
        provider: 'ollama',
        latencyMs: Date.now() - startTime,
        fellBack: false,
      };
    }

    // Default: 'auto' (Try Gemini, fallback to Ollama on availability failures)
    try {
      const result = await this.geminiService.classify(imageBuffer, mimetype);
      return {
        result,
        provider: 'gemini',
        latencyMs: Date.now() - startTime,
        fellBack: false,
      };
    } catch (error: any) {
      // Propagate client errors (UnprocessableEntity) immediately — do not fallback
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }

      // It's a ServiceUnavailableException or GatewayTimeoutException (Availability error)
      fellBack = true;
      const fallbackReason = error.message;

      this.logger.warn(
        `Gemini unavailable, attempting Ollama fallback. Reason: ${fallbackReason}`,
      );

      try {
        const result = await this.ollamaService.classify(imageBuffer, mimetype);
        const latencyMs = Date.now() - startTime;

        this.logger.log(
          `provider=ollama fellBack=true reason="${fallbackReason}" latency=${latencyMs}ms`,
        );

        return { result, provider: 'ollama', latencyMs, fellBack };
      } catch (ollamaError: any) {
        if (ollamaError instanceof UnprocessableEntityException) {
          throw ollamaError;
        }

        this.logger.error(
          'Both Gemini and Ollama are unavailable',
          ollamaError,
        );
        throw new ServiceUnavailableException(
          'AI unavailable — no Gemini key and Ollama unreachable',
        );
      }
    }
  }
}
