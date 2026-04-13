import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'white';
}

const sizes = {
  sm: { width: 130, height: 26 },
  md: { width: 165, height: 33 },
  lg: { width: 210, height: 42 },
};

export function Logo({ size = 'md', variant = 'default' }: LogoProps) {
  const { width, height } = sizes[size];

  return (
    <Image
      src="/logo-suvenirs.png"
      alt="Suvenirs Regalos Corporativos"
      width={width}
      height={height}
      className="w-auto object-contain transition-all duration-300 max-h-[50px]"
      style={variant === 'white' ? { filter: 'brightness(10) saturate(0)' } : { filter: 'brightness(0.42) hue-rotate(6deg) saturate(0.75)' }}
      priority
    />
  );
}
