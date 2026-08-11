export type ToolLocale = 'zh' | 'en';

export type ToolItem = {
  id: string;
  title: Record<ToolLocale, string>;
  description: Record<ToolLocale, string>;
  logoUrl: string;
  linkUrl: string;
  openInNewTab?: boolean;
  featuredOnHome?: boolean;
  homeOrder?: number;
};

export const tools: ToolItem[] = [
  {
    id: 'chainlist',
    title: {zh: 'Chainlist', en: 'Chainlist'},
    description: {zh: '快速查找并添加 EVM 网络到钱包', en: 'Find and add EVM networks to your wallet'},
    logoUrl: 'https://chainlist.org/favicon.ico',
    linkUrl: 'https://chainlist.org',
    openInNewTab: true,
    homeOrder: 1,
  },
  {
    id: 'etherscan',
    title: {zh: 'Etherscan', en: 'Etherscan'},
    description: {zh: '以太坊区块链浏览器与数据分析平台', en: 'Ethereum blockchain explorer and analytics platform'},
    logoUrl: 'https://public.rootdata.com/images/b12/1671794703895.jpg',
    linkUrl: 'https://etherscan.io',
    openInNewTab: true,
    homeOrder: 2,
  },
  {
    id: 'coingecko',
    title: {zh: 'CoinGecko', en: 'CoinGecko'},
    description: {zh: '加密货币行情、市场数据和项目资料平台', en: 'Cryptocurrency prices, market data and project insights'},
    logoUrl: 'https://www.coingecko.com/favicon.ico',
    linkUrl: 'https://www.coingecko.com',
    openInNewTab: true,
    homeOrder: 3,
  },
  {
    id: 'bscscan',
    title: {zh: 'BscScan', en: 'BscScan'},
    description: {zh: 'BNB Smart Chain 区块链浏览器', en: 'BNB Smart Chain blockchain explorer'},
    logoUrl: 'https://public.rootdata.com/images/b12/1672041927065.jpg',
    linkUrl: 'https://bscscan.com',
    openInNewTab: true,
  },
  {
    id: 'web3-university',
    title: {zh: 'Web3 University', en: 'Web3 University'},
    description: {zh: '面向 Web3 开发者的免费学习资源', en: 'Free learning resources for Web3 developers'},
    logoUrl: 'https://public.rootdata.com/images/b12/1672046217578.jpg',
    linkUrl: 'https://www.web3.university',
    openInNewTab: true,
  },
  {
    id: 'uniswap',
    title: {zh: 'Uniswap', en: 'Uniswap'},
    description: {zh: '以太坊生态去中心化交易协议', en: 'Decentralized trading protocol for the Ethereum ecosystem'},
    logoUrl: 'https://app.uniswap.org/favicon.ico',
    linkUrl: 'https://app.uniswap.org',
    openInNewTab: true,
  },
  {
    id: 'panda-tool',
    title: {zh: 'Panda Tool', en: 'Panda Tool'},
    description: {zh: '面向 Web3 项目的链上工具集合', en: 'A collection of on-chain tools for Web3 projects'},
    logoUrl: 'https://www.pandatool.org/favicon.ico?favicon.0dmirt6xnqys4.ico',
    linkUrl: 'https://www.pandatool.org',
    openInNewTab: true,
    featuredOnHome: true,
  },
  {
    id: 'pump-fun',
    title: {zh: 'Pump.fun', en: 'Pump.fun'},
    description: {zh: '基于 Solana 的 Meme 代币创建与交易平台', en: 'Solana-based platform for creating and trading meme tokens'},
    logoUrl: 'https://public.rootdata.com/images/b6/1712562719191.jpg',
    linkUrl: 'https://pump.fun',
    featuredOnHome: true,
    openInNewTab: true,
  },
  {
    id: 'learn-blockchain',
    title: {zh: '登链社区', en: 'LearnBlockchain'},
    description: {zh: '专注区块链技术内容的中文 Web3 开发者社区', en: 'A Chinese-language Web3 community focused on blockchain development'},
    logoUrl: '/images/toolnav/learnblockchain.jpg',
    linkUrl: 'https://learnblockchain.cn',
    featuredOnHome: true,
    openInNewTab: true,
  },
  {
    id: 'openbuild',
    title: {zh: 'OpenBuild 社区', en: 'OpenBuild Community'},
    description: {zh: '连接 Web2 与 Web3 开发者的开源学习社区', en: 'An open-source learning community connecting Web2 and Web3 builders'},
    logoUrl: 'https://openbuild.xyz/favicon.ico',
    linkUrl: 'https://openbuild.xyz',
    featuredOnHome: true,
    openInNewTab: true,
  },
  {
    id: 'opensea',
    title: {zh: 'OpenSea', en: 'OpenSea'},
    description: {zh: '支持多链 NFT 浏览、创建与交易的数字资产市场', en: 'A multi-chain marketplace for discovering, creating and trading NFTs'},
    logoUrl: 'https://opensea.io/favicon.ico',
    linkUrl: 'https://opensea.io',
    openInNewTab: true,
  },
  {
    id: 'pancakeswap',
    title: {zh: 'PancakeSwap', en: 'PancakeSwap'},
    description: {zh: '支持多链交易与流动性服务的去中心化交易平台', en: 'A decentralized exchange for multi-chain trading and liquidity'},
    logoUrl: 'https://pancakeswap.finance/favicon.ico',
    linkUrl: 'https://pancakeswap.finance',
    openInNewTab: true,
    featuredOnHome: true,
  },
];
