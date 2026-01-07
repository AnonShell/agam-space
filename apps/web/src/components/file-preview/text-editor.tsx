'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Lazy load Monaco
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type Props = {
  content: string;
  fileId: string;
  fileName?: string;
  language?: string;
  onSave: (updated: string) => Promise<void>;
};

export function TextFileEditor({ content, fileId, language = 'plaintext', onSave }: Props) {
  const [value, setValue] = useState(content);
  const [original, setOriginal] = useState(content);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isChanged = value !== original;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(value);
      setOriginal(value); // ✅ resets change state
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='flex flex-col h-[90vh] w-full'>
      {/* <div className="flex justify-end px-4 py-1 border-b bg-background">
        <Button
          onClick={handleSave}
          disabled={saving || !isChanged}
          className="w-auto h-8 text-sm"
        >
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
        </Button>
      </div> */}

      <div className='flex-1'>
        <MonacoEditor
          language={language}
          value={value}
          onChange={v => setValue(v ?? '')}
          theme='vs-dark'
          options={{ minimap: { enabled: false }, fontSize: 14 }}
          width='100%'
          height='100%' // ✅ required
        />
      </div>
    </div>
  );
}
