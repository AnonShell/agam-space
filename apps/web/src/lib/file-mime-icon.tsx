import { File, FileArchive, FileCode, FileText, Image, Music, Video } from 'lucide-react';

import {
  IconFile,
  IconFileCode,
  IconFileTypePdf,
  IconFileTypeDoc,
  IconFileTypeDocx,
  IconFileTypeXls,
  IconFileTypePpt,
  IconFileTypeZip,
  IconFileTypePng,
  IconFileTypeJpg,
  IconFileTypeTxt,
  IconFileTypeJs,
  IconFileTypeHtml,
  IconFileTypeCss,
  IconFileTypeTs,
  IconFileTypeTsx,
  IconFileTypeXml,
  IconFileTypeCsv,
  IconFileTypePhp,
  IconFileTypeVue,
  IconFileTypeBmp,
  IconFileTypeSvg,
  IconVideo,
  IconMusic,
  IconCamera,
} from '@tabler/icons-react';

export function getFileIcon(mimeType?: string, filename?: string): React.ReactNode {
  const ext = filename ? getExtension(filename) : '';

  if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
    return <Image className="w-5 h-5 text-blue-500" />;
  }

  if (mimeType?.startsWith('video/') || ['mp4', 'mkv', 'webm', 'mov'].includes(ext)) {
    return <Video className="w-5 h-5 text-purple-500" />;
  }

  if (mimeType?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
    return <Music className="w-5 h-5 text-pink-500" />;
  }

  if (mimeType === 'application/zip' || ['zip', 'rar', '7z'].includes(ext)) {
    return <FileArchive className="w-5 h-5 text-orange-500" />;
  }

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return <FileText className="w-5 h-5 text-red-500" />;
  }

  if (
    mimeType?.includes('msword') ||
    mimeType?.includes('wordprocessingml') ||
    ['doc', 'docx'].includes(ext)
  ) {
    return <FileText className="w-5 h-5 text-blue-600" />;
  }

  if (
    mimeType?.includes('excel') ||
    mimeType?.includes('spreadsheetml') ||
    ['xls', 'xlsx'].includes(ext)
  ) {
    return <FileText className="w-5 h-5 text-green-600" />;
  }

  if (
    mimeType?.includes('powerpoint') ||
    mimeType?.includes('presentationml') ||
    ['ppt', 'pptx'].includes(ext)
  ) {
    return <FileText className="w-5 h-5 text-orange-600" />;
  }

  if (
    mimeType?.startsWith('text/') ||
    mimeType?.includes('json') ||
    ['txt', 'md', 'json'].includes(ext)
  ) {
    return <FileCode className="w-5 h-5 text-zinc-500" />;
  }

  return <File className="w-5 h-5 text-zinc-500" />;
}

export function getFileIconV2(mimeType?: string, filename?: string): React.ReactNode {
  const ext = (filename?.split('.').pop() ?? '').toLowerCase();

  const byExt: Record<string, React.ReactNode> = {
    pdf: <IconFileTypePdf className="w-5 h-5 text-red-500" />,
    doc: <IconFileTypeDoc className="w-5 h-5 text-blue-600" />,
    docx: <IconFileTypeDocx className="w-5 h-5 text-blue-600" />,
    xls: <IconFileTypeXls className="w-5 h-5 text-green-600" />,
    ppt: <IconFileTypePpt className="w-5 h-5 text-orange-600" />,
    pptx: <IconFileTypePpt className="w-5 h-5 text-orange-600" />,
    zip: <IconFileTypeZip className="w-5 h-5 text-orange-500" />,
    rar: <IconFileTypeZip className="w-5 h-5 text-orange-500" />,
    '7z': <IconFileTypeZip className="w-5 h-5 text-orange-500" />,
    png: <IconFileTypePng className="w-5 h-5 text-blue-500" />,
    jpg: <IconFileTypeJpg className="w-5 h-5 text-blue-500" />,
    jpeg: <IconFileTypeJpg className="w-5 h-5 text-blue-500" />,
    txt: <IconFileTypeTxt className="w-5 h-5 text-zinc-500" />,
    js: <IconFileTypeJs className="w-5 h-5 text-yellow-500" />,
    jsx: <IconFileTypeJs className="w-5 h-5 text-yellow-500" />,
    ts: <IconFileTypeTs className="w-5 h-5 text-blue-500" />,
    tsx: <IconFileTypeTsx className="w-5 h-5 text-blue-500" />,
    html: <IconFileTypeHtml className="w-5 h-5 text-orange-500" />,
    css: <IconFileTypeCss className="w-5 h-5 text-sky-500" />,
    xml: <IconFileTypeXml className="w-5 h-5 text-indigo-500" />,
    csv: <IconFileTypeCsv className="w-5 h-5 text-green-600" />,
    php: <IconFileTypePhp className="w-5 h-5 text-indigo-600" />,
    vue: <IconFileTypeVue className="w-5 h-5 text-green-500" />,
    bmp: <IconFileTypeBmp className="w-5 h-5 text-blue-500" />,
    svg: <IconFileTypeSvg className="w-5 h-5 text-fuchsia-500" />,
  };

  if (byExt[ext]) return byExt[ext];

  if (mimeType) {
    if (mimeType.startsWith('image/')) return <IconCamera className="w-5 h-5 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <IconVideo className="w-5 h-5 text-purple-600" />;
    if (mimeType.startsWith('audio/')) return <IconMusic className="w-5 h-5 text-pink-500" />;
    if (mimeType.startsWith('text/') || mimeType.includes('json')) {
      return <IconFileCode className="w-5 h-5 text-zinc-500" />;
    }
  }

  return <IconFile className="w-5 h-5 text-zinc-500" />;
}

function getExtension(name: string): string {
  return name?.split('.').pop()?.toLowerCase() || '';
}