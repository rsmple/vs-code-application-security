/* eslint-disable no-console */
import {type Plugin, build, resolveConfig} from 'vite'

import {copyFile, mkdir, readdir, stat, writeFile} from 'fs/promises'
import {join, resolve} from 'path'

import packageJson from '../package.json' with { type: 'json' }

const SOURCE = 'src/extension/package.ts'
const LICENSE = 'LICENSE'
const VSCODEIGNORE = '.vscodeignore'
const ASSETS = 'assets'
const README = 'README.md'

const copyRecursive = (src: string, dest: string): Promise<void> => {
  return stat(src).then(stats => {
    if (stats.isDirectory()) {
      return mkdir(dest, {recursive: true}).then(() =>
        readdir(src).then(files =>
          Promise.all(
            files.map(file =>
              copyRecursive(join(src, file), join(dest, file)),
            ),
          ).then(() => void 0),
        ),
      )
    } else {
      return copyFile(src, dest)
    }
  })
}

export const pluginPackage: Plugin = {
  name: 'vite-plugin-package',
  enforce: 'post',
  async closeBundle() {
    const configFile = resolve('./vite.config.extension.ts')
    const viteConfig = await resolveConfig({configFile}, 'build')
    const outDir = viteConfig.build.outDir

    try {
      const result = await build({
        configFile: false,
        resolve: viteConfig.resolve,
        build: {
          lib: {
            entry: resolve(SOURCE),
            formats: ['es'],
          },
          emptyOutDir: true,
          write: false,
        },
      })

      const compiledCode = Array.isArray(result)
        ? result[0].output[0].code
        : 'output' in result
          ? result.output[0].code
          :undefined

      if (!compiledCode) {
        throw new Error(`Failed to read ${ SOURCE } contents.`)
      }

      const moduleUrl = `data:text/javascript;base64,${ Buffer.from(compiledCode).toString('base64') }`
      const module = await import(moduleUrl)

      if (typeof module.default !== 'object') {
        throw new Error('Default export from package.ts must be an object.')
      }

      const content = {...module.default}

      content.version = packageJson.version

      const outputPath = resolve(outDir, 'package.json')

      await writeFile(
        outputPath,
        JSON.stringify(content, null, 2),
        'utf-8',
      )
      console.log(`✓ package.json generated at: ${ outputPath }`)

      await copyFile(
        resolve(LICENSE),
        resolve(outDir, LICENSE),
      )
      console.log(`✓ ${ LICENSE } generated at: ${ outputPath }`)

      await copyFile(
        resolve(README),
        resolve(outDir, README),
      )
      console.log(`✓ ${ README } generated at: ${ outputPath }`)

      await writeFile(
        resolve(outDir, VSCODEIGNORE),
        `
../**
extension.cjs.map
`,
      )
      console.log(`✓ ${ VSCODEIGNORE } generated at: ${ outputPath }`)

      await copyRecursive(ASSETS, resolve(outDir, ASSETS))
      console.log(`✓ ${ ASSETS } generated at: ${ outputPath }`)
    } catch (error) {
      console.error('✗ Error generating package.json:', error)
    }
  },
}
