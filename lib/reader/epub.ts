import JSZip from 'jszip';
import type { ReaderBookMetadata, ReaderChapter, RenderedReaderChapter } from './types';

export type LoadedReaderBook = {
  archive: JSZip;
  metadata: ReaderBookMetadata;
};

function parseXml(source: string): Document {
  const document = new DOMParser().parseFromString(source, 'application/xml');
  if (document.getElementsByTagName('parsererror').length > 0) {
    throw new Error('The EPUB contains XML that could not be parsed.');
  }
  return document;
}

function normalizePath(path: string): string {
  const output: string[] = [];
  for (const segment of path.replaceAll('\\', '/').split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') output.pop();
    else output.push(segment);
  }
  return output.join('/');
}

function dirname(path: string): string {
  const index = path.lastIndexOf('/');
  return index < 0 ? '' : path.slice(0, index);
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function resolvePath(baseFile: string, href: string): string {
  const cleanHref = safeDecode(href.split('#')[0].split('?')[0]);
  if (!cleanHref) return normalizePath(baseFile);
  return normalizePath(`${dirname(baseFile)}/${cleanHref}`);
}

function firstByLocalName(document: Document, localName: string): Element | undefined {
  return Array.from(document.getElementsByTagNameNS('*', localName))[0] as Element | undefined;
}

function allByLocalName(document: Document, localName: string): Element[] {
  return Array.from(document.getElementsByTagNameNS('*', localName)) as Element[];
}

function chapterFromLabel(label: string, href: string, spineIndex: number): ReaderChapter | null {
  const clean = label.replace(/\s+/g, ' ').trim();
  const match = clean.match(/^Chapter\s+(\d+)\s*:\s*(.+)$/i);
  if (!match) return null;
  const number = Number(match[1]);
  if (!Number.isFinite(number) || number < 1) return null;
  return { number, title: match[2].trim(), href, spineIndex };
}

async function parseNavigation(
  archive: JSZip,
  rootFile: string,
  manifestItems: Element[],
  spineHrefToIndex: Map<string, number>,
): Promise<ReaderChapter[]> {
  const navItem = manifestItems.find((item) => (item.getAttribute('properties') ?? '').split(/\s+/).includes('nav'));
  if (navItem?.getAttribute('href')) {
    const navPath = resolvePath(rootFile, navItem.getAttribute('href')!);
    const source = await archive.file(navPath)?.async('text');
    if (source) {
      const html = new DOMParser().parseFromString(source, 'text/html');
      const chapters = Array.from(html.querySelectorAll('a[href]'))
        .map((anchor) => {
          const rawHref = anchor.getAttribute('href') ?? '';
          const resolvedHref = resolvePath(navPath, rawHref);
          const label = anchor.textContent ?? '';
          return chapterFromLabel(label, resolvedHref, spineHrefToIndex.get(resolvedHref) ?? -1);
        })
        .filter((chapter): chapter is ReaderChapter => Boolean(chapter));
      if (chapters.length > 0) return chapters.sort((a, b) => a.number - b.number);
    }
  }

  const ncxItem = manifestItems.find((item) => item.getAttribute('media-type') === 'application/x-dtbncx+xml');
  if (ncxItem?.getAttribute('href')) {
    const ncxPath = resolvePath(rootFile, ncxItem.getAttribute('href')!);
    const source = await archive.file(ncxPath)?.async('text');
    if (source) {
      const ncx = parseXml(source);
      const chapters: ReaderChapter[] = [];
      for (const navPoint of allByLocalName(ncx, 'navPoint')) {
        const label = Array.from(navPoint.getElementsByTagNameNS('*', 'text'))[0]?.textContent ?? '';
        const src = Array.from(navPoint.getElementsByTagNameNS('*', 'content'))[0]?.getAttribute('src') ?? '';
        if (!src) continue;
        const resolvedHref = resolvePath(ncxPath, src);
        const chapter = chapterFromLabel(label, resolvedHref, spineHrefToIndex.get(resolvedHref) ?? -1);
        if (chapter) chapters.push(chapter);
      }
      if (chapters.length > 0) return chapters.sort((a, b) => a.number - b.number);
    }
  }

  return [];
}

export async function loadEpub(file: Blob): Promise<LoadedReaderBook> {
  const archive = await JSZip.loadAsync(await file.arrayBuffer());
  const containerSource = await archive.file('META-INF/container.xml')?.async('text');
  if (!containerSource) throw new Error('This file does not contain META-INF/container.xml.');

  const container = parseXml(containerSource);
  const rootfile = firstByLocalName(container, 'rootfile');
  const rootFile = rootfile?.getAttribute('full-path');
  if (!rootFile) throw new Error('The EPUB package document could not be located.');

  const opfSource = await archive.file(rootFile)?.async('text');
  if (!opfSource) throw new Error('The EPUB package document is missing.');
  const opf = parseXml(opfSource);
  const manifestItems = allByLocalName(opf, 'item');
  const manifestById = new Map<string, Element>();
  for (const item of manifestItems) {
    const id = item.getAttribute('id');
    if (id) manifestById.set(id, item);
  }

  const spineHrefToIndex = new Map<string, number>();
  allByLocalName(opf, 'itemref').forEach((itemref, index) => {
    const idref = itemref.getAttribute('idref');
    const manifestItem = idref ? manifestById.get(idref) : undefined;
    const href = manifestItem?.getAttribute('href');
    if (href) spineHrefToIndex.set(resolvePath(rootFile, href), index);
  });

  const chapters = await parseNavigation(archive, rootFile, manifestItems, spineHrefToIndex);
  if (chapters.length === 0) throw new Error('No numbered chapters were found in this EPUB navigation document.');

  const bookTitle = firstByLocalName(opf, 'title')?.textContent?.trim() || 'Imported EPUB';
  return {
    archive,
    metadata: {
      title: bookTitle,
      rootFile,
      chapters,
      chapterCount: chapters.length,
    },
  };
}

function mimeForPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.avif')) return 'image/avif';
  return 'application/octet-stream';
}

