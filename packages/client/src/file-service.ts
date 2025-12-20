import { AxiosInstance } from 'axios';
import { Readable } from 'node:stream';

export interface CreateFileRequest {
  nameHash: string;
  metadataEncrypted: string;
  fekWrapped: string;
  parentFolderId?: string;
}

export class FileService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async createFile(data: CreateFileRequest) {
    const response = await this.client.post('/files', data);
    return response.data;
  }

  async uploadFileChunk(fileId: string, chunkIndex: number, stream: Readable, checksum: string) {
    const response = await this.client.put(`/files/${fileId}/chunks/${chunkIndex}`, stream, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Checksum': checksum,
      },
      maxBodyLength: Infinity,
    });
    return response.data;
  }

  async completeFileUpload(fileId: string) {
    const response = await this.client.put(`/files/${fileId}/complete`);
    return response.data;
  }

  async listFiles(folderId?: string) {
    const response = await this.client.get('/files', {
      params: {
        folderId,
      },
    });
    return response.data;
  }

  async downloadFile(fileId: string) {
    const response = await this.client.get(`/files/${fileId}/chunks/0`, {
      responseType: 'stream',
    });
    return {
      stream: response.data,
      fileName: response.headers['content-disposition']?.split('filename=')[1] || 'download',
    };
  }
}
