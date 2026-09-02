import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const sourceRoot = path.resolve('src')
const ignoredPathParts = [
  `${path.sep}api${path.sep}gen${path.sep}`,
  `${path.sep}i18n${path.sep}locales${path.sep}`
]
const visibleAttributeNames = new Set([
  'alt',
  'aria-label',
  'helperText',
  'label',
  'placeholder',
  'subtitle',
  'title'
])
const visiblePropertyNames = new Set([
  'content',
  'helperText',
  'label',
  'placeholder',
  'subtitle',
  'title'
])
const rawUiCalls = new Set([
  'alert',
  'confirm',
  'enqueueSnackbar',
  'prompt'
])
const allowedLiterals = new Set(['CourseFlow'])

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return sourceFiles(target)
    }
    return entry.isFile() && /\.tsx?$/.test(entry.name) ? [target] : []
  })
}

function isHumanText(value) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return (
    /[A-Za-zÀ-ÿ]{2}/.test(normalized) &&
    !allowedLiterals.has(normalized) &&
    !/^&[a-z]+;$/.test(normalized)
  )
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) {
    return node.text
  }
  return undefined
}

function expressionNode(node) {
  return ts.isJsxExpression(node) ? node.expression : node
}

function rawUiText(node) {
  node = expressionNode(node)
  if (!node) {
    return undefined
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text
  }
  if (ts.isTemplateExpression(node)) {
    return [node.head.text, ...node.templateSpans.map((span) => span.literal.text)]
      .join('{}')
      .trim()
  }
  return undefined
}

const findings = []

for (const filename of sourceFiles(sourceRoot)) {
  if (ignoredPathParts.some((part) => filename.includes(part))) {
    continue
  }

  const contents = fs.readFileSync(filename, 'utf8')
  const sourceFile = ts.createSourceFile(
    filename,
    contents,
    ts.ScriptTarget.Latest,
    true,
    filename.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )

  if (/\b_t\b|@cf\/utility\/strings/.test(contents)) {
    findings.push({ sourceFile, node: sourceFile, text: 'legacy translation API' })
  }

  function report(node, text) {
    findings.push({ sourceFile, node, text: text.replace(/\s+/g, ' ').trim() })
  }

  function visit(node) {
    if (ts.isJsxText(node) && isHumanText(node.text)) {
      report(node, node.text)
    }

    if (
      ts.isJsxExpression(node) &&
      node.expression &&
      rawUiText(node.expression) !== undefined &&
      isHumanText(rawUiText(node.expression)) &&
      !ts.isJsxAttribute(node.parent)
    ) {
      report(node, rawUiText(node.expression))
    }

    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sourceFile)
      const value = node.initializer && rawUiText(node.initializer)
      if (visibleAttributeNames.has(name) && value && isHumanText(value)) {
        report(node, `${name}=${value}`)
      }
    }

    if (ts.isPropertyAssignment(node)) {
      const name = propertyName(node.name)
      const value = rawUiText(node.initializer)
      const stableCode = value && /^[a-z][a-z0-9_-]*$/.test(value)
      if (
        name &&
        visiblePropertyNames.has(name) &&
        value &&
        !stableCode &&
        isHumanText(value)
      ) {
        report(node, `${name}=${value}`)
      }
    }

    if (ts.isCallExpression(node)) {
      const callName = ts.isPropertyAccessExpression(node.expression)
        ? node.expression.name.text
        : ts.isIdentifier(node.expression)
          ? node.expression.text
          : undefined
      const value = node.arguments[0] && rawUiText(node.arguments[0])
      if (callName && rawUiCalls.has(callName) && value && isHumanText(value)) {
        report(node, `${callName}(${value})`)
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
}

if (findings.length) {
  for (const { sourceFile, node, text } of findings) {
    const start = node === sourceFile ? 0 : node.getStart(sourceFile)
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(start)
    const relative = path.relative(process.cwd(), sourceFile.fileName)
    console.error(`${relative}:${line + 1}:${character + 1} ${text}`)
  }
  console.error(`Found ${findings.length} uncontrolled UI string(s).`)
  process.exit(1)
}

console.log('No uncontrolled UI strings found.')
