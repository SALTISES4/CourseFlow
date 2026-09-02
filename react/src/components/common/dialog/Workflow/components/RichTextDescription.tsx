import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormLabel from '@mui/material/FormLabel'
import Stack from '@mui/material/Stack'
import { useEffect, useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  value: string
  onChange?: (value: string) => void
  label?: string
  readOnly?: boolean
}

type EditorCommand = {
  label: string
  command: string
  value?: string
  text: string
}

function normalizeLink(value: string): string | null {
  const clean = value.trim()
  if (!clean) {
    return null
  }
  if (/^(https?:|mailto:)/i.test(clean)) {
    return clean
  }
  return `https://${clean}`
}

/** Shared lightweight HTML editor for persisted workflow descriptions. */
const RichTextDescription = ({
  value,
  onChange,
  label,
  readOnly = false
}: Props) => {
  const { t } = useTranslation('workflow')
  const editorRef = useRef<HTMLDivElement>(null)
  const editorId = useId()
  const labelId = `${editorId}-label`
  const localizedLabel = label ?? t('richText.description')
  const commands: EditorCommand[] = [
    { label: t('richText.bold'), command: 'bold', text: 'B' },
    { label: t('richText.italic'), command: 'italic', text: 'I' },
    { label: t('richText.underline'), command: 'underline', text: 'U' },
    {
      label: t('richText.superscript'),
      command: 'superscript',
      text: 'x²'
    },
    { label: t('richText.subscript'), command: 'subscript', text: 'x₂' },
    {
      label: t('richText.bulletedList'),
      command: 'insertUnorderedList',
      text: `• ${t('richText.list')}`
    },
    {
      label: t('richText.numberedList'),
      command: 'insertOrderedList',
      text: `1. ${t('richText.list')}`
    }
  ]

  useEffect(() => {
    const editor = editorRef.current
    if (
      editor &&
      editor.innerHTML !== value &&
      document.activeElement !== editor
    ) {
      editor.innerHTML = value
    }
  }, [value])

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, commandValue)
    onChange?.(editorRef.current?.innerHTML ?? '')
  }

  const createLink = () => {
    const link = normalizeLink(window.prompt(t('richText.linkUrl')) ?? '')
    if (link) {
      runCommand('createLink', link)
    }
  }

  return (
    <Box>
      <FormLabel id={labelId} component="label" htmlFor={editorId}>
        {localizedLabel}
      </FormLabel>
      {!readOnly && (
        <Stack
          role="toolbar"
          aria-label={t('richText.toolbar')}
          direction="row"
          flexWrap="wrap"
          gap={0.5}
          sx={{ mt: 0.5, mb: 0.5 }}
        >
          {commands.map(({ label: commandLabel, command, value, text }) => (
            <Button
              key={command}
              type="button"
              aria-label={commandLabel}
              size="small"
              variant="outlined"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => runCommand(command, value)}
              sx={{ minWidth: 32, px: 0.75 }}
            >
              {text}
            </Button>
          ))}
          <Button
            type="button"
            aria-label={t('richText.link')}
            size="small"
            variant="outlined"
            onMouseDown={(event) => event.preventDefault()}
            onClick={createLink}
            sx={{ minWidth: 32, px: 0.75 }}
          >
            {t('richText.link')}
          </Button>
        </Stack>
      )}
      <Box
        ref={editorRef}
        id={editorId}
        role="textbox"
        aria-labelledby={labelId}
        aria-multiline="true"
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={(event) => onChange?.(event.currentTarget.innerHTML)}
        sx={(theme) => ({
          minHeight: 88,
          maxHeight: 180,
          overflowY: 'auto',
          mt: 0.5,
          px: 1.5,
          py: 1,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          backgroundColor: readOnly
            ? theme.palette.action.disabledBackground
            : theme.palette.background.paper,
          '&:focus': {
            borderColor: theme.palette.primary.main,
            outline: `1px solid ${theme.palette.primary.main}`
          }
        })}
      />
    </Box>
  )
}

export default RichTextDescription
