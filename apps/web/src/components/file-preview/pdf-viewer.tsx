'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js'

type Props = {
  data: Uint8Array
}

export function PdfViewer({ data }: Props) {
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1.25)
  const [visiblePage, setVisiblePage] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const clonedData = useMemo(() => Uint8Array.from(data), [data])
  const memoFile = useMemo(() => ({ data: clonedData }), [clonedData])

  // Scroll tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find(e => e.isIntersecting)
        if (visible?.target) {
          const pageNum = Number(visible.target.getAttribute('data-page'))
          if (pageNum) setVisiblePage(pageNum)
        }
      },
      { root: containerRef.current, threshold: 0.6 }
    )

    const targets = containerRef.current?.querySelectorAll('[data-page]')
    targets?.forEach(t => observer.observe(t))

    return () => observer.disconnect()
  }, [numPages])

  const scrollToPage = (n: number) => {
    const el = containerRef.current?.querySelector(`[data-page="${n}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Navigation */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background border-b px-2 py-1">
        <div className="text-sm text-muted-foreground">
          Page {visiblePage} / {numPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => scrollToPage(visiblePage - 1)} disabled={visiblePage <= 1}>
            Prev
          </Button>
          <Button onClick={() => scrollToPage(visiblePage + 1)} disabled={visiblePage >= numPages}>
            Next
          </Button>
          <Slider
            min={0.5}
            max={2}
            step={0.1}
            defaultValue={[scale]}
            onValueChange={([val]) => setScale(val)}
            className="w-[100px]"
          />
        </div>
      </div>

      {/* PDF pages */}
      <div ref={containerRef} className="max-h-[600px] overflow-auto border rounded bg-background p-4">
        <Document
          file={memoFile}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading="Loading PDF..."
          error="Failed to load PDF"
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div
              key={i}
              data-page={i + 1}
              className="flex justify-center py-4 border-b"
            >
              <Page pageNumber={i + 1} scale={scale} />
            </div>
          ))}
        </Document>
      </div>
    </div>
  )
}
