import CloseIcon from '@mui/icons-material/Close'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import { useEffect, useState } from 'react'
import { FileRejection } from 'react-dropzone'

import { FileInfo, FileName, FileWrap } from './styles'

type PropsType = {
  id: number
  file: File | FileRejection
  onFileRemove?: (index: number) => void
  onFileUploaded?: (name: string) => void
}

function getReadableFilesize(bytes: number): string {
  let size = bytes / 1024
  let unit = 'kb'

  if (size > 1000) {
    size = size / 1024
    unit = 'mb'
  }

  return `${size.toFixed(2)}${unit}`
}

function randomInt(max: number) {
  return Math.ceil(Math.random() * max)
}

const FilePreview = ({ id, file, onFileRemove, onFileUploaded }: PropsType) => {
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
      onFileUploaded && onFileUploaded(file.name)
    }
  }, [progress, hasErrors, onFileUploaded, file])

  const name = !hasErrors ? file.name : 'Upload failed'
  const color = !hasErrors ? 'primary' : 'error'
  const status = !hasErrors
    ? progress === 100
      ? 'Complete'
      : 'Loading'
    : 'Failed'

  return (
    <FileWrap error={hasErrors}>
      <Stack direction="row" gap={2} alignItems="center">
        <UploadFileIcon sx={{ flexShrink: 0 }} color={color} />
        <Stack gap={1} direction="column" sx={{ minWidth: 0, flexGrow: 1 }}>
          <FileName>{name}</FileName>
          <FileInfo>
            {!hasErrors ? (
              <span>{getReadableFilesize(file.size)}</span>
            ) : (
              <ul>
                {file.errors.map((e) => {
                  let message = e.message
                  if (e.code === 'file-too-large') {
                    message = 'File too large'
                  }
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
          aria-label="Remove file"
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
