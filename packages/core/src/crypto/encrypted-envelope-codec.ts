import { EncryptedEnvelope, EncryptedEnvelopeSchema } from './types';
import { fromBase64, toBase64 } from '../utils/encoding';
import { validateOrThrow } from '../utils/schema-helper';

export const EncryptedEnvelopeCodec = {
  serialize(env: EncryptedEnvelope): string {
    return toBase64(this.serializeToTLV(env));
  },

  deserialize(encoded: string): EncryptedEnvelope {
    return this.deserializeFromTLV(fromBase64(encoded));
  },

  // each entry is a TLV (Type-Length-Value) structure
  // type: 1 byte, length: 4 bytes, value: variable length
  serializeToTLV(env: EncryptedEnvelope): Uint8Array {

    validateOrThrow(EncryptedEnvelopeSchema, env);

    const entries = [
      { type: 0x01, value: new Uint8Array([env.v]) },
      { type: 0x02, value: env.n },
      { type: 0x03, value: env.c },
    ];

    const totalSize = entries.reduce((sum, { value }) => sum + 1 + 4 + value.length, 0);
    const result = new Uint8Array(totalSize);
    let offset = 0;

    for (const { type, value } of entries) {
      result[offset++] = type;

      const len = value.length;
      result[offset++] = (len >>> 24) & 0xff;
      result[offset++] = (len >>> 16) & 0xff;
      result[offset++] = (len >>> 8) & 0xff;
      result[offset++] = len & 0xff;

      result.set(value, offset);
      offset += len;
    }

    return result;
  },

  // deserializes a TLV-encoded envelope
  // expects a Uint8Array in the format:
  // [type1, len1, value1..., type2, len2, value 2..., ...]
  // where type is 1 byte, length is 4 bytes, and value is variable length
  deserializeFromTLV(buf: Uint8Array): EncryptedEnvelope {
    const result: Record<number, Uint8Array> = {};
    let offset = 0;

    while (offset + 5 <= buf.length) {
      const type = buf[offset++];
      const len =
        (buf[offset++] << 24) | (buf[offset++] << 16) | (buf[offset++] << 8) | buf[offset++];

      if (len < 0 || offset + len > buf.length) {
        throw new Error(`Invalid TLV length for type ${type}`);
      }

      if (result[type]) {
        throw new Error(`Duplicate TLV field type: ${type}`);
      }

      result[type] = buf.slice(offset, offset + len);
      offset += len;
    }

    if (!result[0x01]) throw new Error(`Missing version field`);
    if (!result[0x02]) throw new Error(`Missing nonce field`);
    if (!result[0x03]) throw new Error(`Missing ciphertext field`);

     return EncryptedEnvelopeSchema.parse({
       v: result[0x01][0],
       n: result[0x02],
       c: result[0x03],
     })
  },
};
