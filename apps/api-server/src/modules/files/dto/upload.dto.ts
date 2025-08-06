import { ApiProperty } from '@nestjs/swagger';

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
