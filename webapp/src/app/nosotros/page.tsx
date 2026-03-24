import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nosotros - Suvenirs',
  description: 'Conoce la historia de Suvenirs, tu socio en regalos corporativos premium en Chile.',
};

const values = [
  {
    icon: '💎',
    title: 'Calidad',
    description: 'Cada producto pasa por rigurosos controles de calidad para garantizar la excelencia.',
  },
  {
    icon: '🎯',
    title: 'Compromiso',
    description: 'Nos comprometemos con cada proyecto como si fuera propio, cuidando cada detalle.',
  },
  {
    icon: '🌱',
    title: 'Sostenibilidad',
    description: 'Trabajamos con materiales eco-friendly y proveedores responsables.',
  },
  {
    icon: '💡',
    title: 'Innovación',
    description: 'Constantemente buscamos nuevas técnicas y materiales para sorprenderte.',
  },
];

const team = [
  {
    name: 'Carolina Martínez',
    role: 'CEO & Fundadora',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
  },
  {
    name: 'Pablo Sánchez',
    role: 'Director de Operaciones',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
  },
  {
    name: 'Andrea López',
    role: 'Directora Creativa',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
  },
  {
    name: 'Rodrigo Vega',
    role: 'Gerente Comercial',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
  },
];

export default function NosotrosPage() {
  return (
    <div className="pt-20">
      {/* Hero section */}
      <section className="section bg-gradient-to-br from-[#2D2B3D] to-[#1a1828] text-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1 bg-white/10 rounded-full text-sm font-medium mb-6">
              Nuestra Historia
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Creando momentos memorables desde 2019
            </h1>
            <p className="text-xl text-white/80">
              Somos apasionados por transformar ideas en regalos únicos que crean conexiones
              duraderas entre las empresas y su gente.
            </p>
          </div>
        </div>
      </section>

      {/* Story section */}
      <section className="section">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="relative h-[500px] rounded-2xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop"
                  alt="Equipo Suvenirs trabajando"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-[#2D2B3D] text-white p-6 rounded-2xl shadow-xl">
                <p className="text-4xl font-bold">5+</p>
                <p className="text-white/80">Años de experiencia</p>
              </div>
            </div>

            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                De un sueño a una realidad
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Suvenirs nació de la pasión por crear conexiones significativas a través de
                  regalos personalizados. Lo que comenzó como un pequeño emprendimiento en
                  Santiago se ha convertido en el socio de confianza de cientos de empresas
                  en todo Chile.
                </p>
                <p>
                  Nuestra misión es simple: ayudar a las empresas a expresar reconocimiento,
                  gratitud y aprecio de manera única y memorable. Cada producto que creamos
                  cuenta una historia y fortalece vínculos.
                </p>
                <p>
                  Hoy, con un equipo de más de 20 profesionales apasionados, seguimos
                  innovando y buscando nuevas formas de sorprender a nuestros clientes
                  y sus colaboradores.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-border">
                <div>
                  <p className="text-3xl font-bold text-[#2D2B3D]">500+</p>
                  <p className="text-muted-foreground text-sm">Clientes activos</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#2D2B3D]">10k+</p>
                  <p className="text-muted-foreground text-sm">Productos entregados</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#2D2B3D]">99%</p>
                  <p className="text-muted-foreground text-sm">Satisfacción</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values section */}
      <section className="section bg-muted">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Nuestros valores
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Estos principios guían cada decisión que tomamos y cada producto que creamos.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow text-center"
              >
                <div className="w-16 h-16 bg-[#2D2B3D]/10 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team section */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Conoce a nuestro equipo
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Profesionales apasionados que trabajan día a día para hacer realidad tus ideas.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="group text-center">
                <div className="relative w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
                <p className="text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="section bg-[#2D2B3D] text-white">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para crear algo especial?
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Conversemos sobre tu próximo proyecto de regalos corporativos.
            Estamos aquí para ayudarte.
          </p>
          <Link href="/contacto" className="btn btn-white">
            Contáctanos
          </Link>
        </div>
      </section>
    </div>
  );
}
