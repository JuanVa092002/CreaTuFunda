import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface PhoneProps extends HTMLAttributes<HTMLDivElement> {
  imgSrc: string
  dark?: boolean
  model?: string | null
}

const Phone = ({
  imgSrc,
  className,
  dark = false,
  model,
  ...props
}: PhoneProps) => {
  const templateSrc = model
    ? `/phone-templates/${model}.png`
    : dark
      ? '/phone-template-dark-edges.png'
      : '/phone-template-white-edges.png'

  return (
    <div
      className={cn(
        'relative pointer-events-none z-50 overflow-hidden',
        model && 'rounded-[13.2%/6.4%]',
        className
      )}
      {...props}>
      <img
        src={templateSrc}
        className='pointer-events-none z-50 select-none'
        alt='phone image'
      />

      <div className='absolute -z-10 inset-0'>
        <img
          className='object-cover min-w-full min-h-full'
          src={imgSrc}
          alt='overlaying phone image'
        />
      </div>
    </div>
  )
}

export default Phone
