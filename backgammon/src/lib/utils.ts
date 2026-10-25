import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Register the px-named font-size tokens from src/index.css (@theme) so
// tailwind-merge classifies them as font-size. Otherwise it buckets e.g.
// `text-13` as a text-COLOR (13 isn't a default size) and silently drops it
// when a class string also sets a color — `cn('text-13 …', 'text-ink')` would
// lose the size and fall back to the inherited one.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        'text-10',
        'text-11',
        'text-12',
        'text-13',
        'text-14',
        'text-15',
        'text-16',
        'text-17',
        'text-18',
        'text-20',
        'text-22',
        'text-24',
        'text-28',
        'text-32',
        'text-40',
        'text-48',
        'text-64',
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
