import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scan, ConfidenceLevel } from './scan.entity';
import { MinioService } from '../storage/minio.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { RedisService } from '../cache/redis.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);
  private readonly amberThreshold: number;
  private readonly highThreshold: number;

  constructor(
    @InjectRepository(Scan)
    private scanRepository: Repository<Scan>,
    private minioService: MinioService,
    private aiOrchestrator: AiOrchestratorService,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {
    this.amberThreshold =
      this.configService.get<number>('thresholds.confidenceAmberThreshold') ??
      0.6;
    this.highThreshold =
      this.configService.get<number>('thresholds.confidenceHighThreshold') ??
      0.8;
  }

  async processScan(userId: string, imageBuffer: Buffer, mimetype: string) {
    const startTime = Date.now();

    // Compute MD5
    const md5Hash = crypto.createHash('md5').update(imageBuffer).digest('hex');
    // HIGH 1: key on userId:md5 to prevent cross-user leaks
    const cacheKey = `scan:${userId}:${md5Hash}`;

    // Check Redis
    const cachedDataStr = await this.redisService.get(cacheKey);
    if (cachedDataStr) {
      this.logger.log(
        `Cache hit for ${md5Hash} in ${Date.now() - startTime}ms`,
      );
      const cachedResult = JSON.parse(cachedDataStr);
      cachedResult.cached = true;
      // HIGH 1: re-attach caller's own image_url on cache hit
      const ext = mimetype === 'image/png' ? 'png' : 'jpg';
      const publicUrl = this.configService.get<string>('minio.publicUrl');
      const bucket = this.configService.get<string>('minio.bucket');
      cachedResult.image_url = `${publicUrl}/${bucket}/${userId}/${md5Hash}.${ext}`;
      return cachedResult;
    }

    // HIGH 2: Call AI Orchestrator FIRST, before uploading to MinIO
    const aiResponse = await this.aiOrchestrator.classify(
      imageBuffer,
      mimetype,
    );
    const geminiResult = aiResponse.result;

    // Use specific confidence threshold based on provider
    const ollamaThreshold =
      this.configService.get<number>('ollama.confidenceThreshold') ?? 0.75;
    const isOllama = aiResponse.provider === 'ollama';
    const activeAmberThreshold = isOllama
      ? ollamaThreshold
      : this.amberThreshold;
    const activeHighThreshold = isOllama
      ? Math.min(1.0, ollamaThreshold + 0.15)
      : this.highThreshold;

    const activeModel = isOllama
      ? (this.configService.get<string>('ollama.model') ?? 'qwen2.5vl:3b')
      : (this.configService.get<string>('gemini.model') ?? 'gemini-2.5-flash');

    // MEDIUM 1: read thresholds from config
    const confScore = geminiResult.confidence_score;
    let confidence = ConfidenceLevel.LOW;
    if (confScore >= activeHighThreshold) {
      confidence = ConfidenceLevel.HIGH;
    } else if (confScore >= activeAmberThreshold) {
      confidence = ConfidenceLevel.MEDIUM;
    }

    // HIGH 2: Upload to MinIO only after successful Gemini classification
    let imageUrl: string | null = null;
    try {
      imageUrl = await this.minioService.uploadImage(
        userId,
        imageBuffer,
        mimetype,
        md5Hash,
      );
    } catch (uploadErr) {
      this.logger.error(
        'MinIO upload failed after successful classification, returning result with image_url: null',
        uploadErr,
      );
    }

    // Persist to Postgres
    const scan = this.scanRepository.create({
      userId,
      imageUrl: imageUrl || '',
      imageHash: md5Hash,
      isRecyclable: geminiResult.is_recyclable,
      itemName: geminiResult.item_name,
      materialType: geminiResult.material_type,
      quantity: geminiResult.quantity,
      estimatedWeightGrams: geminiResult.estimated_weight_grams,
      recyclingInstructions: geminiResult.recycling_instructions,
      confidenceScore: confScore,
      confidence,
      items: geminiResult.items ?? null,
      requiresManualSorting: geminiResult.requires_manual_sorting ?? false,
      aiProvider: aiResponse.provider,
      aiModel: activeModel,
    });

    await this.scanRepository.save(scan);

    const responseFormat = {
      // The app keys "already in your bin" off this, so a scan opened again
      // from History cannot be added to the bin a second time.
      id: scan.id,
      is_recyclable: scan.isRecyclable,
      item_name: scan.itemName,
      material_type: scan.materialType,
      quantity: scan.quantity,
      estimated_weight_grams: scan.estimatedWeightGrams,
      recycling_instructions: scan.recyclingInstructions,
      confidence: scan.confidence,
      confidence_score: scan.confidenceScore,
      items: scan.items ?? [],
      requires_manual_sorting: scan.requiresManualSorting ?? false,
      confidence_threshold: activeAmberThreshold,
      ai_provider: scan.aiProvider,
      ai_model: scan.aiModel,
      image_url: imageUrl,
      // MEDIUM 2: include timestamp
      scanned_at: scan.createdAt.toISOString(),
      cached: false,
    };

    // HIGH 1: cache WITHOUT image_url to prevent cross-user leaks
    const cachePayload = { ...responseFormat };
    delete cachePayload.image_url;
    const ttl = this.configService.get<number>('redis.ttl') || 86400;
    await this.redisService.setWithTtl(
      cacheKey,
      JSON.stringify(cachePayload),
      ttl,
    );

    return responseFormat;
  }

  async getUserScans(userId: string, limit: number = 20, offset: number = 0) {
    const scans = await this.scanRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return scans.map((scan) => ({
      id: scan.id,
      is_recyclable: scan.isRecyclable,
      item_name: scan.itemName,
      material_type: scan.materialType,
      quantity: scan.quantity,
      estimated_weight_grams: scan.estimatedWeightGrams,
      recycling_instructions: scan.recyclingInstructions,
      confidence: scan.confidence,
      confidence_score: scan.confidenceScore,
      items: scan.items ?? [],
      requires_manual_sorting: scan.requiresManualSorting ?? false,
      ai_provider: scan.aiProvider,
      ai_model: scan.aiModel,
      image_url: scan.imageUrl,
      // MEDIUM 2: include timestamp so app doesn't show "now" for every scan
      scanned_at: scan.createdAt.toISOString(),
    }));
  }
}
