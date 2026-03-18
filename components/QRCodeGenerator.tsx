'use client';

import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Copy, Check } from 'lucide-react';

interface QRCodeGeneratorProps {
  url: string;
  primaryColor?: string;
  logoUrl?: string;
  title?: string;
}

export default function QRCodeGenerator({
  url,
  primaryColor = '#6366f1',
  logoUrl,
  title,
}: QRCodeGeneratorProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;

    // Create high-res version (4x for excellent print quality)
    const scale = 4;
    const size = 220; // match the rendered QR size
    const hiRes = document.createElement('canvas');
    hiRes.width = size * scale;
    hiRes.height = size * scale;
    const ctx = hiRes.getContext('2d');
    if (!ctx) return;

    // Draw the QR canvas scaled up (no background fill)
    ctx.scale(scale, scale);
    ctx.drawImage(canvas, 0, 0, size, size);

    const dataUrl = hiRes.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = `qr-${(title ?? 'encuesta').replace(/\s+/g, '-').toLowerCase()}.png`;
    a.href = dataUrl;
    a.click();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center">
      {/* QR Display */}
      <div
        ref={qrRef}
        className="mb-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
      >
        <QRCodeCanvas
          value={url}
          size={220}
          bgColor="transparent"
          fgColor={primaryColor}
          level="H"
          includeMargin={false}
        />
      </div>

      {/* URL copy bar */}
      <div className="mb-4 flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
        <input
          readOnly
          value={url}
          className="flex-1 truncate bg-transparent text-xs text-slate-600 outline-none"
        />
        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            copied
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
          }`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      {/* Download button */}
      <button
        type="button"
        onClick={handleDownload}
        style={{ backgroundColor: primaryColor }}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
      >
        <Download size={16} />
        Descargar QR
      </button>
    </div>
  );
}
