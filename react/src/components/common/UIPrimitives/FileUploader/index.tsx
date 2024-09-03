import { ReactNode } from 'react'
import { DropzoneOptions, FileRejection, useDropzone } from 'react-dropzone'
import Typography from '@mui/material/Typography'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { Wrap, TextWrap, TextFiletypes } from './styles'
import FilePreview from './FilePreview'

type PropsType = DropzoneOptions & {
  fileTypeMessage?: string
  files: (File | FileRejection)[]
  onFilesDrop: (files: (File | FileRejection)[]) => void
  removeFile?: (index: number) => void
  addFile?: (name: string) => void
}

const FileUploader = ({
  maxFiles = 2,
  maxSize = 3150000,
  accept,
  fileTypeMessage,
  files,
  onFilesDrop,
  addFile,
  removeFile
}: PropsType) => {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles, rejectedFiles) => {
      onFilesDrop([...acceptedFiles, ...rejectedFiles])
    },
    accept,
    maxFiles,
    maxSize
  })

  const { ref, ...rootProps } = getRootProps()

  let displayFiles: ReactNode = null

  if (files.length) {
    displayFiles = (
      <>
        {files.map((file, idx) => (
          <FilePreview
            key={idx}
            id={idx}
            file={file}
            onFileRemove={removeFile}
            onFileUploaded={addFile}
          />
        ))}
      </>
    )
  }

  return (
    <Wrap ref={ref}>
      {displayFiles || (
        <TextWrap {...rootProps}>
          <input {...getInputProps()} />
          <div>
            <UploadFileIcon />
            <Typography>
              <span>Click to upload</span> or drag and drop
            </Typography>
            {fileTypeMessage && (
              <TextFiletypes>{fileTypeMessage}</TextFiletypes>
            )}
          </div>
        </TextWrap>
      )}
    </Wrap>
  )
}

export default FileUploader
