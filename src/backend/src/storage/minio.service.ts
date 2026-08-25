import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;
  private bucketName: string;
  private readonly logger = new Logger(MinioService.name);

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('minio.bucket')!;
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('minio.endpoint')!,
      port: this.configService.get<number>('minio.port')!,
      useSSL: this.configService.get<boolean>('minio.useSSL')!,
      accessKey: this.configService.get<string>('minio.rootUser')!,
      secretKey: this.configService.get<string>('minio.rootPassword')!,
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName);
        this.logger.log(`Created MinIO bucket: ${this.bucketName}`);
      }

      // HIGH 3: policy applied on EVERY boot, not just on bucket creation
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucketName}/*`],
          },
        ],
      };
      await this.minioClient.setBucketPolicy(
        this.bucketName,
        JSON.stringify(policy),
      );
      this.logger.log(`Bucket policy applied to ${this.bucketName}`);
    } catch (error) {
      this.logger.error('Error initializing MinIO bucket', error);
    }
  }

  /**
   * Can we reach the bucket the images live in?
   *
   * Plain S3, so it answers truthfully against MinIO, Railway, R2 or S3 alike.
   * The old health check hit /minio/health/live, which only a real MinIO
   * server implements — every other provider 404s and looked "down" while
   * working fine.
   */
  async bucketReachable(): Promise<boolean> {
    try {
      return await this.minioClient.bucketExists(this.bucketName);
    } catch {
      return false;
    }
  }

  async uploadImage(
    userId: string,
    imageBuffer: Buffer,
    mimetype: string,
    md5: string,
  ): Promise<string> {
    const extension = mimetype === 'image/png' ? 'png' : 'jpg';
    const objectName = `${userId}/${md5}.${extension}`;

    await this.minioClient.putObject(
      this.bucketName,
      objectName,
      imageBuffer,
      imageBuffer.length,
      {
        'Content-Type': mimetype,
      },
    );

    // Return a RELATIVE path, not an absolute MinIO URL. MinIO listens on
    // :9000 which is not tunnelled, and an absolute localhost URL means
    // nothing on a phone. The client prefixes its own base URL, so stored
    // rows keep working even after the ngrok URL rotates.
    return `/api/images/${objectName}`;
  }

  /** Streams a stored object back out, for the /api/images proxy. */
  async getImageStream(objectName: string) {
    return this.minioClient.getObject(this.bucketName, objectName);
  }

  async statImage(objectName: string) {
    return this.minioClient.statObject(this.bucketName, objectName);
  }
}
