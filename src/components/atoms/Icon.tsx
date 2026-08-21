import { icons, type IconDef, type IconName } from '../../data/icons';

interface IconProps {
  name: IconName;
  className?: string;
}

/** Versión React del átomo Icon (comparte el registro de `data/icons`). */
export function Icon({ name, className }: IconProps) {
  const icon: IconDef = icons[name];
  return (
    <svg
      className={className}
      viewBox={icon.viewBox ?? '0 0 24 24'}
      fill={icon.fill ? 'currentColor' : 'none'}
      stroke={icon.fill ? 'none' : 'currentColor'}
      strokeWidth={icon.strokeWidth ?? 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  );
}
