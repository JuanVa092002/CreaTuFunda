export type CloudinaryUploadResult = {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  bytes: number
  resource_type: string
}

export type UploadSignature = {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
}

type UploadArgs = {
  file: File
  signature: UploadSignature
  onProgress?: (percent: number) => void
}

type CloudinaryErrorResponse = {
  error?: { message?: string }
}

/**
 * Uploads a file straight from the browser to Cloudinary using a short lived
 * signature issued by a server action. XHR is used instead of fetch because
 * only XHR exposes upload progress events.
 */
export function uploadToCloudinary({
  file,
  signature,
  onProgress,
}: UploadArgs): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', signature.apiKey)
    formData.append('timestamp', String(signature.timestamp))
    formData.append('signature', signature.signature)
    formData.append('folder', signature.folder)

    const xhr = new XMLHttpRequest()
    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`
    )

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      let payload: CloudinaryUploadResult & CloudinaryErrorResponse

      try {
        payload = JSON.parse(xhr.responseText)
      } catch {
        reject(new Error('Cloudinary returned an unreadable response.'))
        return
      }

      if (xhr.status >= 200 && xhr.status < 300 && payload.secure_url) {
        onProgress?.(100)
        resolve(payload)
        return
      }

      reject(
        new Error(
          payload.error?.message ?? `Cloudinary upload failed (${xhr.status}).`
        )
      )
    }

    xhr.onerror = () => {
      reject(new Error('Network error while uploading the image.'))
    }

    xhr.onabort = () => {
      reject(new Error('The upload was cancelled.'))
    }

    xhr.send(formData)
  })
}
