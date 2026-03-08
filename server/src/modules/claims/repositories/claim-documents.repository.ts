import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ClaimDocument } from '@prisma/client';

export interface CreateClaimDocumentData {
  claimId: string;
  originalFilename: string;
  filePath: string;
  fileUrl: string;
  fileSizeBytes: number;
}

@Injectable()
export class ClaimDocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new claim document record
   */
  async create(data: CreateClaimDocumentData): Promise<ClaimDocument> {
    return this.prisma.claimDocument.create({
      data: {
        claimId: data.claimId,
        originalFilename: data.originalFilename,
        filePath: data.filePath,
        fileUrl: data.fileUrl,
        fileSizeBytes: data.fileSizeBytes,
      },
    });
  }

  /**
   * Find document by ID
   */
  async findById(id: string): Promise<ClaimDocument | null> {
    return this.prisma.claimDocument.findUnique({
      where: { id },
    });
  }

  /**
   * Find all documents for a claim
   */
  async findByClaimId(claimId: string): Promise<ClaimDocument[]> {
    return this.prisma.claimDocument.findMany({
      where: { claimId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<ClaimDocument> {
    return this.prisma.claimDocument.delete({
      where: { id },
    });
  }

  /**
   * Count documents for a claim
   */
  async countByClaimId(claimId: string): Promise<number> {
    return this.prisma.claimDocument.count({
      where: { claimId },
    });
  }
}
