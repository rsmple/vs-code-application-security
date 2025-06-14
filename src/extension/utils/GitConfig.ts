import {exec} from 'child_process'

export const getGitEmail = (): Promise<string | undefined> => {
  return new Promise((resolve) => {
    exec('git config user.email', (err, stdout) => {
      resolve(err ? undefined : stdout.trim())
    })
  })
}

export const getGitRemoteUrl = (repoPath: string): Promise<string | undefined> => {
  return new Promise((resolve) => {
    exec('git config --get remote.origin.url', {cwd: repoPath}, (err, stdout) => {
      if (err || !stdout) {
        resolve(undefined)
      } else {
        resolve(stdout.trim())
      }
    })
  })
}