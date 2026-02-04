import { Users, Package, Star } from 'lucide-react';

export default function Stats() {
  return (
    <section className="py-12 md:py-16 bg-[#1F1F1F]">
      <div className="container">
        <div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center group cursor-pointer transition-all duration-300 hover:scale-105">
            <div
              className="p-6 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
              style={{
                boxShadow: `
                  inset 2px -2px 4px 0 rgba(255, 255, 255, 0.5),
                  inset -2px 2px 4px 0 rgba(255, 255, 255, 0.1),
                  0 10px 15px -3px rgba(0, 0, 0, 0.1)
                `
              }}
            >
              <div className="flex justify-center mb-3">
                <div
                  className="transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 25%, #e84393 75%, #a855f7 100%)',
                    WebkitMaskImage: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xNiAyMXYtMmE0IDQgMCAwIDAtNC00SDZhNCA0IDAgMCAwLTQgNHYyIi8+PGNpcmNsZSBjeD0iOSIgY3k9IjciIHI9IjQiLz48cGF0aCBkPSJNMjIgMjF2LTJhNCA0IDAgMCAwLTMtMy44N00xNiAzLjEzYTQgNCAwIDAgMSAwIDcuNzUiLz48L3N2Zz4=)',
                    maskImage: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xNiAyMXYtMmE0IDQgMCAwIDAtNC00SDZhNCA0IDAgMCAwLTQgNHYyIi8+PGNpcmNsZSBjeD0iOSIgY3k9IjciIHI9IjQiLz48cGF0aCBkPSJNMjIgMjF2LTJhNCA0IDAgMCAwLTMtMy44N00xNiAzLjEzYTQgNCAwIDAgMSAwIDcuNzUiLz48L3N2Zz4=)',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    width: '3rem',
                    height: '3rem'
                  }}
                />
              </div>
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">500+</p>
              <p className="text-white/80 text-sm md:text-base group-hover:text-white transition-colors duration-300">Clientes</p>
            </div>
          </div>
          <div className="text-center group cursor-pointer transition-all duration-300 hover:scale-105">
            <div
              className="p-6 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
              style={{
                boxShadow: `
                  inset 2px -2px 4px 0 rgba(255, 255, 255, 0.5),
                  inset -2px 2px 4px 0 rgba(255, 255, 255, 0.1),
                  0 10px 15px -3px rgba(0, 0, 0, 0.1)
                `
              }}
            >
              <div className="flex justify-center mb-3">
                <div
                  className="transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 25%, #e84393 75%, #a855f7 100%)',
                    WebkitMaskImage: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Im03LjUgNC4yNyA5IDUuMTUiLz48cGF0aCBkPSJNMjEgOGEyIDIgMCAwIDAtMS0xLjczbC03LTRhMiAyIDAgMCAwLTIgMGwtNyA0QTIgMiAwIDAgMCAzIDh2OGEyIDIgMCAwIDAgMSAxLjczbDcgNGEyIDIgMCAwIDAgMiAwbDctNEEyIDIgMCAwIDAgMjEgMTZaIi8+PHBhdGggZD0ibTMuMyA3IDguNyA1IDguNy01Ii8+PHBhdGggZD0iTTEyIDIyVjEyIi8+PC9zdmc+)',
                    maskImage: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Im03LjUgNC4yNyA5IDUuMTUiLz48cGF0aCBkPSJNMjEgOGEyIDIgMCAwIDAtMS0xLjczbC03LTRhMiAyIDAgMCAwLTIgMGwtNyA0QTIgMiAwIDAgMCAzIDh2OGEyIDIgMCAwIDAgMSAxLjczbDcgNGEyIDIgMCAwIDAgMiAwbDctNEEyIDIgMCAwIDAgMjEgMTZaIi8+PHBhdGggZD0ibTMuMyA3IDguNyA1IDguNy01Ii8+PHBhdGggZD0iTTEyIDIyVjEyIi8+PC9zdmc+)',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    width: '3rem',
                    height: '3rem'
                  }}
                />
              </div>
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">10k+</p>
              <p className="text-white/80 text-sm md:text-base group-hover:text-white transition-colors duration-300">Entregas</p>
            </div>
          </div>
          <div className="text-center group cursor-pointer transition-all duration-300 hover:scale-105">
            <div
              className="p-6 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
              style={{
                boxShadow: `
                  inset 2px -2px 4px 0 rgba(255, 255, 255, 0.5),
                  inset -2px 2px 4px 0 rgba(255, 255, 255, 0.1),
                  0 10px 15px -3px rgba(0, 0, 0, 0.1)
                `
              }}
            >
              <div className="flex justify-center mb-3">
                <div
                  className="transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 25%, #e84393 75%, #a855f7 100%)',
                    WebkitMaskImage: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5Z29uIHBvaW50cz0iMTIgMiAxNS4wOSA4LjI2IDIyIDkuMjcgMTcgMTQuMTQgMTguMTggMjEuMDIgMTIgMTcuNzcgNS44MiAyMS4wMiA3IDE0LjE0IDIgOS4yNyA4LjkxIDguMjYgMTIgMiIvPjwvc3ZnPg==)',
                    maskImage: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5Z29uIHBvaW50cz0iMTIgMiAxNS4wOSA4LjI2IDIyIDkuMjcgMTcgMTQuMTQgMTguMTggMjEuMDIgMTIgMTcuNzcgNS44MiAyMS4wMiA3IDE0LjE0IDIgOS4yNyA4LjkxIDguMjYgMTIgMiIvPjwvc3ZnPg==)',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    width: '3rem',
                    height: '3rem'
                  }}
                />
              </div>
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">4.9★</p>
              <p className="text-white/80 text-sm md:text-base group-hover:text-white transition-colors duration-300">Satisfacción</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
