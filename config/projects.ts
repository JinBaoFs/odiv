export type ProjectActionLabel = 'source' | 'demo' | 'doc';

export type ProjectAction = {
  label: ProjectActionLabel;
  href: string;
  openInNewTab: boolean;
};

export type ProjectItem = {
  id: 'chaincatcher' | 'rootdata' | 'fomo-tool' | 'image-compressor';
  name: string;
  followerCount: number;
  date: string;
  actions: ProjectAction[];
  featuredOnHome?: boolean;
  homeOrder?: number;
};

export const projects: ProjectItem[] = [
  {
    id: 'chaincatcher',
    name: 'ChainCather',
    followerCount: 3250,
    date: '2026',
    featuredOnHome: true,
    homeOrder: 1,
    actions: [{label: 'source', href: 'https://www.chaincatcher.com/', openInNewTab: true}],
  },
  {
    id: 'rootdata',
    name: 'RootData',
    followerCount: 2580,
    date: '2025',
    featuredOnHome: true,
    homeOrder: 2,
    actions: [{label: 'source', href: 'https://www.rootdata.com/', openInNewTab: true}],
  },
  {
    id: 'fomo-tool',
    name: 'FOMO Tool',
    followerCount: 128,
    date: '2026',
    featuredOnHome: true,
    homeOrder: 3,
    actions: [
      {label: 'demo', href: '/fomo-tool', openInNewTab: true},
      {label: 'doc', href: '/blog/fomo-tool-guide', openInNewTab: true},
    ],
  },
  {
    id: 'image-compressor',
    name: 'Image Compressor',
    followerCount: 62,
    date: '2025',
    actions: [
      {label: 'demo', href: '/image-compressor', openInNewTab: true},
      {label: 'doc', href: '/blog/image-compressor-guide', openInNewTab: true},
    ],
  },
];
