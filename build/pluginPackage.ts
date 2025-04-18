import {type Plugin, build, resolveConfig} from 'vite'

import {readFile, writeFile} from 'fs/promises'
import {resolve} from 'path'

import packageJson from '../package.json' with { type: 'json' }

const SOURCE = 'src/package.ts'
const LICENSE = 'LICENSE'

export const pluginPackage: Plugin = {
  name: 'vite-plugin-package',
  enforce: 'post',
  async closeBundle() {
    const viteConfig = await resolveConfig({}, 'build')
    const outDir = viteConfig.build.outDir

    try {
      const result = await build({
        configFile: false,
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

      // eslint-disable-next-line no-console
      console.log(`✓ package.json generated at: ${ outputPath }`)

      const license = await readFile(resolve(LICENSE))

      await writeFile(
        resolve(resolve(outDir, LICENSE)),
        license,
      )

      // eslint-disable-next-line no-console
      console.log(`✓ ${ LICENSE } generated at: ${ outputPath }`)

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('✗ Error generating package.json:', error)
    }
  },
}
