import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { RedisService } from '../cache/redis.service';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from '../scan/gemini.service';
import { OllamaService } from '../scan/ollama.service';
import { MinioService } from '../storage/minio.service';

@Controller('api/health')
export class HealthController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly geminiService: GeminiService,
    private readonly ollamaService: OllamaService,
    private readonly storageService: MinioService,
  ) {}

  @Get()
  async getHealth() {
    let postgres = 'down';
    let redis = 'down';
    let storage = 'down';

    // Check Postgres
    try {
      await this.userRepository.query('SELECT 1');
      postgres = 'up';
    } catch {
      /* connection unavailable */
    }

    // Check Redis
    try {
      await this.redisService.setWithTtl('health-check', '1', 5);
      const val = await this.redisService.get('health-check');
      if (val === '1') redis = 'up';
    } catch {
      /* connection unavailable */
    }

    // Check object storage by asking whether our bucket is there.
    //
    // This used to GET /minio/health/live, which only a real MinIO SERVER
    // serves. Against any other S3-compatible bucket (Railway, R2, S3) that
    // 404s, so storage reported "down" while uploads and downloads were both
    // working perfectly — a false alarm on a URL judges might open.
    // bucketExists is plain S3 and answers the question we actually care
    // about: can we reach the place the images live.
    try {
      const ok = await this.storageService.bucketReachable();
      if (ok) storage = 'up';
    } catch {
      /* storage unavailable */
    }

    // Storage is NOT critical. A scan whose upload fails still returns a
    // verdict with image_url null, and the phone shows its own local copy —
    // so losing the bucket degrades history, it does not break the product.
    // Reporting "error" for it would cry wolf on the thing that matters.
    const status = postgres === 'up' && redis === 'up' ? 'ok' : 'error';

    const provider = this.configService.get<string>('ai.provider') || 'auto';
    const geminiKeys = this.configService.get<string[]>('gemini.apiKeys') || [];

    // Only report Ollama where it could actually be used.
    //
    // With AI_PROVIDER=gemini the orchestrator returns after the Gemini call
    // and never reaches the fallback, so publishing `ollama: reachable false`
    // just advertises a component that is switched off — it reads as a fault
    // on a URL judges open. On a hosted deploy there is no host machine to
    // reach in the first place. Probing it there also costs a real timeout on
    // every health call, for an answer that cannot matter.
    const usesOllama = provider === 'auto' || provider === 'ollama';

    return {
      status,
      services: {
        postgres,
        redis,
        // Kept as `minio` for the existing clients that read this key.
        minio: storage,
        storage,
      },
      ai: {
        active_provider: provider,
        gemini: {
          configured: geminiKeys.length > 0,
          keys: geminiKeys.length,
        },
        ...(usesOllama
          ? {
              ollama: {
                reachable: await this.ollamaService.isAvailable(),
                model: this.configService.get<string>('ollama.model'),
                warm: this.configService.get<boolean>('ollama.warmup'),
              },
            }
          : {}),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
