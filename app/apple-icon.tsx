import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#3B82F6',
          borderRadius: '40px',
        }}
      >
        <div
          style={{
            fontSize: '120px',
            fontWeight: 'bold',
            color: 'white',
          }}
        >
          H
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}