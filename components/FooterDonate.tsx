'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Iconfont } from './icon-font';

type TabType =
  | 'alipay'
  | 'wechat'
  | 'wallet';

export default function FooterDonate() {
  const t = useTranslations('Footer');
  const [open, setOpen] = useState(false);

  const [tab, setTab] =
    useState<TabType>('alipay');

  const [copied, setCopied] = useState(false);

  const images = {
    alipay: '/images/alipay.png',
    wechat: '/images/wechat.png',
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText('0x1234567890abcdef...');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <span 
        className="line-text" 
        onClick={() => setOpen(true)}
      >
        {t('coffee')}
      </span>

      {open && (
        <div
          className="donate-mask"
          onClick={() => setOpen(false)}
        >
          <div
            className="donate-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            <h3>{t('coffeeTitle')}</h3>

            <div className="tabs">
              <button 
                className={ tab === 'alipay' ? 'active' : '' }
                onClick={() => setTab('alipay') }
              >
                <Iconfont name="icon-alipay" size={20} />
                {t('alipay')}
              </button>

              <button
                className={ tab === 'wechat' ? 'active' : '' }
                onClick={() => setTab('wechat') }
              >
                <Iconfont name="icon-wechat" size={20} />
                {t('wechat')}
              </button>

              <button 
                className={ tab === 'wallet' ? 'active' : ''} 
                onClick={() => setTab('wallet')}
              >
                <Iconfont name="icon-wallet" size={20} />
                {t('wallet')}
              </button>
            </div>

            <div className="qrcode flex justify-center items-center">
              {tab === 'wallet' ? (
                <div className="wallet-box">
                  <div className="text03 text-sm">USDT (BSC)</div>
                  <div className="wallet-address py-2">0x1234567890abcdef...</div>
                  <div
                    className={`text-sm cursor-pointer ${copied ? 'copied' : ''}`}
                    onClick={handleCopy}
                  >
                    {copied ? t('copySuccess') : t('copyAddress')}
                  </div>
                </div>
              ) : (
                <img src={images[tab]} alt={tab} />
              )}
            </div>

            <p className="tip"> {t('thankYouBoss')}</p>
          </div>
        </div>
      )}
    </>
  );
}