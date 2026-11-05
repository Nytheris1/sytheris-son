import { NextResponse } from 'next/server';
import { kvSet } from '@/lib/store';
import { toVtt } from '@/lib/subtitles'; // Senin kendi çevirici fonksiyonun

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('subtitle') as File;
    const episodeId = formData.get('episodeId') as string;
    const animeId = formData.get('animeId') as string;

    if (!file || !episodeId) {
      return NextResponse.json({ message: 'File or episode ID is missing.' }, { status: 400 });
    }

    const fileContent = await file.text();
    
    // Eğer senin lib/subtitles.ts dosyan varsa onu kullan, yoksa basitçe VTT'ye çevir
    const vttContent = toVtt ? toVtt(fileContent) : 'WEBVTT\n\n' + fileContent;

    const key = `subtitle:${animeId}:${episodeId}`;
    await kvSet(key, vttContent);

    return NextResponse.json({ success: true, message: 'Subtitle saved successfully.' });
  } catch (error) {
    console.error('Subtitle upload error:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}