// bg-zinc-900 border-zinc-900
// bg-blue-950 border-blue-950
// bg-rose-950 border-rose-950

import { PRODUCT_PRICES } from '@/config/products'

export const COLORS = [
  { label: 'Black', value: 'black', tw: 'zinc-900', hex: '#18181b' },
  { label: 'Titanium', value: 'titanium', tw: 'stone-500', hex: '#78716c' },
  { label: 'Sand', value: 'sand', tw: 'stone-300', hex: '#d6c7b2' },
  { label: 'White', value: 'white', tw: 'zinc-100', hex: '#f4f4f5' },
  { label: 'Blue', value: 'blue', tw: 'blue-950', hex: '#172554' },
  { label: 'Sage', value: 'sage', tw: 'emerald-900', hex: '#4a6b53' },
  { label: 'Lavender', value: 'lavender', tw: 'violet-300', hex: '#b8a9d9' },
  { label: 'Blush', value: 'blush', tw: 'pink-200', hex: '#f2c6d4' },
  { label: 'Rose', value: 'rose', tw: 'rose-950', hex: '#4c0519' },
  { label: 'Burgundy', value: 'burgundy', tw: 'red-950', hex: '#6b1d2f' },
] as const

export const MODELS = {
  name: 'models',
  options: [
    {
      label: 'iPhone 16 Pro Max',
      value: 'iphone16promax',
      size: '6.9"',
    },
    {
      label: 'iPhone 16 Pro',
      value: 'iphone16pro',
      size: '6.3"',
    },
    {
      label: 'iPhone 16',
      value: 'iphone16',
      size: '6.1"',
    },
    {
      label: 'iPhone 15 Pro Max',
      value: 'iphone15promax',
      size: '6.7"',
    },
    {
      label: 'iPhone 15 Pro',
      value: 'iphone15pro',
      size: '6.1"',
    },
    {
      label: 'iPhone 15',
      value: 'iphone15',
      size: '6.1"',
    },
    {
      label: 'iPhone 14 Pro Max',
      value: 'iphone14promax',
      size: '6.7"',
    },
    {
      label: 'iPhone 14 Pro',
      value: 'iphone14pro',
      size: '6.1"',
    },
    {
      label: 'iPhone 14',
      value: 'iphone14',
      size: '6.1"',
    },
    {
      label: 'iPhone 13 Pro Max',
      value: 'iphone13promax',
      size: '6.7"',
    },
    {
      label: 'iPhone 13 Pro',
      value: 'iphone13pro',
      size: '6.1"',
    },
    {
      label: 'iPhone 13',
      value: 'iphone13',
      size: '6.1"',
    },
    {
      label: 'iPhone 12',
      value: 'iphone12',
      size: '6.1"',
    },
    {
      label: 'iPhone 11',
      value: 'iphone11',
      size: '6.1"',
    },
    {
      label: 'iPhone X',
      value: 'iphonex',
      size: '5.8"',
    },
  ],
} as const

export const MATERIALS = {
  name: 'material',
  options: [
    {
      label: 'Silicone',
      value: 'silicone',
      description: undefined,
      price: PRODUCT_PRICES.material.silicone,
    },
    {
      label: 'Soft Polycarbonate',
      value: 'polycarbonate',
      description: 'Scratch-resistant coating',
      price: PRODUCT_PRICES.material.polycarbonate,
    },
  ],
} as const

export const FINISHES = {
  name: 'finish',
  options: [
    {
      label: 'Smooth Finish',
      value: 'smooth',
      description: undefined,
      price: PRODUCT_PRICES.finish.smooth,
    },
    {
      label: 'Textured Finish',
      value: 'textured',
      description: 'Soft grippy texture',
      price: PRODUCT_PRICES.finish.textured,
    },
  ],
} as const
