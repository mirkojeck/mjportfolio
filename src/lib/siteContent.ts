import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import YAML from 'yaml';

export type MenuItem = {
  label: string;
  href: string;
  children?: MenuItem[];
};

export type SiteSettings = {
  brand: {
    name: string;
    shortName: string;
    domain: string;
    logoText: string;
    logo?: {
      alt: string;
      images?: {
        light?: string;
        dark?: string;
        footer?: string;
        fallback?: string;
      };
      display?: {
        height?: number;
        scale?: number;
        positionX?: number;
        positionY?: number;
        objectFit?: 'contain' | 'cover';
      };
    };
    logoImage?: string;
    logoLight?: string;
    logoDark?: string;
    logoFooter?: string;
    logoAlt: string;
    logoHeight?: number;
    logoScale?: number;
    logoPositionX?: number;
    logoPositionY?: number;
    logoObjectFit?: 'contain' | 'cover';
  };
  display?: {
    homeVariant?: 'home1' | 'home2';
    portfolioLayout?: 'mixedGrid' | 'wideGrid' | 'slider';
  };
  seo: {
    title: string;
    description: string;
    image: string;
    favicon: string;
    canonicalBaseUrl: string;
  };
  projects: {
    sortDirection: 'asc' | 'desc';
    featuredLimit: number;
  };
  gallery?: {
    homeLimit?: number;
  };
  contact: {
    email: string;
    phone: string;
    locations: Array<{
      label: string;
      address: string;
      phone: string;
    }>;
  };
  socials: Array<SocialLink>;
  legalLinks: MenuItem[];
};

export type Navigation = {
  main: MenuItem[];
  footer: MenuItem[];
};

export type SocialLink = {
  platform?: 'instagram' | 'linkedin' | 'facebook' | 'behance' | 'x' | 'twitter' | 'whatsapp' | 'dribbble' | 'github';
  label: string;
  href: string;
};

export type HomeSettings = {
  hero: {
    preloaderLine1: string;
    preloaderLine2: string;
    preloaderLine3: string;
    titlePart1: string;
    titleThin1: string;
    titlePart2: string;
    titleThin2: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
  about: {
    titlePart1: string;
    titlePart2: string;
    titleThin: string;
    paragraphs: string[];
    quote: string;
    quoteImage: string;
    image: string;
  };
  servicesPreview: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    image: string;
    ctaLabel: string;
    ctaHref: string;
    items: Array<{ title: string; summary: string; href: string }>;
  };
  featuredProjects: {
    heading: string;
    source: string;
    limit: number;
  };
  teamPreview: {
    titlePart1: string;
    titlePart2: string;
    paragraphs: string[];
    ctaLabel: string;
    ctaHref: string;
    closingLine1: string;
    closingLine2: string;
    note: string;
    members: Array<{ name: string; role: string; image: string; href: string; socials?: SocialLink[] }>;
  };
  reviews: {
    eyebrow: string;
    titlePart1: string;
    titlePart2: string;
    items: Array<{ name: string; company: string; image: string; quote: string }>;
  };
  partners: Array<{ image: string; href: string; width: string }>;
  blogPreview: {
    heading: string;
    description?: string;
    ctaLabel: string;
    ctaHref: string;
    items: Array<{ title: string; category: string; date: string; image: string; href: string; excerpt: string }>;
  };
  callToAction: {
    eyebrow: string;
    title: string;
    ctaLabel: string;
    ctaHref: string;
  };
};

export type PageCopy = {
  portfolio: {
    hero: {
      titleLine1: string;
      titleLine2: string;
      titleLine3: string;
      downArrowLabel: string;
    };
    cta: {
      eyebrow: string;
      titleLine1: string;
      titleLine2: string;
      titleLine3: string;
      titleLine4: string;
      titleLine5: string;
      buttonLabel: string;
    };
  };
  services: {
    hero: {
      titleLine1: string;
      titleLine2: string;
      titleLine3: string;
      titleLine4: string;
      downArrowLabel: string;
    };
    cta: {
      eyebrow: string;
      titleLine1: string;
      titleLine2: string;
      titleLine3: string;
      titleLine4: string;
      titleLine5: string;
      buttonLabel: string;
    };
    detail: {
      downArrowLabel: string;
      startProjectLabel: string;
    };
  };
  team: {
    hero: {
      titleLine1: string;
      titleLine2: string;
      titleLine3: string;
      titleLine4: string;
      downArrowLabel: string;
    };
  };
  gallery: {
    hero: {
      titleLine1: string;
      titleLine2: string;
      downArrowLabel: string;
    };
    card: {
      viewLabel: string;
    };
  };
  publications: {
    hero: {
      titleLine1: string;
      titleLine2: string;
      downArrowLabel: string;
    };
    listing: {
      readMoreLabel: string;
    };
    detail: {
      prevLabel: string;
      allLabel: string;
      nextLabel: string;
    };
  };
  contact: {
    hero: {
      downArrowLabel: string;
    };
  };
};

const readYaml = <T>(relativePath: string): T => {
  const filePath = resolve(process.cwd(), 'src/data', relativePath);
  return YAML.parse(readFileSync(filePath, 'utf8')) as T;
};

export const getSiteSettings = (): SiteSettings => readYaml<SiteSettings>('site.yml');

export const getNavigation = (): Navigation => readYaml<Navigation>('navigation.yml');

export const getHomeSettings = (): HomeSettings => readYaml<HomeSettings>('home.yml');

export const getPageCopy = (): PageCopy => readYaml<PageCopy>('pages.yml');

type OrderedContent = {
  data: {
    order?: number;
    date?: Date;
    year?: number;
  };
};

export const sortByOrder = <T extends OrderedContent>(items: T[], direction: 'asc' | 'desc' = 'desc'): T[] =>
  [...items].sort((a, b) => {
    const orderDiff = (a.data.order ?? 999) - (b.data.order ?? 999);
    if (orderDiff !== 0) return orderDiff;

    const aTime = a.data.date?.getTime() ?? new Date(a.data.year ?? 0, 0, 1).getTime();
    const bTime = b.data.date?.getTime() ?? new Date(b.data.year ?? 0, 0, 1).getTime();
    return direction === 'asc' ? aTime - bTime : bTime - aTime;
  });

export const formatProjectDate = (date?: Date, year?: number): string => {
  if (date) {
    return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(date);
  }

  return year ? String(year) : '';
};

export const getDefaultHomeVariant = (site: SiteSettings): 'home1' | 'home2' =>
  site.display?.homeVariant ?? 'home1';

export const getDefaultPortfolioLayout = (site: SiteSettings): 'mixedGrid' | 'wideGrid' | 'slider' =>
  site.display?.portfolioLayout ?? 'mixedGrid';
