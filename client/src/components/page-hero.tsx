import { useState } from "react";

interface PageHeroProps {
  title: React.ReactNode;
  subtitle?: string;
  imageSrc: string;
  imageAlt?: string;
  containerClassName?: string;
  children?: React.ReactNode;
}

export function PageHero({ title, subtitle, imageSrc, imageAlt, containerClassName, children }: PageHeroProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`relative overflow-hidden ${containerClassName ?? "h-40"}`}
      style={{ backgroundColor: "hsl(152,40%,12%)" }}
      data-testid={`hero-${typeof imageAlt === "string" ? imageAlt.toLowerCase().replace(/\s/g, "-") : "page"}`}
    >
      <img
        src={imageSrc}
        alt={typeof imageAlt === "string" ? imageAlt : "hero"}
        fetchPriority="high"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(152,40%,18%/0.9)] via-[hsl(152,35%,22%/0.8)] to-[hsl(152,30%,25%/0.6)]" />
      <div className="relative z-10 h-full flex items-center px-8">
        <div className="space-y-1 flex-1 bg-black/30 backdrop-blur-sm rounded-lg px-5 py-3 w-fit">
          {typeof title === "string" ? (
            <h1 className="text-2xl font-bold text-white drop-shadow-md">{title}</h1>
          ) : (
            title
          )}
          {subtitle && (
            <p className="text-white/85 text-sm max-w-lg drop-shadow-sm">{subtitle}</p>
          )}
        </div>
        {children && (
          <div className="shrink-0 flex gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
