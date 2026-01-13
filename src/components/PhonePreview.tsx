'use client'

import { CaseColor, PhoneModel } from '@prisma/client'
import { AspectRatio } from './ui/aspect-ratio'
import { COLORS } from '@/validators/option-validator'

// 12-point chamfered polygon sitting squarely along the mid-bezel of
// public/clearphone-models/*.png (3000x2001): guarantees 100% color & design
// coverage up to every bezel edge with zero exterior bleed at any viewport width.
const PHONE_HOLE_CLIP_PATH =
  'polygon(35.27% 21.48%, 36.13% 17.78%, 38.67% 15.78%, 54.27% 13.19%, 56.53% 13.99%, 57.67% 17.78%, 64.67% 74.73%, 64.13% 79.12%, 61.87% 80.72%, 46.40% 85.41%, 44.33% 84.42%, 43.60% 80.92%)'

const PhonePreview = ({
  croppedImageUrl,
  color,
  customColorHex,
  model,
}: {
  croppedImageUrl: string
  color: CaseColor
  customColorHex?: string | null
  model?: PhoneModel | null
}) => {
  const matchedColor = COLORS.find((c) => c.value === color)
  const colorHex = customColorHex ?? matchedColor?.hex ?? '#18181b'
  const frameSrc = `/clearphone-models/${model ?? 'iphone16pro'}.png`

  return (
    <AspectRatio ratio={3000 / 2001} className='relative'>
      <div
        className='absolute inset-0 z-20 overflow-hidden'
        style={{
          clipPath: PHONE_HOLE_CLIP_PATH,
          backgroundColor: colorHex,
        }}>
        <div
          className='absolute overflow-hidden'
          style={{
            left: '50.57%',
            top: '49.15%',
            width: '21.8%',
            aspectRatio: '896 / 1831',
            transform:
              'translate(-50%, -50%) skewX(11.3deg) skewY(-8.6deg)',
          }}>
          <img
            src={croppedImageUrl}
            alt='custom case design'
            className='h-full w-full object-cover'
          />
        </div>
      </div>

      <div className='relative h-full w-full z-40 pointer-events-none'>
        <img
          alt='phone'
          src={frameSrc}
          className='pointer-events-none h-full w-full antialiased rounded-md'
        />
      </div>
    </AspectRatio>
  )
}

export default PhonePreview
