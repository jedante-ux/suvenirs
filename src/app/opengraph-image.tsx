import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Suvenirs — Regalos Corporativos y Grabados Personalizados';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1F1F1F',
          position: 'relative',
        }}
      >
        {/* Gradient accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #FE248A, #FF6BB5, #FE248A)',
          }}
        />

        {/* Logo */}
        <img
          src="https://suvenirs.cl/logo-suvenirs.png"
          alt=""
          width={340}
          height={85}
          style={{ marginBottom: 40 }}
        />

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <p
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: '#FFFFFF',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Regalos Corporativos Premium
          </p>
          <p
            style={{
              fontSize: 22,
              color: '#999999',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Grabados, trofeos, merchandising y reconocimientos personalizados
          </p>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <p style={{ fontSize: 16, color: '#FE248A', margin: 0, fontWeight: 600 }}>
            suvenirs.cl
          </p>
          <p style={{ fontSize: 16, color: '#666', margin: 0 }}>
            · Envío a todo Chile
          </p>
        </div>
      </div>
    ),
    { ...size }
  );
}
