import type { ComponentPropsWithoutRef } from 'react';
import { useT } from '@/ui/i18n/useT';
import { Icon, type IconName } from './icons';
import styles from './IconButton.module.css';

interface IconButtonProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'className' | 'children'
> {
  icon: IconName;
}

/** The accessible name is the localized `toolbar.<icon>` label. */
export function IconButton({ icon, type = 'button', ...rest }: IconButtonProps) {
  const t = useT();
  return (
    <button type={type} className={styles.iconButton} aria-label={t(`toolbar.${icon}`)} {...rest}>
      <Icon name={icon} />
    </button>
  );
}