function sanitizeDocument(document: Document): void {
  document.querySelectorAll('script,iframe,object,embed,form,input,button,textarea,select,link,meta,base').forEach((node) => node.remove());
  document.querySelectorAll('*').forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on') || name === 'srcdoc' || name === 'style') element.removeAttribute(attribute.name);
      if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) element.removeAttribute(attribute.name);
    }
  });
}

export async function renderEpubChapter(book: LoadedReaderBook, chapter: ReaderChapter): Promise<RenderedReaderChapter> {
  const source = await book.archive.file(chapter.href)?.async('text');
  if (!source) throw new Error(`Chapter file not found: ${chapter.href}`);

  const document = new DOMParser().parseFromString(source, 'text/html');
  sanitizeDocument(document);
  const assetUrls: string[] = [];

  const imageElements = Array.from(document.querySelectorAll('img[src]'));
  await Promise.all(imageElements.map(async (image) => {
    const rawSrc = image.getAttribute('src');
    if (!rawSrc || rawSrc.startsWith('data:') || rawSrc.startsWith('blob:') || /^https?:/i.test(rawSrc)) return;
    const path = resolvePath(chapter.href, rawSrc);
    const entry = book.archive.file(path);
    if (!entry) {
      image.setAttribute('data-reader-image-missing', 'true');
      image.removeAttribute('src');
      return;
    }
    const bytes = await entry.async('arraybuffer');
    const url = URL.createObjectURL(new Blob([bytes], { type: mimeForPath(path) }));
    assetUrls.push(url);
    image.setAttribute('src', url);
    image.removeAttribute('srcset');
    image.setAttribute('loading', 'lazy');
  }));

  const svgImages = Array.from(document.querySelectorAll('svg image'));
  await Promise.all(svgImages.map(async (image) => {
    const rawHref = image.getAttribute('href') || image.getAttribute('xlink:href');
    if (!rawHref || rawHref.startsWith('data:') || rawHref.startsWith('blob:') || /^https?:/i.test(rawHref)) return;
    const path = resolvePath(chapter.href, rawHref);
    const entry = book.archive.file(path);
    if (!entry) return;
    const bytes = await entry.async('arraybuffer');
    const url = URL.createObjectURL(new Blob([bytes], { type: mimeForPath(path) }));
    assetUrls.push(url);
    image.setAttribute('href', url);
    image.removeAttribute('xlink:href');
  }));

  document.querySelectorAll('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href') ?? '';
    if (/^https?:/i.test(href)) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    } else if (!href.startsWith('#')) {
      anchor.setAttribute('href', '#');
    }
  });

  const blocks: string[] = [];
  document.querySelectorAll('h1,h2,h3,h4,p,li,blockquote,figcaption').forEach((element) => {
    const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    const index = blocks.push(text) - 1;
    element.setAttribute('data-reader-block', String(index));
  });

  if (blocks.length === 0) {
    const text = (document.body.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (text) blocks.push(text);
  }

  return { html: document.body.innerHTML, blocks, assetUrls };
}

export function revokeRenderedAssets(rendered: RenderedReaderChapter | null): void {
  rendered?.assetUrls.forEach((url) => URL.revokeObjectURL(url));
}
