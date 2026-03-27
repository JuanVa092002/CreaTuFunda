'use server'

import { db } from '@/db'
import {
  createUploadSignature,
  getCloudinaryConfig,
  isCloudinaryUrl,
} from '@/lib/cloudinary'

export type UploadScope = 'uploads' | 'designs'

export type UploadSignatureResponse = {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
}

export async function requestUploadSignature(
  scope: UploadScope
): Promise<UploadSignatureResponse> {
  if (scope !== 'uploads' && scope !== 'designs') {
    throw new Error('Unsupported upload scope.')
  }

  const { folder } = getCloudinaryConfig()
  return createUploadSignature(`${folder}/${scope}`)
}

export async function createConfiguration({
  imageUrl,
  width,
  height,
}: {
  imageUrl: string
  width: number
  height: number
}): Promise<{ configId: string }> {
  if (!isCloudinaryUrl(imageUrl, 'uploads')) {
    throw new Error('The uploaded image does not belong to this Cloudinary account.')
  }

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error('The uploaded image has invalid dimensions.')
  }

  const configuration = await db.configuration.create({
    data: { imageUrl, width, height },
  })

  return { configId: configuration.id }
}

export async function saveCroppedImage({
  configId,
  imageUrl,
}: {
  configId: string
  imageUrl: string
}): Promise<{ configId: string }> {
  if (!isCloudinaryUrl(imageUrl, 'designs')) {
    throw new Error('The cropped image does not belong to this Cloudinary account.')
  }

  const configuration = await db.configuration.update({
    where: { id: configId },
    data: { croppedImageUrl: imageUrl },
  })

  return { configId: configuration.id }
}
