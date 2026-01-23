import { FastifyReply } from 'fastify';
import { Readable } from 'stream';

interface ChunkInfo {
  approxSize: number;
  checksum: string;
}

/**
 * Send a file chunk stream as response with appropriate headers
 */
export async function sendChunkStream(
  response: FastifyReply,
  stream: Readable,
  chunk: ChunkInfo
): Promise<any> {
  response.header('accept-ranges', 'bytes');
  response.header('cache-control', 'no-cache');
  response.header('content-encoding', 'identity');
  response.header('content-type', 'application/octet-stream');

  stream.on('error', err => {
    console.error('Chunk stream error:', err);
  });

  response.header('content-length', chunk.approxSize);
  response.header('x-checksum', chunk.checksum);
  return response.send(stream);
}
