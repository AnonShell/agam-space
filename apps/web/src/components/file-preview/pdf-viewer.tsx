'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

type Props = {
  data: Uint8Array;
};

export function PdfViewer({ data }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.25);
  const [visiblePage, setVisiblePage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const clonedData = useMemo(() => Uint8Array.from(data), [data]);
  const memoFile = useMemo(() => ({ data: clonedData }), [clonedData]);

  // Scroll tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.find(e => e.isIntersecting);
        if (visible?.target) {
          const pageNum = Number(visible.target.getAttribute('data-page'));
          if (pageNum) setVisiblePage(pageNum);
        }
      },
      { root: containerRef.current, threshold: 0.6 }
    );

    const targets = containerRef.current?.querySelectorAll('[data-page]');
    targets?.forEach(t => observer.observe(t));

    return () => observer.disconnect();
  }, [numPages]);

  return (
    <div className='relative flex flex-col w-full h-full'>
      {/* PDF pages */}
      <div ref={containerRef} className='flex-1 overflow-auto'>
        <Document
          file={memoFile}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading='Loading PDF...'
          error='Failed to load PDF'
          className='flex flex-col items-center py-4'
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div key={i} data-page={i + 1} className='mb-4'>
              <Page pageNumber={i + 1} scale={scale} />
            </div>
          ))}
        </Document>
      </div>

      {/* Floating controls at bottom center */}
      <div className='absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2.5 bg-black/70 backdrop-blur-sm rounded-full shadow-lg border border-white/10'>
        <div className='text-sm text-white/90 font-medium'>
          {visiblePage} / {numPages}
        </div>
        <div className='h-4 w-px bg-white/20' />
        <div className='flex items-center gap-2'>
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.25))}
            disabled={scale <= 0.5}
            className='p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            aria-label='Zoom out'
          >
            <ZoomOut className='w-4 h-4' />
          </button>
          <span className='text-xs text-white/70 min-w-[45px] text-center'>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(Math.min(2, scale + 0.25))}
            disabled={scale >= 2}
            className='p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            aria-label='Zoom in'
          >
            <ZoomIn className='w-4 h-4' />
          </button>
        </div>
      </div>
    </div>
  );
}
