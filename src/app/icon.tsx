import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Shield outline */}
          <path d="M12 2L4 6v5c0 5.25 3.4 10.15 8 11.25C16.6 21.15 20 16.25 20 11V6l-8-4z" stroke="#16A085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* Rotation circle (dashed) */}
          <circle cx="12" cy="12" r="5" stroke="#16A085" strokeWidth="1.2" strokeDasharray="4 2.5" fill="none" opacity="0.7" />
          {/* 4 Nodes on circle */}
          <circle cx="12" cy="7" r="1.2" fill="#16A085" />
          <circle cx="17" cy="12" r="1.2" fill="#16A085" />
          <circle cx="12" cy="17" r="1.2" fill="#16A085" />
          <circle cx="7" cy="12" r="1.2" fill="#16A085" />
          {/* T + checkmark at center */}
          <path d="M10 10h4" stroke="#16A085" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 10v3.5" stroke="#16A085" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 13.5l1.5-1.5" stroke="#16A085" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
