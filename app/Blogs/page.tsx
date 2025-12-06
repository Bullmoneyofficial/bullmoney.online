"use client";
import React, { useRef, useState } from "react";
import { ShopProvider } from "../VIP/ShopContext"; // Import ShopProvider
import { BlogProvider } from "@/app/Blogs/BlogContext"; // Import BlogProvider
import HeroShop from "@/app/Blogs/BlogHero"; // Blog Hero component
import BlogPage from "@/app/Blogs/BlogPage"; // Import the BlogPage component
import Livestreams from "@/app/Blogs/Livestreams"; // Import the BlogPage component
import RecruitPage from "@/app/register/pageVip";
import Socials from "@/components/Mainpage/Socialsfooter";
import Chartnews from "@/app/Blogs/Chartnews";
import Shopmain from "@/components/Mainpage/ShopMainpage";
export default function Page({
  searchParams,
}: {
  searchParams?: { src?: string };
}) {
  const productsRef = useRef<HTMLDivElement | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false); // State to track access

  const handleScrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

 // If the website is NOT unlocked, show the Register Page
  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        {/* Pass the function to unlock the site when form is done */}
        <RecruitPage onUnlock={() => setIsUnlocked(true)} />
      </main>
    );
  }

  return (
    <BlogProvider>
        <Socials />
      <ShopProvider>
        <main className="min-h-screen bg-slate-950 text-white">
          {/* Hero Section for Blog */}
          
          <HeroShop onScrollToProducts={handleScrollToProducts} />
 
          {/* Blog section */}
          <BlogPage /> {/* This will render blog posts */}
 <Shopmain />
     <Chartnews />
          {/* Shop Products Section */}
          <div ref={productsRef}>
        {/* Render the product section */}
        {/* Render Pricing */}
          </div>
        </main>
      
      </ShopProvider>
    </BlogProvider>
  );
}
