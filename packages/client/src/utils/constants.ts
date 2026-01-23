/**
 * Maximum file size for preview (50MB)
 * Files larger than this will show unsupported preview
 */
export const MAX_PREVIEW_SIZE_BYTES = 50 * 1024 * 1024;

/**
 * Size threshold for large file downloads (50MB)
 * Files larger than this use streaming download instead of blob
 */
export const SIZE_THRESHOLD = 50 * 1024 * 1024;

/**
 * Maximum size for blob fallback (200MB)
 */
export const MAX_BLOB_FALLBACK = 200 * 1024 * 1024;
