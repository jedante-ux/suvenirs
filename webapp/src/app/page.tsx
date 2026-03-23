import Hero from "@/components/sections/Hero";
import Stats from "@/components/sections/Stats";
import Categories from "@/components/sections/Categories";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
export default function Home() {
  return (
    <>
      <Hero />
      {/* Soft gradient transition: white → dark */}
      <div className="h-16 bg-gradient-to-b from-white to-[#1F1F1F]" />
      <Stats />
      {/* Soft gradient transition: dark → gray-50 */}
      <div className="h-16 bg-gradient-to-b from-[#1F1F1F] to-gray-50" />
      <Categories />
      {/* Soft gradient transition: gray-50 → white */}
      <div className="h-12 bg-gradient-to-b from-gray-50 to-white" />
      <FeaturedProducts />
    </>
  );
}
