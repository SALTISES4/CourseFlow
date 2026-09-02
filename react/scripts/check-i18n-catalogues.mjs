import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import i18next from 'i18next'
import ts from 'typescript'

const localeRoot = path.resolve('src/i18n/locales')

async function loadTypeScriptModule(filename) {
  const source = fs.readFileSync(filename, 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022
    },
    fileName: filename
  }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`)
}

function unwrap(expression) {
  let current = expression
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression
  }
  return current
}

function propertyName(node, sourceFile) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) {
    return node.text
  }
  throw new Error(`Unsupported translation key: ${node.getText(sourceFile)}`)
}

function evaluateObject(node, sourceFile, keyPath = '') {
  const object = unwrap(node)
  if (!ts.isObjectLiteralExpression(object)) {
    throw new Error(`Expected an object at ${keyPath || '<root>'}`)
  }

  const result = {}
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) {
      throw new Error(`Unsupported catalogue syntax: ${property.getText(sourceFile)}`)
    }
    const key = propertyName(property.name, sourceFile)
    if (Object.hasOwn(result, key)) {
      throw new Error(`Duplicate translation key: ${keyPath}${key}`)
    }
    const value = unwrap(property.initializer)
    if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
      assert.notEqual(value.text.trim(), '', `Empty translation: ${keyPath}${key}`)
      result[key] = value.text
    } else {
      result[key] = evaluateObject(value, sourceFile, `${keyPath}${key}.`)
    }
  }
  return result
}

function loadCatalogue(filename) {
  const contents = fs.readFileSync(filename, 'utf8')
  const sourceFile = ts.createSourceFile(
    filename,
    contents,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  )
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.initializer) {
        return evaluateObject(declaration.initializer, sourceFile)
      }
    }
  }
  throw new Error(`No translation catalogue found in ${filename}`)
}

function flatten(object, prefix = '') {
  return Object.entries(object).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    return typeof value === 'string' ? [fullKey] : flatten(value, fullKey)
  })
}

function loadLocale(locale) {
  const directory = path.join(localeRoot, locale)
  return Object.fromEntries(
    fs
      .readdirSync(directory)
      .filter((filename) => filename.endsWith('.ts'))
      .sort()
      .map((filename) => [
        path.basename(filename, '.ts'),
        loadCatalogue(path.join(directory, filename))
      ])
  )
}

const english = loadLocale('en-CA')
const french = loadLocale('fr-CA')
const localeConfig = await loadTypeScriptModule(
  path.resolve('src/i18n/config.ts')
)

assert.equal(localeConfig.normalizeLocale('en'), 'en-CA')
assert.equal(localeConfig.normalizeLocale('EN-ca'), 'en-CA')
assert.equal(localeConfig.normalizeLocale('fr'), 'fr-CA')
assert.equal(localeConfig.normalizeLocale(' fr-CA '), 'fr-CA')
assert.equal(localeConfig.normalizeLocale('unsupported'), 'en-CA')
assert.equal(localeConfig.normalizeLocale(undefined), 'en-CA')
assert.equal(localeConfig.toApiLanguagePreference('en-CA'), 'en')
assert.equal(localeConfig.toApiLanguagePreference('fr-CA'), 'fr')

assert.deepEqual(Object.keys(french), Object.keys(english), 'Namespace mismatch')
for (const namespace of Object.keys(english)) {
  assert.deepEqual(
    flatten(french[namespace]).sort(),
    flatten(english[namespace]).sort(),
    `Translation key mismatch in ${namespace}`
  )
}

const i18n = i18next.createInstance()
const missingKeys = []
await i18n.init({
  resources: {
    'en-CA': english,
    'fr-CA': french
  },
  lng: 'en-CA',
  fallbackLng: 'en-CA',
  ns: ['common'],
  defaultNS: 'common',
  saveMissing: true,
  missingKeyHandler: (_languages, namespace, key) => {
    missingKeys.push(`${namespace}:${key}`)
  },
  initAsync: false
})

assert.equal(i18n.t('examples.greeting', { name: 'Ada' }), 'Hello, Ada')
assert.equal(i18n.t('examples.selectedItem', { count: 1 }), '1 item selected')
assert.equal(i18n.t('examples.selectedItem', { count: 2 }), '2 items selected')
assert.equal(
  i18n.t('systemLabels.channel.course_preparation', { ns: 'workflow' }),
  'Preparation'
)
assert.equal(
  i18n.t('systemLabels.copyNumbered', {
    ns: 'workflow',
    title: 'Course 101',
    count: 2
  }),
  'Course 101 (copy 2)'
)
assert.equal(
  i18n.t('messages.project.shared', {
    ns: 'notifications',
    projectTitle: 'Course 101'
  }),
  'The project “Course 101” was shared with you.'
)
await i18n.changeLanguage('fr-CA')
assert.equal(i18n.t('examples.greeting', { name: 'Ada' }), 'Bonjour, Ada')
assert.equal(i18n.t('examples.selectedItem', { count: 2 }), '2 éléments sélectionnés')
assert.equal(
  i18n.t('systemLabels.channel.course_preparation', { ns: 'workflow' }),
  'Préparation'
)
assert.equal(
  i18n.t('systemLabels.copyNumbered', {
    ns: 'workflow',
    title: 'Course 101',
    count: 2
  }),
  'Course 101 (copie 2)'
)
assert.equal(
  i18n.t('messages.project.shared', {
    ns: 'notifications',
    projectTitle: 'Course 101'
  }),
  'Le projet « Course 101 » a été partagé avec vous.'
)
assert.equal(i18n.t('missing.example'), 'missing.example')
assert.deepEqual(missingKeys, ['common:missing.example'])

console.log('Translation catalogues, interpolation, and plurals are valid.')
