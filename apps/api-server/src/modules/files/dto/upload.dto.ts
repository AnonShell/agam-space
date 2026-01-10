import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class FileUploadStatusDto {
  @ApiProperty({
    description: 'Current upload status',
    example: 'pending',
    enum: ['pending', 'in_progress', 'complete', 'failed'],
  })
  status: string;

  @ApiProperty({
    description: 'Indexes of uploaded chunks',
    example: [0, 1, 2, 3, 4],
  })
  uploadedChunks: number[];
}

export class CompleteFileUploadDto {
  @ApiProperty({
    description: 'File-level checksum (Blake3 hash of concatenated chunk checksums)',
    example: 'a1b2c3d4e5f6...',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Length(64, 64, { message: 'Checksum must be exactly 64 characters (Blake3 hex hash)' })
  checksum: string;
}
