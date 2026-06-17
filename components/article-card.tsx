import {CalendarDays, Clock3} from 'lucide-react';

type ArticleCardProps = {
  title: string;
  excerpt: string;
  tag: string;
  date: string;
  readingTime: string;
};

export function ArticleCard({title, excerpt, tag, date, readingTime}: ArticleCardProps) {
  return (
    <article className="articleCard">
      <span className="pill">{tag}</span>
      <h3>{title}</h3>
      <p>{excerpt}</p>
      <div className="metaRow">
        <span><CalendarDays size={16} /> {date}</span>
        <span><Clock3 size={16} /> {readingTime}</span>
      </div>
    </article>
  );
}
