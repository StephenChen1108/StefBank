import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock next/image as a plain <img> tag
vi.mock('next/image', () => ({
  default: ({ alt, src, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt ?? ''} src={src ?? ''} {...props} />
  },
}))
