import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock next/image as a plain <img> tag
vi.mock('next/image', () => ({
  default: ({ alt, src, priority, unoptimized, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string
    priority?: boolean
    unoptimized?: boolean
  }) => {
    void priority
    void unoptimized
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt ?? ''} src={src ?? ''} {...props} />
  },
}))
