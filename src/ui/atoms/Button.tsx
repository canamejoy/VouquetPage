import type { ComponentPropsWithRef } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'className'> {
  variant?: 'secondary' | 'primary' | 'danger';
}

export function Button({ variant = 'secondary', type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={`${styles.button} ${styles[variant]}`} {...rest} />;
}
