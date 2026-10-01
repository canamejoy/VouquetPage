import styles from './SegmentedSwitch.module.css';

interface SegmentedSwitchProps<T extends string> {
  /** Accessible name of the group, already localized by the caller. */
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedSwitch<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedSwitchProps<T>) {
  return (
    <div role="group" aria-label={label} className={styles.group}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.option}
          aria-pressed={option.value === value}
          onClick={() => {
            if (option.value !== value) onChange(option.value);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
