'use client';

import { useState } from 'react';

export function SubtitleUploader({ episodeId, animeId }: { episodeId: string, animeId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setStatus('Yükleniyor...');

    const formData = new FormData();
    formData.append('subtitle', file);
    formData.append('episodeId', episodeId);
    formData.append('animeId', animeId);

    try {
      const res = await fetch('/api/subtitle/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setStatus('✅ Altyazı başarıyla yüklendi!');
        setFile(null);
      } else {
        const error = await res.json();
        setStatus(`❌ Hata: ${error.message}`);
      }
    } catch (err) {
      setStatus('❌ Yükleme başarısız oldu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-neutral-900 border border-neutral-700 rounded-xl shadow-lg max-w-md">
      <h3 className="text-white font-bold text-lg mb-4">Altyazı Yükle</h3>
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <input
            type="file"
            accept=".srt,.vtt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-neutral-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-red-600 file:text-white
              hover:file:bg-red-700 transition-all cursor-pointer"
          />
          <p className="text-xs text-neutral-500 mt-2">Sadece .srt veya .vtt formatı desteklenir.</p>
        </div>
        
        <button
          type="submit"
          disabled={!file || isLoading}
          className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Yükleniyor...' : 'Yükle'}
        </button>
        
        {status && (
          <p className={`text-sm text-center ${status.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
            {status}
          </p>
        )}
      </form>
    </div>
  );
}