export type ReaderChapter = {
  number: number;
  title: string;
  href: string;
  spineIndex: number;
};

export type ReaderBookMetadata = {
  title: string;
  rootFile: string;
  chapters: ReaderChapter[];
  chapterCount: number;
};

export type RenderedReaderChapter = {
  html: string;
  blocks: string[];
  assetUrls: string[];
};

export type ReaderTheme = 'night' | 'paper' | 'sepia';

export type ReaderPreferences = {
  fontFamily: 'serif' | 'sans';
  fontSize: number;
  lineHeight: number;
  contentWidth: number;
  paragraphIndent: boolean;
  theme: ReaderTheme;
  stickyToolbar: boolean;
  voiceURI: string;
  speechRate: number;
  speechPitch: number;
};
