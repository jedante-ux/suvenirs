import Hero from "@/components/sections/Hero";
import Stats from "@/components/sections/Stats";
import Categories from "@/components/sections/Categories";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import KitsShowcase from "@/components/sections/KitsShowcase";
import FAQ from "@/components/sections/FAQ";
export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <Categories />
      <FeaturedProducts />
      <KitsShowcase />
      <FAQ />
    </>
  );
}
