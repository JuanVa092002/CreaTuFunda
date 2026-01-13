'use client'

import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { uploadToCloudinary } from '@/lib/cloudinary-upload'
import { cn } from '@/lib/utils'
import { Image, Loader2, MousePointerSquareDashed } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import Dropzone, { FileRejection } from 'react-dropzone'
import { useLocale } from '@/components/LanguageContext'
import {
  createConfiguration,
  requestUploadSignature,
} from './actions'

const MAX_FILE_SIZE = 4 * 1024 * 1024

const Page = () => {
  const { toast } = useToast()
  const { t } = useLocale()
  const [isDragOver, setIsDragOver] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const onDropRejected = (rejectedFiles: FileRejection[]) => {
    const [file] = rejectedFiles
    setIsDragOver(false)

    const tooLarge = file?.errors.some((error) => error.code === 'file-too-large')

    toast({
      title: tooLarge
        ? t.upload.fileTypesHint
        : `${file?.file.type || ''} ${t.upload.invalidTypeTitle}`.trim(),
      description: t.upload.invalidTypeDesc,
      variant: 'destructive',
    })
  }

  const onDropAccepted = async (acceptedFiles: File[]) => {
    const [file] = acceptedFiles
    setIsDragOver(false)

    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const signature = await requestUploadSignature('uploads')
      const uploaded = await uploadToCloudinary({
        file,
        signature,
        onProgress: setUploadProgress,
      })

      const { configId } = await createConfiguration({
        imageUrl: uploaded.secure_url,
        width: uploaded.width,
        height: uploaded.height,
      })

      startTransition(() => {
        router.push(`/configure/design?id=${configId}`)
      })
    } catch (error) {
      setIsUploading(false)
      toast({
        title: t.upload.uploadFailedTitle,
        description:
          error instanceof Error
            ? error.message
            : t.upload.uploadFailedFallback,
        variant: 'destructive',
      })
    }
  }

  return (
    <div
      className={cn(
        'relative h-full flex-1 my-16 w-full rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:rounded-2xl flex justify-center flex-col items-center',
        {
          'ring-blue-900/25 bg-blue-900/10': isDragOver,
        }
      )}>
      <div className='relative flex flex-1 flex-col items-center justify-center w-full'>
        <Dropzone
          onDropRejected={onDropRejected}
          onDropAccepted={onDropAccepted}
          maxSize={MAX_FILE_SIZE}
          maxFiles={1}
          disabled={isUploading}
          accept={{
            'image/png': ['.png'],
            'image/jpeg': ['.jpeg', '.jpg'],
          }}
          onDragEnter={() => setIsDragOver(true)}
          onDragLeave={() => setIsDragOver(false)}>
          {({ getRootProps, getInputProps }) => (
            <div
              className='h-full w-full flex-1 flex flex-col items-center justify-center'
              {...getRootProps()}>
              <input {...getInputProps()} />
              {isDragOver ? (
                <MousePointerSquareDashed className='h-6 w-6 text-zinc-500 mb-2' />
              ) : isUploading || isPending ? (
                <Loader2 className='animate-spin h-6 w-6 text-zinc-500 mb-2' />
              ) : (
                <Image className='h-6 w-6 text-zinc-500 mb-2' />
              )}
              <div className='flex flex-col justify-center mb-2 text-sm text-zinc-700'>
                {isUploading ? (
                  <div className='flex flex-col items-center'>
                    <p>{t.upload.uploading}</p>
                    <Progress
                      value={uploadProgress}
                      className='mt-2 w-40 h-2 bg-gray-300'
                    />
                  </div>
                ) : isPending ? (
                  <div className='flex flex-col items-center'>
                    <p>{t.upload.redirecting}</p>
                  </div>
                ) : isDragOver ? (
                  <p>
                    <span className='font-semibold'>{t.upload.dropHere}</span>{' '}
                    {t.upload.toUpload}
                  </p>
                ) : (
                  <p>
                    <span className='font-semibold'>
                      {t.upload.clickToUpload}
                    </span>{' '}
                    {t.upload.orDragAndDrop}
                  </p>
                )}
              </div>

              {isPending ? null : (
                <p className='text-xs text-zinc-500'>{t.upload.fileTypesHint}</p>
              )}
            </div>
          )}
        </Dropzone>
      </div>
    </div>
  )
}

export default Page
