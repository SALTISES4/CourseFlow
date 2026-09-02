import CloseIcon from '@mui/icons-material/Close'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import { normalizeLocale } from '@cf/i18n'
import Stack from '@mui/material/Stack'
import { useEffect, useState } from 'react'
import { FileRejection } from 'react-dropzone'
import { useTranslation } from 'react-i18next'

import { FileInfo, FileName, FileWrap } from './styles'

type PropsType = {
  id: number
  file: File | FileRejection
  onFileRemove?: (index: number) => void
  onFileUploaded?: (name: string) => void
}

function getReadableFilesize(
  bytes: number,
  locale: string,
  format: (size: string, unit: 'kilobytes' | 'megabytes') => string
): string {
  let size = bytes / 1024
  let unit: 'kilobytes' | 'megabytes' = 'kilobytes'

  if (size > 1000) {
    size = size / 1024
    unit = 'megabytes'
  }

  const localizedSize = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(size)
  return format(localizedSize, unit)
}

function randomInt(max: number) {
  return Math.ceil(Math.random() * max)
}

const FilePreview = ({ id, file, onFileRemove, onFileUploaded }: PropsType) => {
  const { t, i18n } = useTranslation('common')
  const [progress, setProgress] = useState(0)
  const hasErrors = 'errors' in file

  // NOTE: Fake "uploading" behavior
  useEffect(() => {
    if (hasErrors) {
      return
    }
    if (progress < 100) {
      setTimeout(() => {
        setProgress(Math.min(progress + randomInt(15), 100))
      }, 300)
    } else {
      onFileUploaded?.(file.name)
    }
  }, [progress, hasErrors, onFileUploaded, file])

  const name = !hasErrors ? file.name : t('fileUpload.uploadFailed')
  const color = !hasErrors ? 'primary' : 'error'
  const status = !hasErrors
    ? progress === 100
      ? t('fileUpload.complete')
      : t('fileUpload.loading')
    : t('fileUpload.failed')
  const locale = normalizeLocale(i18n.resolvedLanguage)

  return (
    <FileWrap error={hasErrors}>
      <Stack direction="row" gap={2} alignItems="center">
        <UploadFileIcon sx={{ flexShrink: 0 }} color={color} />
        <Stack gap={1} direction="column" sx={{ minWidth: 0, flexGrow: 1 }}>
          <FileName>{name}</FileName>
          <FileInfo>
            {!hasErrors ? (
              <span>
                {getReadableFilesize(file.size, locale, (size, unit) =>
                  t('fileUpload.fileSize', {
                    size,
                    unit: t(`fileUpload.units.${unit}`)
                  })
                )}
              </span>
            ) : (
              <ul>
                {file.errors.map((e) => {
                  const message = (() => {
                    switch (e.code) {
                      case 'file-too-large':
                        return t('fileUpload.fileTooLarge')
                      case 'file-too-small':
                        return t('fileUpload.fileTooSmall')
                      case 'file-invalid-type':
                        return t('fileUpload.invalidType')
                      case 'too-many-files':
                        return t('fileUpload.tooManyFiles')
                      default:
                        return t('fileUpload.rejected')
                    }
                  })()
                  return <li key={e.code}>{message}</li>
                })}
              </ul>
            )}
            <span>•</span>
            <span>{status}</span>
          </FileInfo>
          <LinearProgress
            variant="determinate"
            value={hasErrors ? 0 : progress}
            color={color}
          />
        </Stack>
        <IconButton
          sx={{ flexShrink: 0 }}
          aria-label={t('fileUpload.removeFile')}
          size="medium"
          onClick={() => onFileRemove && onFileRemove(id)}
        >
          <CloseIcon />
        </IconButton>
      </Stack>
    </FileWrap>
  )
}

export default FilePreview
