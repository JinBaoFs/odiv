import {getTranslations} from 'next-intl/server';
import FooterDonate from './FooterDonate';
import { Link } from '@/i18n/navigation';
import { Iconfont } from './icon-font';
export async function Footer() {
  const t = await getTranslations("Footer");
  return (
    <section className="footer">
      <div className="line">
        <a href="mailto:13631531284@163.com" className="line-text">📧E-mail</a>
        <a href="tel:13631531284" className="line-text">📱Phone</a>
        <FooterDonate />
      </div>
      <div className="btn-group">
        <Link href="https://github.com/JinBaoFs" target='_blank' className="item-btn">
          <Iconfont name="icon-tg" size={20} />
          <span>Telegram</span>
        </Link>
        <Link href="https://github.com/JinBaoFs" target='_blank' className="item-btn">
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAAXNSR0IArs4c6QAAAlFJREFUWEfVmLtKA0EUhg1iETD2ETtJbATFlHaxtLFSMAHB0sZOsPLSCGkkCj5BougrCNamWBMrQ6JdRDshEawk4pn9zcwwl911i9k0k90zc+afb8+cuaTG9L+hb0oZ6sRhMvZj6txZgSSsXNokOrX6JShhMBAelZ7gx9AP+VcRTJbAp3abRuJ5D1RixMAHe1Ccsh/ZvwzNStAlgcKnDUsmKEFdvUH/k0ydbkeIeZ5gMgViZP8lhPaZqUmlq8gEEyOQi41YYBYKS+RHBhA6BhXo3RKIvPV1dxSLMDhJFw/or0wyNEFnBWIN7jevBXKZxXXhedC6MZLV1Z/4YCuUTBJAsKJo82DiBILE7doyjfzq+Z3Kau1ESdBWP3aCtg5llbb6EQSO+0vdBvVVq7PY6zfZfhAdbs/PClpsBHX1RwKP/dm8QKXnPfr+vyn8uBhMuEBbErw/rAaKTZAb5cOYCDogEBLMn9omVGcPSw5+FDtq9wRqjpfhhO6W9wV4F+dbSpjpIou5fI5lg073RZi1cqNfgokRqPvsNIB8Li+NOFo0jsiJZw+dN56gmwKzjSERWjkrkUDuJsGPFUYu7p+879MSdF4glEPo9E6BXmFfhthDPZzKdIepoHZ532eKQbI5L5AbAcVktsGyT6Y8589eNutwN4ObB/lQFdZuI6m9m3FZIGBK+e8vb5EdpzEFAWpns9vuBXU5j49VtwRWeiwf7s2ob4UrPRaTMdiNN7VcP+KO2lmBEIZve/oqZqS3FnuurLISdrxH7bB2tJP9yPkw5brAHy6QY3VmdklZAAAAAElFTkSuQmCC" alt="GitHub"></img>
          <span>GitHub</span>
        </Link>
      </div>
      <div className="tips">{t('tips')}</div>
    </section>
  );
}
