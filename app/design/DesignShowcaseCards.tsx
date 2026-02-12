const STUDIO_IMAGES = [
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=2200&q=80",
];

const SECTIONS_IMAGES = [
  "https://images.unsplash.com/photo-1511300636408-a63a89df3482?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=2200&q=80",
];

function ShowcaseCard({
  id,
  title,
  subtitle,
  buttonLabel,
  secondaryLabel,
  images,
}: {
  id: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  secondaryLabel: string;
  images: string[];
}) {
  return (
    <section className="design-hero-card">
      <div className="design-hero-head">
        <p className="design-hero-kicker">Apple-style Design Deck</p>
        <h2 className="design-hero-title">{title}</h2>
        <p className="design-hero-subtitle">{subtitle}</p>
        <div className="design-hero-actions">
          <a href={`#${id}`} className="design-hero-btn">
            {buttonLabel}
          </a>
          <a href="#print-design" className="design-hero-btn design-hero-btn-muted">
            {secondaryLabel}
          </a>
        </div>
      </div>

      <div className="design-hero-carousel" role="region" aria-label={`${title} image carousel`}>
        {images.map((src, idx) => (
          <article className="design-hero-slide" key={`${id}-${idx}`}>
            <img src={src} alt={`${title} aesthetic ${idx + 1}`} loading="lazy" />
          </article>
        ))}
      </div>
    </section>
  );
}

export default function DesignShowcaseCards() {
  return (
    <div className="design-hero-layout">
      <ShowcaseCard
        id="design-studio"
        title="Design Studio"
        subtitle="High-contrast creator workspace with precision controls, fast iteration, and production-ready visual polish."
        buttonLabel="Open Design Studio"
        secondaryLabel="View Print Collection"
        images={STUDIO_IMAGES}
      />

      <ShowcaseCard
        id="design-sections"
        title="Design Sections"
        subtitle="A curated layout library with modern composition blocks, bold typography, and premium visual rhythm."
        buttonLabel="Open Design Sections"
        secondaryLabel="Jump To Print & Design"
        images={SECTIONS_IMAGES}
      />
    </div>
  );
}
