import {Iconfont} from '@/components/icon-font';
import {Link} from '@/i18n/navigation';
import type {ProjectItem} from '@/config/projects';
import styles from './project-list.module.scss';

type ProjectListProps = {
  projects: ProjectItem[];
  getDescription: (id: ProjectItem['id']) => string;
  getActionLabel: (label: ProjectItem['actions'][number]['label']) => string;
};

export function ProjectList({projects, getDescription, getActionLabel}: ProjectListProps) {
  return (
    <ul className={styles.list}>
      {projects.map((project) => (
        <li className={styles.item} key={project.id}>
          <div className={styles.top}>
            <span className={styles.date}>{project.date}</span>
            <span className={styles.followers}><span>{project.followerCount}</span><Iconfont name="icon-flow" size={14} /></span>
          </div>
          <h3 className={styles.name}>{project.name}</h3>
          <p className={styles.description}>{getDescription(project.id)}</p>
          <div className={styles.actions}>
            {project.actions.map((action) => (
              <Link href={action.href} key={`${action.label}-${action.href}`} target={action.openInNewTab ? '_blank' : undefined} rel={action.openInNewTab ? 'noopener noreferrer' : undefined} className={styles.action}>
                {getActionLabel(action.label)}
              </Link>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
