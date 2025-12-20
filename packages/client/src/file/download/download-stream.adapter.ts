// // create-download-writer.ts
// export type DownloadWriter = WritableStreamDefaultWriter<Uint8Array>;
//
// export async function createDownloadWriter(
//   fileName: string
// ): Promise<DownloadWriter> {
//   // 1. File System Access API
//   if ('showSaveFilePicker' in window) {
//     const handle = await (window as any).showSaveFilePicker({
//       suggestedName: fileName,
//     });
//
//     const writable = await handle.createWritable();
//     const stream = new WritableStream<Uint8Array>({
//       async write(chunk) {
//         await writable.write(chunk);
//       },
//       async close() {
//         await writable.close();
//       },
//     });
//
//     return stream.getWriter();
//   }
//
//   // 2. streamSaver fallback (Chromium)
//   // if ('WritableStream' in window && navigator.userAgent.includes('Chrome')) {
//   //   const streamSaver = (await import('streamsaver')).default;
//   //   const fileStream = streamSaver.createWriteStream(fileName);
//   //   return fileStream.getWriter();
//   // }
//
//   // 3. Blob fallback (Firefox/Safari) — not ideal for large files
//   const chunks: Uint8Array[] = [];
//
//   const stream = new WritableStream<Uint8Array>({
//     write(chunk) {
//       chunks.push(chunk);
//     },
//     close() {
//       const blob = new Blob(chunks);
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = fileName;
//       a.click();
//       URL.revokeObjectURL(url);
//     },
//   });
//
//   return stream.getWriter();
// }
