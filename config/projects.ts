export type ProjectActionLabel = 'source' | 'demo' | 'doc';

export type ProjectAction = {
  label: ProjectActionLabel;
  href: string;
  openInNewTab: boolean;
};

export type ProjectItem = {
  id: 'chaincatcher' | 'rootdata' | 'fomo-tool' | 'image-compressor' | 'atb-dapp' | 'zz-admin';
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
  {
    id: 'atb-dapp',
    name: 'ATB DApp',
    followerCount: 172,
    date: '2023',
    actions: [
      {label: 'source', href: 'https://github.com/JinBaoFs/ATB-dapp', openInNewTab: true},
      {label: 'doc', href: '/blog/atb-dapp-case-study', openInNewTab: true},
    ],
  },
  {
    id: 'zz-admin',
    name: 'ZZ-Admin',
    followerCount: 424,
    date: '2021',
    actions: [
      {label: 'source', href: 'https://github.com/JinBaoFs/zhangzhou-weather-admin', openInNewTab: true},
      {label: 'doc', href: '/blog/zz-admin-case-study', openInNewTab: true},
    ],
  },
];
