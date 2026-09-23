import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { mongo, type Connection, type Model } from 'mongoose';
import type { Readable } from 'node:stream';
import { HealthConditionsService } from '../health-conditions/health-conditions.service.js';
import { HealthEventsService } from '../health-events/health-events.service.js';
import type { CreateMedicalReportDto } from './dto/create-medical-report.dto.js';
import type { UpdateMedicalReportDto } from './dto/update-medical-report.dto.js';
import {
  MAX_REPORT_BYTES,
  MedicalReport,
  type MedicalReportDocument,
  REPORT_MIME_TYPES,
} from './schemas/medical-report.schema.js';

const BUCKET_NAME = 'medicalReportFiles';

// The subset of Multer's file object this module reads — kept local so the
// API doesn't need @types/multer just for four fields.
export interface UploadedReportFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// Sniffs the real type from the leading bytes — the browser-supplied
// mimetype is just a claim, and this is health data we'll serve back inline.
function detectMimeType(buffer: Buffer): (typeof REPORT_MIME_TYPES)[number] | null {
  if (buffer.subarray(0, 4).toString('latin1') === '%PDF') return 'application/pdf';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.subarray(0, 4).toString('latin1') === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

@Injectable()
export class MedicalReportsService {
  private bucketInstance?: mongo.GridFSBucket;

  constructor(
    @InjectModel(MedicalReport.name) private readonly model: Model<MedicalReportDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly healthConditionsService: HealthConditionsService,
    private readonly healthEventsService: HealthEventsService,
  ) {}

  // Built on first use, not in the constructor — `generate:openapi` boots the
  // module graph without a live connection, where connection.db is undefined.
  private get bucket(): mongo.GridFSBucket {
    this.bucketInstance ??= new mongo.GridFSBucket(this.connection.db!, { bucketName: BUCKET_NAME });
    return this.bucketInstance;
  }

  findAllForUser(userId: string) {
    return this.model.find({ userId }).sort({ reportDate: -1, createdAt: -1 }).lean();
  }

  async findOneForUser(userId: string, id: string) {
    const report = await this.model.findOne({ _id: id, userId }).lean();
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  private async assertConditionOwnership(userId: string, conditionId: string | undefined) {
    if (!conditionId) return;
    const owned = await this.healthConditionsService.existsForUser(userId, conditionId);
    if (!owned) throw new BadRequestException('conditionId does not refer to one of your health conditions');
  }

  async create(userId: string, dto: CreateMedicalReportDto, file: UploadedReportFile | undefined) {
    if (!file) throw new BadRequestException('A report file is required');
    if (file.size > MAX_REPORT_BYTES) throw new BadRequestException('Report file must be 15 MB or smaller');
    const mimeType = detectMimeType(file.buffer);
    if (!mimeType) throw new BadRequestException('Report must be a PDF, JPEG, PNG or WebP file');
    await this.assertConditionOwnership(userId, dto.conditionId);

    const fileId = await this.writeFile(file.buffer, file.originalname, mimeType, userId);

    try {
      const created = await this.model.create({
        userId,
        title: dto.title,
        category: dto.category ?? 'other',
        reportDate: new Date(dto.reportDate),
        provider: dto.provider,
        notes: dto.notes,
        conditionId: dto.conditionId,
        file: { fileId: String(fileId), filename: file.originalname, mimeType, size: file.size },
      });
      await this.healthEventsService.log(userId, 'report_uploaded', `${created.title} uploaded`, String(created._id));
      return created.toObject();
    } catch (err) {
      // Don't leave an orphaned blob behind if the metadata write fails.
      await this.bucket.delete(fileId).catch(() => undefined);
      throw err;
    }
  }

  private writeFile(buffer: Buffer, filename: string, contentType: string, userId: string) {
    return new Promise<mongo.ObjectId>((resolve, reject) => {
      const upload = this.bucket.openUploadStream(filename, { metadata: { userId, contentType } });
      upload.once('finish', () => resolve(upload.id));
      upload.once('error', reject);
      upload.end(buffer);
    });
  }

  async update(userId: string, id: string, dto: UpdateMedicalReportDto) {
    const existing = await this.model.findOne({ _id: id, userId });
    if (!existing) throw new NotFoundException('Report not found');
    if (dto.conditionId !== undefined) await this.assertConditionOwnership(userId, dto.conditionId);

    if (dto.title !== undefined) existing.title = dto.title;
    if (dto.category !== undefined) existing.category = dto.category;
    if (dto.reportDate !== undefined) existing.reportDate = new Date(dto.reportDate);
    if (dto.provider !== undefined) existing.provider = dto.provider;
    if (dto.notes !== undefined) existing.notes = dto.notes;
    if (dto.conditionId !== undefined) existing.conditionId = dto.conditionId || undefined;

    await existing.save();
    return existing.toObject();
  }

  async remove(userId: string, id: string) {
    const existing = await this.model.findOne({ _id: id, userId });
    if (!existing) throw new NotFoundException('Report not found');
    await existing.deleteOne();
    await this.bucket.delete(new mongo.ObjectId(existing.file.fileId)).catch(() => undefined);
  }

  async openFile(userId: string, id: string): Promise<{ stream: Readable; filename: string; mimeType: string; size: number }> {
    const report = await this.findOneForUser(userId, id);
    const stream = this.bucket.openDownloadStream(new mongo.ObjectId(report.file.fileId));
    return { stream, ...report.file };
  }
}
