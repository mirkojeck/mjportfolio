import type { CollectionEntry } from 'astro:content';

export type GalleryImage = {
  image: string;
  alt?: string;
  caption?: string;
  useAsCover?: boolean;
};

export const getGalleryImages = (entry: CollectionEntry<'posts'>): GalleryImage[] =>
  entry.data.gallery.length > 0
    ? entry.data.gallery
    : [{ image: '/img/photo/1.jpg', alt: entry.data.title, useAsCover: true }];

export const getGalleryCover = (entry: CollectionEntry<'posts'>): GalleryImage => {
  const images = getGalleryImages(entry);
  return images.find((image) => image.useAsCover) ?? images[0];
};

