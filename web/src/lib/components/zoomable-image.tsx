import { cn } from 'cn'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'

interface ZoomableImageProps {
  src: string
  alt: string
  /** Longer detail shown under the picture in the modal. */
  caption?: string
  /** Classes for the thumbnail image. */
  className?: string
}

/**
 * A photo that opens full size in a modal with its caption. The thumbnail is a button, so it works with the
 * keyboard; `relative z-10` keeps it clickable when it sits inside a card whose whole surface is a button.
 */
export function ZoomableImage({ src, alt, caption, className }: ZoomableImageProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Enlarge photo: ${alt}`}
          className="relative z-10 block w-full cursor-zoom-in overflow-hidden rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <img src={src} alt="" loading="lazy" className={cn('w-full object-cover', className)} />
        </button>
      </DialogTrigger>
      {/* With no caption there is no description, so tell Radix not to expect one. */}
      <DialogContent
        className="flex max-h-[92dvh] flex-col gap-4 overflow-hidden sm:max-w-4xl"
        {...(caption ? {} : { 'aria-describedby': undefined })}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{alt}</DialogTitle>
        </DialogHeader>
        <img src={src} alt={alt} className="max-h-[70dvh] min-h-0 w-full rounded-lg object-contain" />
        {caption ? (
          <DialogDescription className="text-base leading-7 text-muted-foreground">{caption}</DialogDescription>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
