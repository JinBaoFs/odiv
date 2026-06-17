// components/Iconfont.tsx
type IconfontProps = {
  name: string;      // 不带 # 的部分，例如 "icon-home"
  className?: string;
  size?: number;     // px
};

export function Iconfont({ name, className, size = 16 }: IconfontProps) {
  return (
    <svg
      className={className ?? 'icon'}
      aria-hidden="true"
      width={size}
      height={size}
      style={{ width: size, height: size }}
    >
      <use xlinkHref={`#${name}`} />
    </svg>
  );
}