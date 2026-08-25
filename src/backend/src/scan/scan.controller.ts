import {
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScanService } from './scan.service';
import { MinioService } from '../storage/minio.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class ScanController {
  constructor(
    private readonly scanService: ScanService,
    private readonly minioService: MinioService,
  ) {}

  /**
   * Serves a stored scan image through the API so it is reachable over the
   * ngrok tunnel. MinIO's own port 9000 is not tunnelled, and an absolute
   * localhost URL is unusable on a phone.
   */
  @Get('images/:userId/:filename')
  @Public()
  async getImage(
    @Param('userId') userId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    // Reject anything that tries to escape the bucket prefix.
    if (
      !/^[\w-]+$/.test(userId) ||
      !/^[\w-]+\.(jpg|png|webp)$/i.test(filename)
    ) {
      throw new NotFoundException('Image not found');
    }
    const objectName = `${userId}/${filename}`;

    try {
      const stat = await this.minioService.statImage(objectName);
      const stream = await this.minioService.getImageStream(objectName);

      res.set({
        'Content-Type':
          (stat.metaData && stat.metaData['content-type']) || 'image/jpeg',
        'Content-Length': String(stat.size),
        'Cache-Control': 'public, max-age=86400',
      });
      stream.pipe(res);
      stream.on('error', () => {
        if (!res.headersSent) res.status(404).end();
      });
    } catch {
      throw new NotFoundException('Image not found');
    }
  }

  @Post('scan')
  @Public()
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        // Some HTTP clients (notably Dart's MultipartFile without an explicit
        // contentType) send application/octet-stream for a perfectly valid
        // JPEG. Rejecting on mimetype alone breaks those clients, so fall back
        // to the filename extension before refusing the upload.
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        const name = (file.originalname || '').toLowerCase();
        const looksLikeImage = /\.(jpe?g|png|webp)$/i.test(name);
        const generic =
          !file.mimetype ||
          file.mimetype === 'application/octet-stream' ||
          file.mimetype === 'application/binary';

        if (allowed.includes(file.mimetype) || (generic && looksLikeImage)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Only JPEG, PNG and WebP images are allowed (received "${file.mimetype}")`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadScan(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    return this.scanService.processScan(
      req.user.id,
      file.buffer,
      file.mimetype,
    );
  }

  @Get('scans')
  @Public()
  async getScans(
    @Req() req: any,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.scanService.getUserScans(req.user.id, limit, offset);
  }
}
