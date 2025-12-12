import Image from 'next/image'

import { cn } from '@/lib/utils'

type LoginAccentProps = React.ComponentPropsWithoutRef<'div'>

export function LoginAccent({ className, ...props }: LoginAccentProps) {
  return (
    <div
      className={cn('pointer-events-none relative block h-full w-full', className)}
      {...props}
    >
      <Image
        src="/vector-7.png"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 45vw, 100vw"
        className="object-contain object-center"
      />
    </div>
  )
}
