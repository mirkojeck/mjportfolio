import type { CollectionEntry } from 'astro:content';

export type LegalEntry = CollectionEntry<'legal'>;

export const getLegalHref = (entry: LegalEntry): string => `/${entry.data.slug.replace(/^\/+|\/+$/g, '')}/`;

export const getEnabledLegalEntries = (entries: LegalEntry[]): LegalEntry[] =>
  entries
    .filter((entry) => entry.data.enabled && Boolean(entry.body?.trim()))
    .sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999));

export const getFooterLegalEntries = (entries: LegalEntry[]): LegalEntry[] =>
  getEnabledLegalEntries(entries).filter((entry) => entry.data.showInFooter);

export const getMenuLegalEntries = (entries: LegalEntry[]): LegalEntry[] =>
  getEnabledLegalEntries(entries).filter((entry) => entry.data.showInMenu || entry.data.showInFooter);
