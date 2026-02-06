"use client";

import React from "react";
import { motion } from "framer-motion";
import TextType from "@/components/TextType";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface ShopMainpageProps {
  products?: Product[];
}

export const ShopMainpage = ({ products = [] }: ShopMainpageProps) => {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-white mb-8">Shop</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10"
          >
            <h3 className="text-xl font-bold text-white mb-2">
              <TextType text={product.name} typingSpeed={Math.max(5, 25 - product.name.length / 2)} showCursor={false} loop={false} as="span" />
            </h3>
            <p className="text-gray-400 mb-4"><TextType text={product.description} typingSpeed={Math.max(2, 15 - product.description.length / 20)} showCursor={false} loop={false} as="span" /></p>
            <p className="text-2xl font-bold text-white">${product.price}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ShopMainpage;
