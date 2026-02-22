import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default async function Icon() {
  // Stáhnout Manrope ExtraBold z Google Fonts – stejný font jako brand text
  let fontData: ArrayBuffer | null = null;
  try {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Manrope:wght@800&display=swap',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    ).then((r) => r.text());
    const fontUrl = css.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/)?.[1];
    if (fontUrl) {
      fontData = await fetch(fontUrl).then((r) => r.arrayBuffer());
    }
  } catch {
    // fallback – použije sans-serif
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '7px',
        }}
      >
        <span
          style={{
            fontFamily: fontData ? 'Manrope' : 'sans-serif',
            fontWeight: 800,
            fontSize: '14px',
            color: '#0a0a0a',
            letterSpacing: '-0.5px',
          }}
        >
          MP
        </span>
      </div>
    ),
    {
      ...size,
      ...(fontData
        ? { fonts: [{ name: 'Manrope', data: fontData, weight: 800, style: 'normal' as const }] }
        : {}),
    }
  );
}
