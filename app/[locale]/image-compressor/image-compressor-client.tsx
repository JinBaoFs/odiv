'use client';

import {ChangeEvent, DragEvent, useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';

type OutputFormat = 'original' | 'image/jpeg' | 'image/webp' | 'image/png';
type ItemStatus = 'waiting' | 'reading' | 'decoding' | 'compressing' | 'done' | 'error';

type ImageItem = {
  id: string;
  file: File;
  sourceUrl: string;
  resultUrl?: string;
  resultBlob?: Blob;
  width?: number;
  height?: number;
  outputWidth?: number;
  outputHeight?: number;
  outputName?: string;
  status: ItemStatus;
  progress: number;
  error?: string;
};

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 30 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = units[0];
  for (let index = 1; value >= 1024 && index < units.length; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${unit}`;
}

function extensionFor(type: string) {
  if (type === 'image/jpeg') return 'jpg';
  if (type === 'image/webp') return 'webp';
  return 'png';
}

function outputFileName(name: string, type: string) {
  const base = name.replace(/\.[^.]+$/, '');
  return `${base}-compressed.${extensionFor(type)}`;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('ENCODE_FAILED')),
      type,
      quality,
    );
  });
}

export function ImageCompressorClient() {
  const t = useTranslations('imageCompressor');
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<ImageItem[]>([]);
  const [items, setItems] = useState<ImageItem[]>([]);
  const [quality, setQuality] = useState(80);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [maxHeight, setMaxHeight] = useState(1920);
  const [format, setFormat] = useState<OutputFormat>('original');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<ImageItem | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => () => {
    itemsRef.current.forEach((item) => {
      URL.revokeObjectURL(item.sourceUrl);
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    });
  }, []);

  const patchItem = (id: string, patch: Partial<ImageItem>) => {
    setItems((current) => current.map((item) => item.id === id ? {...item, ...patch} : item));
  };

  const addFiles = (files: File[]) => {
    setMessage('');
    const existing = new Set(items.map((item) => `${item.file.name}-${item.file.size}-${item.file.lastModified}`));
    const accepted: ImageItem[] = [];
    let rejected = 0;

    files.forEach((file) => {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (!ACCEPTED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE || existing.has(key)) {
        rejected += 1;
        return;
      }
      existing.add(key);
      accepted.push({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        sourceUrl: URL.createObjectURL(file),
        status: 'waiting',
        progress: 0,
      });
    });

    if (accepted.length) setItems((current) => [...current, ...accepted]);
    if (rejected) setMessage(t('errors.rejected', {count: rejected}));
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (!isProcessing) addFiles(Array.from(event.dataTransfer.files));
  };

  const removeItem = (id: string) => {
    setItems((current) => {
      const item = current.find((entry) => entry.id === id);
      if (item) {
        URL.revokeObjectURL(item.sourceUrl);
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      }
      return current.filter((entry) => entry.id !== id);
    });
    if (preview?.id === id) setPreview(null);
  };

  const clearAll = () => {
    items.forEach((item) => {
      URL.revokeObjectURL(item.sourceUrl);
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    });
    setItems([]);
    setPreview(null);
    setMessage('');
  };

  const compressOne = async (item: ImageItem) => {
    try {
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      patchItem(item.id, {status: 'reading', progress: 15, error: undefined, resultBlob: undefined, resultUrl: undefined});
      const source = await createImageBitmap(item.file, {imageOrientation: 'from-image'});
      patchItem(item.id, {status: 'decoding', progress: 35, width: source.width, height: source.height});

      const scale = Math.min(1, maxWidth / source.width, maxHeight / source.height);
      const outputWidth = Math.max(1, Math.round(source.width * scale));
      const outputHeight = Math.max(1, Math.round(source.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('CANVAS_FAILED');

      patchItem(item.id, {status: 'compressing', progress: 65, outputWidth, outputHeight});
      const outputType = format === 'original' ? item.file.type : format;
      if (outputType === 'image/jpeg') {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, outputWidth, outputHeight);
      }
      context.drawImage(source, 0, 0, outputWidth, outputHeight);
      source.close();

      const blob = await canvasToBlob(canvas, outputType, quality / 100);
      const resultUrl = URL.createObjectURL(blob);
      patchItem(item.id, {
        status: 'done',
        progress: 100,
        resultBlob: blob,
        resultUrl,
        outputName: outputFileName(item.file.name, outputType),
      });
    } catch {
      patchItem(item.id, {status: 'error', progress: 100, error: t('errors.compressFailed')});
    }
  };

  const compressAll = async () => {
    if (!items.length || isProcessing) return;
    setIsProcessing(true);
    setMessage('');
    for (const item of items) await compressOne(item);
    setIsProcessing(false);
  };

  const download = (item: ImageItem) => {
    if (!item.resultUrl || !item.outputName) return;
    const link = document.createElement('a');
    link.href = item.resultUrl;
    link.download = item.outputName;
    link.click();
  };

  const downloadAll = () => {
    items.filter((item) => item.status === 'done').forEach((item, index) => {
      window.setTimeout(() => download(item), index * 150);
    });
  };

  const totalProgress = items.length
    ? Math.round(items.reduce((sum, item) => sum + item.progress, 0) / items.length)
    : 0;
  const completedCount = items.filter((item) => item.status === 'done').length;

  return (
    <div className="image-compressor mt-10">
      <section className="compressor-panel settings-panel" aria-labelledby="compressor-settings">
        <div className="section-heading">
          <div>
            <h2 id="compressor-settings">{t('settings.title')}</h2>
            <p>{t('privacy')}</p>
          </div>
          {items.length > 0 && <button type="button" className="text-button" onClick={clearAll} disabled={isProcessing}>{t('actions.clear')}</button>}
        </div>
        <div className="settings-grid">
          <label>{t('settings.quality')}<span>{quality}%</span><input type="range" min="10" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} disabled={isProcessing} /></label>
          <label>{t('settings.maxWidth')}<input className="input" type="number" min="1" value={maxWidth} onChange={(event) => setMaxWidth(Math.max(1, Number(event.target.value)))} disabled={isProcessing} /></label>
          <label>{t('settings.maxHeight')}<input className="input" type="number" min="1" value={maxHeight} onChange={(event) => setMaxHeight(Math.max(1, Number(event.target.value)))} disabled={isProcessing} /></label>
          <label>{t('settings.format')}<select className="input" value={format} onChange={(event) => setFormat(event.target.value as OutputFormat)} disabled={isProcessing}><option value="original">{t('formats.original')}</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option><option value="image/png">PNG</option></select></label>
        </div>
        <p className="format-note">{t('settings.pngNote')}</p>
      </section>

      <div
        className={`drop-zone ${isDragging ? 'is-dragging' : ''}`}
        onDragEnter={(event) => {event.preventDefault(); setIsDragging(true);}}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onInputChange} hidden />
        <div className="upload-mark" aria-hidden="true">+</div>
        <strong>{t('upload.title')}</strong>
        <span>{t('upload.hint')}</span>
        <button type="button" className="button primary" onClick={() => inputRef.current?.click()} disabled={isProcessing}>{t('actions.choose')}</button>
      </div>
      {message && <div className="compressor-message" role="status">{message}</div>}

      {items.length > 0 && (
        <section className="queue-section">
          <div className="queue-toolbar">
            <div><h2>{t('queue.title')}</h2><span>{t('queue.count', {count: items.length})}</span></div>
            <button type="button" className="button primary" onClick={compressAll} disabled={isProcessing}>{isProcessing ? t('actions.compressing') : t('actions.compress')}</button>
          </div>
          <div className="overall-progress">
            <div><span>{t('progress.overall')}</span><span>{completedCount}/{items.length} · {totalProgress}%</span></div>
            <progress max="100" value={totalProgress} aria-label={t('progress.overall')} />
          </div>
          <div className="image-list">
            {items.map((item) => {
              const saving = item.resultBlob ? Math.round((1 - item.resultBlob.size / item.file.size) * 100) : 0;
              return (
                <article className="image-row" key={item.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.resultUrl ?? item.sourceUrl} alt="" />
                  <div className="image-info">
                    <strong title={item.file.name}>{item.file.name}</strong>
                    <span>{formatBytes(item.file.size)}{item.resultBlob ? ` → ${formatBytes(item.resultBlob.size)}` : ''}</span>
                    {(item.width && item.outputWidth) ? <span>{item.width}×{item.height} → {item.outputWidth}×{item.outputHeight}</span> : null}
                    <div className="item-progress"><progress max="100" value={item.progress} aria-label={`${item.file.name} ${t(`status.${item.status}`)}`} /><span>{item.error ?? t(`status.${item.status}`)}</span></div>
                  </div>
                  <div className="row-actions">
                    {item.resultBlob && <span className={saving >= 0 ? 'saving' : 'larger'}>{saving >= 0 ? `-${saving}%` : `+${Math.abs(saving)}%`}</span>}
                    {item.status === 'done' && <button type="button" onClick={() => setPreview(item)}>{t('actions.preview')}</button>}
                    {item.status === 'done' && <button type="button" onClick={() => download(item)}>{t('actions.download')}</button>}
                    <button type="button" onClick={() => removeItem(item.id)} disabled={isProcessing}>{t('actions.remove')}</button>
                  </div>
                </article>
              );
            })}
          </div>
          {completedCount > 1 && <button type="button" className="button download-all" onClick={downloadAll}>{t('actions.downloadAll')}</button>}
        </section>
      )}

      {preview?.resultUrl && (
        <div className="preview-modal" role="dialog" aria-modal="true" aria-label={t('preview.title')} onClick={() => setPreview(null)}>
          <div className="preview-card" onClick={(event) => event.stopPropagation()}>
            <div><strong>{preview.outputName}</strong><button type="button" onClick={() => setPreview(null)} aria-label={t('actions.close')}>×</button></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.resultUrl} alt={preview.outputName ?? ''} />
          </div>
        </div>
      )}
    </div>
  );
}
