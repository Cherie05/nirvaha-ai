import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scan } from './scan.entity';
import { ScanController } from './scan.controller';
import { ScanService } from './scan.service';
import { GeminiService } from './gemini.service';
import { OllamaService } from './ollama.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([Scan]), AuthModule, StorageModule],
  controllers: [ScanController],
  providers: [ScanService, GeminiService, OllamaService, AiOrchestratorService],
  exports: [GeminiService, OllamaService],
})
export class ScanModule {}
