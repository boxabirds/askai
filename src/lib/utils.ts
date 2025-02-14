/**
 * Authored by Claude Sonnet 3.5 via Windsurf
 * This utility function combines two libraries to handle Tailwind CSS class merging:
 * 
 * 1. clsx (https://github.com/lukeed/clsx):
 *    - A tiny (228B) utility for constructing className strings conditionally
 *    - Similar to classnames but much smaller
 *    Example:
 *    ```ts
 *    clsx('foo', { bar: true, baz: false }, ['qux']) // => 'foo bar qux'
 *    ```
 * 
 * 2. tailwind-merge (https://github.com/dcastil/tailwind-merge):
 *    - Handles Tailwind CSS class conflicts
 *    - Prevents style clashes when classes override each other
 *    Example:
 *    ```ts
 *    twMerge('px-2 py-1 bg-red-500 bg-blue-500') // => 'px-2 py-1 bg-blue-500'
 *    ```
 * 
 * This pattern originates from the shadcn/ui component library:
 * https://github.com/shadcn-ui/ui/blob/main/apps/www/lib/utils.ts
 * 
 * The need for this utility arises from three main challenges:
 * 
 * 1. Conditional Classes:
 *    ```ts
 *    cn('base-style', isActive && 'active', isBig && 'text-lg')
 *    ```
 * 
 * 2. Class Conflicts:
 *    ```ts
 *    // Without tailwind-merge, the text would be blue
 *    cn('text-red-500', props.className) // props.className might include 'text-blue-500'
 *    ```
 * 
 * 3. Component Composition:
 *    ```ts
 *    <Button className={cn(
 *      'default-button-styles',
 *      variant === 'primary' && 'primary-styles',
 *      className // user-provided classes
 *    )}>
 *    ```
 * 
 * While this approach is not universal, it's particularly useful when:
 * - Building a component library with Tailwind CSS
 * - Needing to merge user-provided classes with component defaults
 * - Handling responsive/state variants that might conflict
 * 
 * Alternative approaches include:
 * - Template literals: `className={\`base $\{isActive ? 'active' : ''}\`}`
 * - classnames package: classNames({ active: isActive })
 * - CSS Modules
 * - CSS-in-JS solutions
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
/**
 * Merge multiple class names with Tailwind CSS conflict resolution
 * @param inputs - Any number of class names, objects, or arrays
 * @returns Merged class string with conflicts resolved
 * @example
 * cn('px-2 py-1', isLarge && 'text-lg', 'bg-blue-500 bg-red-500')
 * // If isLarge is true: 'px-2 py-1 text-lg bg-red-500'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
