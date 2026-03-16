import { Users, Package, Star } from 'lucide-react';

export default function Stats() {
  return (
    <section className="py-12 md:py-16 bg-[#1F1F1F]">
      <div className="container">
        <div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center group cursor-pointer transition-all duration-300 hover:scale-105">
            <div
              className="p-6 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] border border-white/10 hover:border-white/20"
            >
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center"><Users className="h-6 w-6 text-white/80" /></div>
              </div>
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">500+</p>
              <p className="text-white/80 text-sm md:text-base group-hover:text-white transition-colors duration-300">Clientes</p>
            </div>
          </div>
          <div className="text-center group cursor-pointer transition-all duration-300 hover:scale-105">
            <div
              className="p-6 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] border border-white/10 hover:border-white/20"
            >
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center"><Package className="h-6 w-6 text-white/80" /></div>
              </div>
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">10k+</p>
              <p className="text-white/80 text-sm md:text-base group-hover:text-white transition-colors duration-300">Entregas</p>
            </div>
          </div>
          <div className="text-center group cursor-pointer transition-all duration-300 hover:scale-105">
            <div
              className="p-6 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] border border-white/10 hover:border-white/20"
            >
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center"><Star className="h-6 w-6 text-white/80" /></div>
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
