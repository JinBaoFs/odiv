import { getTranslations, getLocale } from 'next-intl/server';
import { Iconfont } from '@/components/icon-font';
import { Link } from '@/i18n/navigation';
import "./page.scss"

type Locale = 'zh' | 'en';

type Item = {
  name: string;
  desc_zh: string;
  desc_en: string;
  follower_count: number;
  date: string;
  btnGroup: {
    type: number;
    btnText: string;
    linkUrl: string;
  }[];
  linkUrl?: string;
};

export default async function ProjectsPage() {
  const t = await getTranslations('Projects');
  const desc = t('description');
  const locale = await getLocale() as Locale;
  const PROJECT_LIST:Array<Item> = [
    {
      name: 'ChainCather',
      desc_zh: '专业的 Crypto 与 Fintech 资讯与研究平台',
      desc_en: 'Professional Crypto & Fintech News and Research Platform',
      follower_count: 3250,
      date: '2026',
      btnGroup:[
        {
          type: 1,
          btnText: t('source'),
          linkUrl: 'https://www.chaincatcher.com/',
        },
        {
          type: 1,
          btnText: t('demo'),
          linkUrl: 'https://www.chaincatcher.com/',
        }
      ]
    },
    {
      name: 'RootData',
      desc_zh: '一个已成为超过 200 万 Web3 资产数据平台',
      desc_en: 'It is a Web3 asset data platform that has grown to serve over 2 million users.',
      follower_count: 2580,
      linkUrl: 'https://www.rootdata.com/',
      date: '2025',
      btnGroup:[
        {
          type: 1,
          btnText: t('source'),
          linkUrl: 'https://www.rootdata.com/',
        }
      ]
    },
  ]
  return (
    <div className="container-wrap">
      <div className="o-title">
        <Iconfont name="icon-project" size={42} tx={-8}/>
        <h1 className="o-title-text">{t('title')}</h1>
      </div>
      <div
        className="o-desc mt-2"
        dangerouslySetInnerHTML={{__html: desc}}
      />
      <section className="list-container">
        {PROJECT_LIST.map((item,idx)=>{
          const descKey: `desc_${Locale}` = `desc_${locale}`;
          return (
            <div className="list-item" key={idx}>
              <div className="item-top">
                <span className="date">{item.date}</span>
                <div className="flower">
                  <span>{item.follower_count}</span>
                  <Iconfont name="icon-flow" size={14}/>
                </div>
              </div>
              <div className="item-name">{item.name}</div>
              <div className="item-desc two-line-ellipsis">{item[descKey]}</div>
              <div className="item-group-btn">
                {item.btnGroup.map((row,rowIdx)=> {
                  return (
                    <Link href={row.linkUrl} key={rowIdx} target='_blank' className='item-btn'>{ row.btnText }</Link>
                  )})
                }
              </div>
            </div>
          )
        })}
      </section>
    </div>
  );
}
