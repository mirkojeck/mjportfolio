import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { normalizeImagePath } from './lib/media';

const imagePath = z.preprocess((value) => normalizeImagePath(value as string), z.string().min(1));

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    cover: imagePath,
    gallery: z.array(imagePath).default([]),
    detailLayout: z.enum([
      'project1Grid',
      'project2Stacked',
      'project3HorizontalSlider',
      'project4VerticalSlider',
      'project5FullWidthSquareSlider',
      'project6FullWidthMixedSliders',
    ]).default('project1Grid'),
    client: z.string(),
    year: z.number(),
    date: z.date().optional(),
    services: z.array(z.string()).default([]),
    externalUrl: z.string().url().optional(),
    order: z.number().default(999),
    isFeatured: z.boolean().default(false),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    excerpt: z.string(),
    gallery: z.array(z.object({
      image: imagePath,
      alt: z.string().optional(),
      caption: z.string().optional(),
      useAsCover: z.boolean().default(false),
    })).default([]),
    isFeatured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    order: z.number().default(999),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    features: z.array(z.string()).default([]),
    process: z.array(z.object({
      title: z.string(),
      description: z.string(),
    })).default([]),
    order: z.number().default(999),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

const team = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/team' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    image: imagePath,
    socials: z.array(z.object({ platform: z.string().optional(), label: z.string(), href: z.string() })).default([]),
    order: z.number().default(999),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    excerpt: z.string(),
    cover: imagePath,
    gallery: z.array(imagePath).default([]),
    tags: z.array(z.string()).default([]),
    order: z.number().default(999),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().min(1),
    enabled: z.boolean().default(false),
    showInFooter: z.boolean().default(false),
    showInMenu: z.boolean().default(false),
    order: z.number().default(999),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

export const collections = { projects, posts, services, team, publications, legal };
