import crypto from 'node:crypto'

export type CloudinaryConfig = {
  cloudName: string
  apiKey: string
  apiSecret: string
  folder: string
}

export class CloudinaryConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CloudinaryConfigError'
  }
}

const CONFIG_ERROR =
  'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.'

export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const folder = process.env.CLOUDINARY_FOLDER ?? 'custom-phone-cases'

  if (!cloudName || !apiKey || !apiSecret) {
    throw new CloudinaryConfigError(CONFIG_ERROR)
  }

  return { cloudName, apiKey, apiSecret, folder }
}

export type UploadSignature = {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
}

/**
 * Builds the parameters for a signed direct upload from the browser.
 *
 * Cloudinary signs the alphabetically sorted upload parameters joined as
 * `key=value&key=value` followed by the API secret. Only `folder` and
 * `timestamp` are signed here, so the browser cannot push files into any
 * other folder of the account.
 */
export function createUploadSignature(folder: string): UploadSignature {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig()
  const timestamp = Math.round(Date.now() / 1000)
  const signature = crypto
    .createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex')

  return { cloudName, apiKey, timestamp, signature, folder }
}

/**
 * Rejects any URL that does not point at this account's Cloudinary delivery
 * endpoint inside the expected folder. Server actions use it so a caller
 * cannot persist an arbitrary external URL as a design asset.
 */
export function isCloudinaryUrl(url: string, scope: string): boolean {
  const { cloudName, folder } = getCloudinaryConfig()

  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === 'res.cloudinary.com' &&
      parsed.pathname.startsWith(`/${cloudName}/image/upload/`) &&
      parsed.pathname.includes(`/${folder}/${scope}/`)
    )
  } catch {
    return false
  }
}
