import React from "react";

interface Product {
  title: string;
  link: string;
  thumbnail: string;
}

interface HeroParallaxProps {
  products: Product[];
}

export const HeroParallax: React.FC<HeroParallaxProps> = ({ products }) => {
  return (
    <div className="hero-parallax-container">
      {products.map((product, index) => (
        <div key={index} className="hero-product-item">
          <a href={product.link} target="_blank" rel="noopener noreferrer">
            <img src={product.thumbnail} alt={product.title} />
            <h3>{product.title}</h3>
          </a>
        </div>
      ))}
    </div>
  );
};
