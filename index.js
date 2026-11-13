/**
 * Host half of 【南山】DSH发布Npm助手.
 *
 * DSH components ship as ordinary npm packages: a bundle declares
 * `dsh.bundle.patch` (a cordis.patch.yml row) and, when it draws UI, a
 * `dsh.client` entry. Publishing therefore means running the npm CLI against
 * the component directory, after the same checks the official bundle form
 * requires (exported locale/icon, files list, patch row name, pack contents…).
 *
 * This module owns:
 *
 *   - component discovery (profile link dependencies, scan roots, manual targets)
 *   - static + npm preflight checks
 *   - one npm publish / npm publish --dry-run at a time per component
 *   - a small JSON API for the panel page
 *   - a local publish history in `$DSH_HOME/nanshan-publish-manager/publish-state.json`
 *
 * npm credentials are never read or stored here: the child process uses the
 * user's own npm configuration (~/.npmrc, keychain), exactly like a terminal.
 */
import { spawn } from 'node:child_process'
import { constants, readFileSync } from 'node:fs'
import { access, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, stat, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { basename, delimiter, dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

export const inject = ['webServer']

const API = '/api/nanshan-publish-manager'
const STATE_FILE = 'publish-state.json'
const STATE_VERSION = 1
const MAX_BODY_BYTES = 256 * 1024
const MAX_COMMAND_OUTPUT = 160 * 1024
const MAX_RECORD_OUTPUT = 8000
const MAX_RECORDS = 120
const MAX_SCAN_DIRS = 800
const MAX_ICON_BYTES = 256 * 1024
const DEFAULT_REGISTRY = 'https://registry.npmjs.org'
const TAGS = new Set(['latest', 'beta', 'next', 'alpha', 'canary'])
const ACCESS = new Set(['public', 'restricted'])
const AUTH_MODES = new Set(['session', 'token', 'oidc'])
const VERSION_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/
const NAME_RE = /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/
const SCRIPT_RE = /^[A-Za-z0-9:_.-]{1,64}$/
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.hg', '.svn', 'dist', 'build', 'out', 'coverage',
  '.next', '.nuxt', '.cache', '.turbo', '.pnpm-store', 'Library', 'Applications',
])
const ICON_MIME = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}
const DEFAULT_SETTINGS = {
  registry: DEFAULT_REGISTRY,
  tag: 'latest',
  access: 'public',
  authMode: 'session',
  dryRunFirst: true,
  requireChecks: true,
  writeVersion: true,
  buildScript: '',
  note: '',
}

export function apply(ctx, config = {}) {
  const home = process.env.DSH_HOME || join(homedir(), '.dsh')
  const dataDir = join(home, 'nanshan-publish-manager')
  const statePath = join(dataDir, STATE_FILE)
  const options = {
    scanRoots: normalizeScanRoots(config && config.scanRoots),
    maxScanDepth: clampInt(config && config.maxScanDepth, 1, 3, 2),
    allowPublish: !(config && config.allowPublish === false),
    publishTimeoutMs: clampInt(config && config.publishTimeoutMs, 30_000, 900_000, 180_000),
    registry: typeof config?.registry === 'string' && config.registry.trim() !== '' ? config.registry.trim() : null,
  }

  const state = { version: STATE_VERSION, records: {}, settings: {}, targets: [], tokens: [] }
  let loaded = false
  let chain = Promise.resolve()
  let discoveryCache = { at: 0, value: null }
  let overviewCache = { at: 0, value: null }
  let npmCache = { at: 0, value: null }
  const downloadsCache = new Map()
  const totalsCache = new Map()
  let npmrcRegistry = null
  const publishing = new Set()

  /* ------------------------------------------------------------------ state */

  async function ensureState() {
    if (loaded) return state
    let parsed = null
    try {
      parsed = JSON.parse(await readFile(statePath, 'utf8'))
    } catch (error) {
      if (error && error.code !== 'ENOENT') {
        ctx.logger?.warn?.(`nanshan-publish-manager: cannot read publish history: ${String(error && error.message ? error.message : error)}`)
      }
    }
    if (parsed && typeof parsed === 'object') {
      if (parsed.records && typeof parsed.records === 'object') {
        for (const [dir, list] of Object.entries(parsed.records)) {
          if (!Array.isArray(list)) continue
          const clean = list.filter(isRecordShape).sort(byAtDesc).slice(0, MAX_RECORDS)
          if (clean.length > 0) state.records[dir] = clean
        }
      }
      if (parsed.settings && typeof parsed.settings === 'object') {
        for (const [dir, value] of Object.entries(parsed.settings)) {
          if (value && typeof value === 'object') state.settings[dir] = sanitizeSettings(value)
        }
      }
      if (Array.isArray(parsed.targets)) {
        state.targets = parsed.targets.filter((value) => typeof value === 'string' && isAbsolute(value))
      }
      if (Array.isArray(parsed.tokens)) {
        state.tokens = parsed.tokens.filter(isTokenShape)
      }
    }
    loaded = true
    return state
  }

  async function persist() {
    await mkdir(dataDir, { recursive: true })
    const temp = `${statePath}.${process.pid}.${Date.now()}.tmp`
    await writeFile(temp, JSON.stringify(state, null, 2), 'utf8')
    await rename(temp, statePath)
  }

  function exclusive(task) {
    const next = chain.then(task, task)
    chain = next.then(
      () => undefined,
      () => undefined,
    )
    return next
  }

  async function saveRecord(record) {
    await ensureState()
    await exclusive(async () => {
      const list = Array.isArray(state.records[record.dir]) ? state.records[record.dir] : []
      state.records[record.dir] = [record, ...list].sort(byAtDesc).slice(0, MAX_RECORDS)
      await persist()
    })
    overviewCache = { at: 0, value: null }
  }

  /* --------------------------------------------------------------- settings */

  function defaultRegistry() {
    if (options.registry) return stripTrailingSlash(options.registry)
    if (npmrcRegistry !== null) return npmrcRegistry
    let registry = DEFAULT_REGISTRY
    try {
      const text = readFileSync(join(homedir(), '.npmrc'), 'utf8')
      for (const line of text.split(/\r?\n/)) {
        const match = /^\s*registry\s*=\s*(.+?)\s*$/.exec(line)
        if (!match) continue
        const candidate = match[1].replace(/^["']|["']$/g, '')
        if (/^https?:\/\//i.test(candidate)) registry = stripTrailingSlash(candidate)
      }
    } catch {
      // A missing ~/.npmrc simply means the public registry.
    }
    npmrcRegistry = registry
    return registry
  }

  function baseSettings() {
    return { ...DEFAULT_SETTINGS, registry: defaultRegistry() }
  }

  function mergeSettings(value) {
    return { ...baseSettings(), ...sanitizeSettings(value || {}) }
  }

  async function saveSettings(dir, patch) {
    await ensureState()
    return exclusive(async () => {
      const next = mergeSettings({ ...(state.settings[dir] || {}), ...(patch || {}) })
      state.settings[dir] = next
      await persist()
      overviewCache = { at: 0, value: null }
      return next
    })
  }

  function normalizeRegistry(raw, fallback) {
    const value = typeof raw === 'string' ? raw.trim() : ''
    if (value === '') return fallback || defaultRegistry()
    if (/[\r\n]/.test(value)) throw httpError(400, 'npm registry 不能包含换行。')
    let url
    try {
      url = new URL(value)
    } catch {
      throw httpError(400, 'npm registry 不是合法的 URL。')
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw httpError(400, 'npm registry 必须使用 http 或 https。')
    }
    if (url.username || url.password) {
      throw httpError(400, '请不要把凭据写进 registry 地址；npm 会使用你自己的登录配置。')
    }
    return stripTrailingSlash(value)
  }

  /* -------------------------------------------------------------------- npm */

  function childEnv(npmPath) {
    const env = {
      ...process.env,
      NO_COLOR: '1',
      FORCE_COLOR: '0',
      npm_config_color: 'false',
      npm_config_fund: 'false',
      npm_config_audit: 'false',
      npm_config_update_notifier: 'false',
      npm_config_progress: 'false',
    }
    if (npmPath) {
      const binDir = dirname(npmPath)
      env.PATH = `${binDir}${delimiter}${env.PATH || ''}`
    }
    return env
  }

  async function resolveNpm(force = false) {
    if (!force && npmCache.value && Date.now() - npmCache.at < 60_000) return npmCache.value
    const candidates = []
    const seen = new Set()
    const add = (candidate) => {
      if (!candidate || seen.has(candidate)) return
      seen.add(candidate)
      candidates.push(candidate)
    }
    const npmName = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    for (const dir of String(process.env.PATH || '').split(delimiter)) {
      if (dir) add(join(dir, npmName))
    }
    if (process.platform === 'win32') {
      if (process.env.APPDATA) add(join(process.env.APPDATA, 'npm', 'npm.cmd'))
      if (process.env.ProgramFiles) add(join(process.env.ProgramFiles, 'nodejs', 'npm.cmd'))
      if (process.env.NVM_SYMLINK) add(join(process.env.NVM_SYMLINK, 'npm.cmd'))
    }
    add('/opt/homebrew/bin/npm')
    add('/usr/local/bin/npm')
    add('/usr/bin/npm')
    add(join(homedir(), '.volta/bin/npm'))
    add(join(homedir(), '.local/bin/npm'))
    add(join(homedir(), '.bun/bin/npm'))
    try {
      const nvmRoot = join(homedir(), '.nvm/versions/node')
      const versions = await readdir(nvmRoot)
      versions.sort((left, right) => compareVersions(right.replace(/^v/, ''), left.replace(/^v/, '')))
      for (const version of versions.slice(0, 4)) add(join(nvmRoot, version, 'bin/npm'))
    } catch {
      // No nvm installation.
    }

    for (const candidate of candidates) {
      try {
        await access(candidate, constants.X_OK)
        const info = await stat(candidate)
        if (!info.isFile() && !info.isSymbolicLink()) continue
        const probe = await runProcess(candidate, ['--version'], { timeoutMs: 15_000, env: childEnv(candidate) })
        const version = probe.ok ? firstLine(probe.stdout) || firstLine(probe.output) : null
        if (version) {
          const value = { available: true, executable: candidate, version, binDir: dirname(candidate) }
          npmCache = { at: Date.now(), value }
          return value
        }
      } catch {
        // Try the next candidate path.
      }
    }
    const value = { available: false, executable: null, version: null, binDir: null }
    npmCache = { at: Date.now(), value }
    return value
  }

  async function runNpm(args, { cwd, timeoutMs = 60_000, extraEnv } = {}) {
    const npm = await resolveNpm()
    if (!npm.available) {
      return {
        ok: false,
        code: null,
        signal: null,
        stdout: '',
        stderr: '找不到 npm 可执行文件。',
        output: '找不到 npm 可执行文件。',
        timedOut: false,
        truncated: false,
        durationMs: 0,
        error: 'npm-not-found',
      }
    }
    return runProcess(npm.executable, args, {
      cwd,
      timeoutMs,
      env: { ...childEnv(npm.executable), ...(extraEnv || {}) },
    })
  }

  function runProcess(executable, args, processOptions = {}) {
    return new Promise((resolvePromise) => {
      const startedAt = Date.now()
      let child
      try {
        const isWindowsScript = process.platform === 'win32' && /\.(cmd|bat)$/i.test(executable)
        const command = isWindowsScript ? (process.env.ComSpec || 'cmd.exe') : executable
        const commandArgs = isWindowsScript
          ? ['/d', '/s', '/c', `"${[executable, ...args].map(quoteCmdArg).join(' ')}"`]
          : args
        child = spawn(command, commandArgs, {
          cwd: processOptions.cwd,
          env: processOptions.env || process.env,
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
          ...(isWindowsScript ? { windowsVerbatimArguments: true } : {}),
        })
      } catch (error) {
        const message = String(error && error.message ? error.message : error)
        resolvePromise({
          ok: false, code: null, signal: null, stdout: '', stderr: message,
          output: message, timedOut: false, truncated: false, durationMs: 0, error: message,
        })
        return
      }
      let stdout = ''
      let stderr = ''
      let output = ''
      let truncated = false
      let settled = false
      let timedOut = false

      const append = (chunk, isError) => {
        const text = String(chunk)
        output += text
        if (output.length > MAX_COMMAND_OUTPUT) {
          output = output.slice(-MAX_COMMAND_OUTPUT)
          truncated = true
        }
        if (isError) {
          stderr += text
          if (stderr.length > MAX_COMMAND_OUTPUT) stderr = stderr.slice(-MAX_COMMAND_OUTPUT)
        } else {
          stdout += text
          if (stdout.length > MAX_COMMAND_OUTPUT) stdout = stdout.slice(-MAX_COMMAND_OUTPUT)
        }
      }
      child.stdout?.on('data', (chunk) => append(chunk, false))
      child.stderr?.on('data', (chunk) => append(chunk, true))

      const timer = setTimeout(() => {
        timedOut = true
        try {
          child.kill('SIGTERM')
        } catch {
          // Already exited.
        }
        setTimeout(() => {
          try {
            child.kill('SIGKILL')
          } catch {
            // Already exited.
          }
        }, 3000).unref?.()
      }, processOptions.timeoutMs || 60_000)

      const finish = (code, signal, spawnError) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolvePromise({
          ok: code === 0 && !timedOut && !spawnError,
          code: typeof code === 'number' ? code : null,
          signal: signal || null,
          stdout,
          stderr,
          output: output.trim(),
          timedOut,
          truncated,
          durationMs: Date.now() - startedAt,
          ...(spawnError ? { error: spawnError } : {}),
        })
      }
      child.on('error', (error) => finish(null, null, String(error && error.message ? error.message : error)))
      child.on('close', (code, signal) => finish(code, signal))
    })
  }

  /**
   * The current official publish authentication surface, as detected in this
   * process. Classic npm tokens were permanently revoked on 2025-12-09; npm now
   * uses two-hour `npm login` sessions (2FA enforced for writes), granular
   * access tokens, or OIDC trusted publishing in CI.
   */
  function authEnvironment() {
    const github = process.env.GITHUB_ACTIONS === 'true'
    const gitlab = process.env.GITLAB_CI === 'true'
    const npmIdToken = typeof process.env.NPM_ID_TOKEN === 'string' && process.env.NPM_ID_TOKEN !== ''
    const githubRequest = Boolean(
      process.env.ACTIONS_ID_TOKEN_REQUEST_URL && process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN,
    )
    const available = (github && (npmIdToken || githubRequest)) || (gitlab && npmIdToken)
    return {
      oidc: {
        available,
        provider: available ? (github ? 'github-actions' : 'gitlab') : null,
      },
    }
  }

  /**
   * A granular access token is used for one publish only. It reaches npm
   * through a private temporary npmrc, never through argv, records, or logs,
   * and the directory is removed when the operation ends.
   */
  async function createTokenNpmrc(registry, token) {
    const dir = await mkdtemp(join(tmpdir(), 'nanshan-publish-manager-'))
    const file = join(dir, 'npmrc')
    const url = new URL(registry)
    const pathname = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`
    const authKey = `//${url.host}${pathname}:_authToken`
    const normalizedRegistry = url.toString().replace(/\/+$/, '')
    try {
      await writeFile(file, `registry=${normalizedRegistry}\n${authKey}=${token}\n`, { encoding: 'utf8', mode: 0o600 })
    } catch (error) {
      try {
        await rm(dir, { recursive: true, force: true })
      } catch {
        // Nothing else to clean.
      }
      throw error
    }
    return {
      file,
      async cleanup() {
        try {
          await rm(dir, { recursive: true, force: true })
        } catch {
          // Best effort; the file only contains a short-lived token.
        }
      },
    }
  }

  /* -------------------------------------------------------------- discovery */

  /**
   * Every profile may link a component under development. The environment
   * variable is the direct route; walking `$DSH_HOME/profiles` keeps discovery
   * working in Host processes that do not inherit it (notably the desktop app).
   */
  async function profileLinkDirs() {
    const profileDirs = []
    const addProfile = (dir) => {
      if (typeof dir !== 'string' || dir === '' || profileDirs.includes(dir)) return
      profileDirs.push(dir)
    }
    addProfile(process.env.DSH_PROFILE_DIR)
    try {
      const root = join(home, 'profiles')
      for (const entry of await readdir(root, { withFileTypes: true })) {
        if (entry.isDirectory()) addProfile(join(root, entry.name))
      }
    } catch {
      // A customized DSH_HOME may keep profiles elsewhere; the env value still applies.
    }
    const links = []
    for (const profileDir of profileDirs.slice(0, 12)) {
      try {
        const pkg = JSON.parse(await readFile(join(profileDir, 'package.json'), 'utf8'))
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
        for (const spec of Object.values(deps)) {
          if (typeof spec !== 'string') continue
          const match = /^(?:link|file):(.+)$/.exec(spec)
          if (!match) continue
          links.push(resolve(profileDir, match[1]))
        }
      } catch {
        // A profile without a package.json simply has no link dependencies.
      }
    }
    return links
  }

  /** Workspace roots known to the Host, so open workspaces are scanned too. */
  function hostRoots() {
    const roots = []
    const add = (value) => {
      if (typeof value === 'string' && isAbsolute(value) && !roots.includes(value)) roots.push(value)
    }
    const working = ctx.get('workingDirectory')
    if (working && typeof working.defaultDirectory === 'string') add(working.defaultDirectory)
    const registry = ctx.get('workspaceRegistry')
    if (registry && typeof registry.list === 'function') {
      try {
        for (const workspace of registry.list().slice(0, 6)) {
          if (workspace && typeof workspace.path === 'string') add(workspace.path)
        }
      } catch {
        // The registry may still be initializing; other sources still apply.
      }
    }
    return roots
  }

  async function discover(force = false) {
    if (!force && discoveryCache.value && Date.now() - discoveryCache.at < 5000) return discoveryCache.value
    await ensureState()
    const found = new Map()
    const warnings = []
    const visited = new Set()
    let scanned = 0

    async function addDir(rawDir, origin) {
      let dir
      try {
        dir = await realpath(expandHome(rawDir))
      } catch {
        if (origin === 'link') warnings.push(`链接目录不存在：${String(rawDir)}`)
        return
      }
      if (found.has(dir)) return
      const pkg = await readPackageQuiet(dir)
      if (!pkg) {
        if (origin === 'link') warnings.push(`没有 package.json：${dir}`)
        return
      }
      if (!isDshPackage(pkg)) {
        if (origin === 'link') warnings.push(`不是 DSH 组件：${typeof pkg.name === 'string' ? pkg.name : dir}`)
        return
      }
      found.set(dir, { dir, origin, name: typeof pkg.name === 'string' ? pkg.name : null })
    }

    async function walk(rootRaw, depthLimit, silent) {
      let root
      try {
        root = await realpath(expandHome(rootRaw))
      } catch {
        if (!silent) warnings.push(`扫描目录不存在：${String(rootRaw)}`)
        return
      }
      const queue = [{ dir: root, depth: 0 }]
      while (queue.length > 0 && scanned < MAX_SCAN_DIRS) {
        const item = queue.shift()
        if (visited.has(item.dir)) continue
        visited.add(item.dir)
        scanned += 1
        const pkg = await readPackageQuiet(item.dir)
        if (pkg && isDshPackage(pkg)) {
          found.set(item.dir, {
            dir: item.dir,
            origin: 'scan',
            name: typeof pkg.name === 'string' ? pkg.name : null,
          })
          continue
        }
        if (item.depth >= depthLimit) continue
        let entries
        try {
          entries = await readdir(item.dir, { withFileTypes: true })
        } catch {
          continue
        }
        for (const entry of entries) {
          if (!entry.isDirectory() || entry.isSymbolicLink()) continue
          if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue
          queue.push({ dir: join(item.dir, entry.name), depth: item.depth + 1 })
        }
      }
    }

    for (const dir of await profileLinkDirs()) await addDir(dir, 'link')
    for (const dir of state.targets) await addDir(dir, 'target')
    for (const root of options.scanRoots) await walk(root, options.maxScanDepth, false)
    for (const root of hostRoots()) {
      if (scannableRoot(root)) await walk(root, Math.min(options.maxScanDepth, 2), true)
    }
    const cwd = process.cwd()
    if (scannableRoot(cwd)) await walk(cwd, Math.min(options.maxScanDepth, 2), true)

    const dirs = [...found.values()].sort((left, right) => String(left.name || left.dir).localeCompare(String(right.name || right.dir)))
    const value = { dirs, warnings: warnings.slice(0, 30), scanned, at: Date.now() }
    discoveryCache = { at: Date.now(), value }
    return value
  }

  /* ----------------------------------------------------------- component read */

  async function readPackageQuiet(dir) {
    try {
      const parsed = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  async function readPackage(dir) {
    const pkg = await readPackageQuiet(dir)
    if (!pkg) throw httpError(404, '该目录没有可读的 package.json。')
    return pkg
  }

  function isDshPackage(pkg) {
    if (!pkg || typeof pkg !== 'object') return false
    const dsh = pkg.dsh
    if (!dsh || typeof dsh !== 'object' || Array.isArray(dsh)) return false
    return isPlainObject(dsh.bundle) || isPlainObject(dsh.client)
  }

  async function inspectPackage(dir, pkg) {
    const dsh = isPlainObject(pkg.dsh) ? pkg.dsh : {}
    const bundle = isPlainObject(dsh.bundle) ? dsh.bundle : null
    const client = isPlainObject(dsh.client) ? dsh.client : null
    const kind = bundle ? 'bundle' : client ? 'client' : 'host'
    const exportsMap = isPlainObject(pkg.exports) ? pkg.exports : {}
    const filesList = Array.isArray(pkg.files) ? pkg.files.filter((value) => typeof value === 'string') : []
    const patchRel = bundle && typeof bundle.patch === 'string' ? bundle.patch : null
    const patchPath = patchRel ? resolve(dir, patchRel) : null
    let patchText = null
    if (patchPath && isInside(dir, patchPath)) {
      try {
        patchText = await readFile(patchPath, 'utf8')
      } catch {
        patchText = null
      }
    }
    const patchName = patchText ? extractPatchName(patchText) : null
    const clientPath = await findClientEntry(dir, exportsMap, client)
    const iconInfo = await readIcon(dir, pkg, exportsMap)
    const locale = await readLocaleMeta(dir)
    const localeDir = await exists(join(dir, 'locale'))
    const readmeExists = (await exists(join(dir, 'README.md'))) || (await exists(join(dir, 'readme.md')))
    const mtime = await latestMtime([
      join(dir, 'package.json'),
      ...(patchPath ? [patchPath] : []),
      ...(iconInfo && iconInfo.path ? [iconInfo.path] : []),
    ])
    const name = typeof pkg.name === 'string' ? pkg.name : basename(dir)
    const title =
      (locale.zh && locale.zh.title) ||
      (locale.en && locale.en.title) ||
      name
    const description =
      (locale.zh && locale.zh.description) ||
      (locale.en && locale.en.description) ||
      (typeof pkg.description === 'string' ? pkg.description : '')
    const checks = staticChecks({
      pkg, patchRel, patchText, patchName, client, clientPath, exportsMap,
      filesList, iconInfo, locale, readmeExists,
    })
    return {
      dir,
      pkg,
      name,
      title,
      description,
      kind,
      patchRel,
      patchPath,
      patchName,
      clientPath,
      exportsMap,
      filesList,
      iconInfo,
      locale,
      localeDir,
      readmeExists,
      mtime,
      checks,
    }
  }

  async function findClientEntry(dir, exportsMap, client) {
    if (!client) return null
    const candidates = []
    const declared = exportsMap['./client']
    if (typeof declared === 'string') candidates.push(declared.replace(/^\.\//, ''))
    candidates.push('client.js', 'dist/client.js', 'lib/client.js')
    for (const rel of candidates) {
      const absolute = resolve(dir, rel)
      if (!isInside(dir, absolute)) continue
      if (await exists(absolute)) return rel
    }
    return null
  }

  async function readIcon(dir, pkg, exportsMap) {
    let rel = null
    if (typeof pkg.icon === 'string') rel = pkg.icon
    else if (typeof exportsMap['./icon'] === 'string') rel = exportsMap['./icon']
    if (!rel) {
      for (const candidate of ['icon.svg', 'icon.png', 'icon.webp', 'icon.jpg', 'icon.jpeg']) {
        if (await exists(join(dir, candidate))) {
          rel = candidate
          break
        }
      }
    }
    if (!rel) return null
    rel = rel.replace(/^\.\//, '')
    const absolute = resolve(dir, rel)
    if (!isInside(dir, absolute)) return null
    let info
    try {
      info = await stat(absolute)
    } catch {
      return null
    }
    if (!info.isFile()) return null
    const mime = ICON_MIME[extname(absolute).toLowerCase()]
    if (!mime) return { rel, path: absolute, bytes: info.size, dataUrl: null, error: 'format' }
    if (info.size > MAX_ICON_BYTES) return { rel, path: absolute, bytes: info.size, dataUrl: null, error: 'too-large' }
    try {
      const bytes = await readFile(absolute)
      return {
        rel,
        path: absolute,
        bytes: bytes.length,
        dataUrl: `data:${mime};base64,${bytes.toString('base64')}`,
      }
    } catch {
      return { rel, path: absolute, bytes: info.size, dataUrl: null, error: 'unreadable' }
    }
  }

  async function readLocaleMeta(dir) {
    const result = { zh: null, en: null }
    for (const code of ['zh', 'en']) {
      try {
        const parsed = JSON.parse(await readFile(join(dir, 'locale', `${code}.json`), 'utf8'))
        if (!parsed || typeof parsed !== 'object') continue
        const meta = isPlainObject(parsed.meta) ? parsed.meta : {}
        const title = pickText(meta.title, parsed.title)
        const description = pickText(meta.description, parsed.description)
        if (title || description) result[code] = { title, description }
      } catch {
        // Locale resources are optional; the checks report their absence.
      }
    }
    return result
  }

  function staticChecks(input) {
    const { pkg, patchRel, patchText, patchName, client, clientPath, exportsMap, filesList, iconInfo, locale, readmeExists } = input
    const checks = []
    const add = (id, status, detail) => checks.push({ id, status, ...(detail ? { detail } : {}) })
    const name = typeof pkg.name === 'string' ? pkg.name : ''

    add('manifest', 'pass', 'package.json')
    add('name', NAME_RE.test(name) ? 'pass' : 'fail', name)
    add('version', isValidVersion(pkg.version) ? 'pass' : 'fail', String(pkg.version || ''))
    add('private', pkg.private === true ? 'fail' : 'pass', pkg.private === true ? '"private": true' : '')
    add('description', typeof pkg.description === 'string' && pkg.description.trim() !== '' ? 'pass' : 'warn', '')
    add('license', typeof pkg.license === 'string' && pkg.license.trim() !== '' ? 'pass' : 'warn', String(pkg.license || ''))
    add('name-scope', /^@local\//.test(name) ? 'warn' : 'pass', name)

    if (!patchRel) add('patch-file', 'fail', '')
    else if (patchText === null) add('patch-file', 'fail', patchRel)
    else add('patch-file', 'pass', patchRel)

    if (!patchName) add('patch-row', 'fail', '')
    else if (patchName === name) add('patch-row', 'pass', patchName)
    else add('patch-row', 'warn', patchName)

    if (!client) add('client-entry', 'skip', '')
    else add('client-entry', clientPath ? 'pass' : 'fail', clientPath || '')

    add('exports-locale', exportsMap['./locale/*.json'] ? 'pass' : 'warn', '')
    add('exports-icon', exportsMap['./icon'] || typeof pkg.icon === 'string' ? 'pass' : 'warn', '')

    const required = ['index.js', clientPath, patchRel, iconInfo && iconInfo.rel].filter(Boolean)
    const missing = required.filter((rel) => !filesCoverOne(filesList, rel))
    if (filesList.length === 0) add('files', 'warn', '')
    else if (missing.length > 0) add('files', 'warn', missing.join(', '))
    else add('files', 'pass', `${filesList.length}`)

    if (!iconInfo) add('icon', 'warn', '')
    else if (iconInfo.error === 'too-large') add('icon', 'fail', `${iconInfo.rel} · ${formatBytes(iconInfo.bytes)}`)
    else if (iconInfo.error) add('icon', 'fail', iconInfo.rel)
    else add('icon', 'pass', `${iconInfo.rel} · ${formatBytes(iconInfo.bytes)}`)

    const hasLocaleMeta = Boolean((locale.zh && locale.zh.title) || (locale.en && locale.en.title))
    add('locale-meta', hasLocaleMeta ? 'pass' : 'warn', '')
    add('readme', readmeExists ? 'pass' : 'warn', 'README.md')
    return checks
  }

  /* ------------------------------------------------------------ npm checks */

  async function runChecks(dir, { targetVersion, registry, tag, settings, dryRun, authMode, authEnv, tokenProvided, oidc } = {}) {
    const pkg = await readPackage(dir)
    const info = await inspectPackage(dir, pkg)
    const checks = info.checks.slice()
    const npm = await resolveNpm()
    const reg = normalizeRegistry(registry, defaultRegistry())
    const mode = AUTH_MODES.has(authMode) ? authMode : 'session'

    if (!npm.available) {
      checks.push({ id: 'npm-cli', status: 'fail', detail: 'npm' })
      return { checks, npm, info, npmInfo: null, targetVersion: targetVersion || null, authMode: mode }
    }
    checks.push({ id: 'npm-cli', status: 'pass', detail: `npm ${npm.version || ''}`.trim() })
    let username = null
    let tokenVerified = null

    if (mode === 'oidc') {
      checks.push({
        id: 'npm-auth',
        status: 'warn',
        detail: 'OIDC_AT_PUBLISH',
      })
      checks.push({
        id: 'oidc-env',
        status: oidc && oidc.available ? 'pass' : 'fail',
        detail: oidc && oidc.provider ? oidc.provider : 'UNAVAILABLE',
      })
    } else {
      const who = await runNpm(
        ['whoami', '--registry', reg],
        { cwd: dir, timeoutMs: 30_000, extraEnv: authEnv },
      )
      if (who.ok) {
        username = firstLine(who.stdout) || firstLine(who.output)
        checks.push({ id: 'npm-auth', status: 'pass', detail: username })
      } else {
        const text = `${who.stderr || ''}\n${who.output || ''}`
        const authFailure = /ENEEDAUTH|need auth|not logged in|E401|401 Unauthorized|Unauthorized/i.test(text)
        checks.push({
          id: 'npm-auth',
          // A dry run packs locally and never writes to the registry, so a
          // missing login is only a reminder there; a real publish needs it.
          // A granular token may be restricted to publishing only, so a failed
          // whoami is a warning there and the publish itself is authoritative.
          status: mode === 'token'
            ? 'warn'
            : authFailure ? (dryRun ? 'warn' : 'fail') : 'warn',
          detail: mode === 'token'
            ? (authFailure ? 'TOKEN_UNVERIFIED' : truncate(firstLine(text) || 'npm whoami', 160))
            : authFailure
              ? 'NOT_LOGGED_IN'
              : truncate(firstLine(text) || 'npm whoami', 160),
        })
      }
      if (mode === 'token') {
        tokenVerified = Boolean(tokenProvided && who.ok)
        checks.push({
          id: 'token-format',
          status: tokenProvided ? 'pass' : 'fail',
          detail: tokenProvided ? 'GRANULAR_TOKEN' : 'EMPTY',
        })
        if (tokenProvided) {
          // The Bypass 2FA flag is server-side token metadata, not part of the
          // token string. npm exposes it in `npm token list --json`, but that
          // needs an account session and returns masked tokens, so the pasted
          // token cannot be matched reliably here.
          checks.push({ id: 'token-bypass', status: 'warn', detail: 'CANNOT_DETECT' })
        }
      }
    }

    let versions = []
    let tags = {}
    let registryStatus = 'pass'
    let registryDetail = reg
    const view = await runNpm(
      ['view', String(pkg.name || ''), 'versions', 'dist-tags', '--json', '--registry', reg],
      { cwd: dir, timeoutMs: 45_000, extraEnv: authEnv },
    )
    const viewText = `${view.stderr || ''}\n${view.output || ''}`
    if (view.ok) {
      try {
        const parsed = JSON.parse(view.stdout)
        if (Array.isArray(parsed)) versions = parsed.filter((value) => typeof value === 'string')
        else if (parsed && typeof parsed === 'object') {
          versions = Array.isArray(parsed.versions) ? parsed.versions.filter((value) => typeof value === 'string') : []
          tags = isPlainObject(parsed['dist-tags']) ? parsed['dist-tags'] : {}
        }
      } catch {
        // Registry answered but the JSON shape is unexpected; absence of
        // versions is still a usable result.
      }
    } else if (/E404|404 Not Found|is not in this registry/i.test(viewText)) {
      registryDetail = 'NEW_PACKAGE'
    } else {
      registryStatus = 'warn'
      registryDetail = truncate(firstLine(viewText) || 'npm view', 160)
    }
    checks.push({ id: 'registry', status: registryStatus, detail: registryDetail })

    const latest = pickLatestVersion(versions)
    if (targetVersion) {
      if (!isValidVersion(targetVersion)) {
        checks.push({ id: 'version-free', status: 'fail', detail: targetVersion })
      } else if (versions.includes(targetVersion)) {
        checks.push({ id: 'version-free', status: dryRun ? 'warn' : 'fail', detail: targetVersion })
      } else {
        checks.push({ id: 'version-free', status: 'pass', detail: targetVersion })
      }
      if (latest && isValidVersion(targetVersion)) {
        const order = compareVersions(targetVersion, latest)
        checks.push({
          id: 'version-order',
          status: order < 0 ? 'warn' : 'pass',
          detail: order < 0 ? `${targetVersion} < ${latest}` : `${targetVersion} > ${latest}`,
        })
      }
      if (targetVersion.includes('-') && (!tag || tag === 'latest')) {
        checks.push({ id: 'prerelease-tag', status: 'warn', detail: targetVersion })
      }
    }

    const pack = await runNpm(
      ['pack', '--dry-run', '--json', '--ignore-scripts', '--registry', reg],
      { cwd: dir, timeoutMs: 60_000, extraEnv: authEnv },
    )
    if (pack.ok) {
      let files = []
      try {
        const parsed = JSON.parse(pack.stdout)
        const entry = Array.isArray(parsed) ? parsed[0] : parsed
        if (entry && Array.isArray(entry.files)) {
          files = entry.files.map((file) => String(file.path || '')).filter(Boolean)
        }
      } catch {
        // Fall through with an empty file list.
      }
      const required = ['package.json', 'index.js', info.clientPath, info.patchRel, info.iconInfo && info.iconInfo.rel]
        .filter(Boolean)
        .map((rel) => String(rel).replace(/^\.\//, ''))
      const missing = required.filter((rel) => !files.includes(rel))
      const hasLocale = !info.localeDir || files.some((rel) => rel.startsWith('locale/'))
      if (files.length === 0) {
        checks.push({ id: 'pack-files', status: 'warn', detail: 'EMPTY_LIST' })
      } else if (missing.length > 0 || !hasLocale) {
        checks.push({
          id: 'pack-files',
          status: 'warn',
          detail: [...missing, ...(hasLocale ? [] : ['locale/*.json'])].join(', '),
        })
      } else {
        checks.push({ id: 'pack-files', status: 'pass', detail: `${files.length}` })
      }
    } else {
      checks.push({
        id: 'pack-files',
        status: 'fail',
        detail: truncate(firstLine(pack.stderr || pack.output) || 'npm pack', 160),
      })
    }

    if (settings && settings.buildScript) {
      const scriptExists = isPlainObject(pkg.scripts) && typeof pkg.scripts[settings.buildScript] === 'string'
      checks.push({ id: 'build-script', status: scriptExists ? 'pass' : 'fail', detail: settings.buildScript })
    }

    return {
      checks,
      npm,
      info,
      targetVersion: targetVersion || null,
      authMode: mode,
      npmInfo: {
        registry: reg,
        username,
        tokenVerified,
        versions: versions.slice(-30),
        tags,
      },
    }
  }

  /* --------------------------------------------------------------- overview */

  function countChecks(checks) {
    const result = { pass: 0, warn: 0, fail: 0, skip: 0, total: checks.length }
    for (const check of checks) {
      if (check.status === 'pass') result.pass += 1
      else if (check.status === 'warn') result.warn += 1
      else if (check.status === 'fail') result.fail += 1
      else result.skip += 1
    }
    return result
  }

  function publishStatus(pkg, records) {
    const ordered = records.slice().sort(byAtDesc)
    const lastAttempt = ordered[0] || null
    const successes = ordered.filter((record) => record.ok === true && record.mode === 'publish')
    const lastSuccess = successes[0] || null
    const attention = Boolean(lastAttempt && lastAttempt.ok === false)
    if (!lastSuccess) return { state: 'unpublished', attention }
    if (lastSuccess.version === pkg.version) {
      return { state: 'published', version: lastSuccess.version, at: lastSuccess.at, attention }
    }
    return {
      state: 'pending',
      publishedVersion: lastSuccess.version,
      at: lastSuccess.at,
      attention,
    }
  }

  async function summarizeComponent(dir, origin) {
    await ensureState()
    const pkg = await readPackage(dir)
    const info = await inspectPackage(dir, pkg)
    const records = Array.isArray(state.records[dir]) ? state.records[dir] : []
    // A package rename keeps the directory but starts a new publish identity;
    // old records remain visible, while status is based on the current name.
    const currentRecords = records.filter((record) => !record.name || record.name === pkg.name)
    return {
      id: dir,
      dir,
      name: typeof pkg.name === 'string' ? pkg.name : basename(dir),
      title: info.title,
      description: info.description,
      version: typeof pkg.version === 'string' ? pkg.version : '',
      license: typeof pkg.license === 'string' ? pkg.license : null,
      private: pkg.private === true,
      kind: info.kind,
      origin: origin || 'scan',
      icon: info.iconInfo && info.iconInfo.dataUrl ? { dataUrl: info.iconInfo.dataUrl } : null,
      path: dir,
      checks: countChecks(info.checks),
      patch: info.patchRel,
      clientPath: info.clientPath,
      latestRecord: currentRecords.length > 0 ? compactRecord(currentRecords[0]) : null,
      lastPublish: (() => {
        const last = currentRecords.find((record) => record.ok === true && record.mode === 'publish')
        return last ? compactRecord(last) : null
      })(),
      recordCount: records.length,
      status: publishStatus(pkg, currentRecords),
      mtime: info.mtime,
    }
  }

  async function buildOverview(force = false) {
    if (!force && overviewCache.value && Date.now() - overviewCache.at < 4000) return overviewCache.value
    await ensureState()
    const discovery = await discover(force)
    const components = []
    for (const item of discovery.dirs) {
      try {
        components.push(await summarizeComponent(item.dir, item.origin))
      } catch (error) {
        discovery.warnings.push(`${item.dir}: ${String(error && error.message ? error.message : error)}`)
      }
    }
    components.sort((left, right) => String(left.title || left.name).localeCompare(String(right.title || right.name), 'zh-Hans-CN'))
    const npm = await resolveNpm()
    const value = {
      components,
      npm: { available: npm.available, version: npm.version },
      auth: authEnvironment(),
      defaults: baseSettings(),
      warnings: discovery.warnings.slice(0, 30),
      scanned: { dirs: discovery.scanned, at: discovery.at, roots: options.scanRoots },
      allowPublish: options.allowPublish,
      dataPath: statePath,
    }
    overviewCache = { at: Date.now(), value }
    return value
  }

  async function buildDetail(dir) {
    await ensureState()
    const pkg = await readPackage(dir)
    const info = await inspectPackage(dir, pkg)
    const records = Array.isArray(state.records[dir]) ? state.records[dir] : []
    const currentRecords = records.filter((record) => !record.name || record.name === pkg.name)
    const npm = await resolveNpm()
    const summary = {
      id: dir,
      dir,
      name: typeof pkg.name === 'string' ? pkg.name : basename(dir),
      title: info.title,
      description: info.description,
      version: typeof pkg.version === 'string' ? pkg.version : '',
      license: typeof pkg.license === 'string' ? pkg.license : null,
      private: pkg.private === true,
      kind: info.kind,
      origin: 'detail',
      icon: info.iconInfo && info.iconInfo.dataUrl ? { dataUrl: info.iconInfo.dataUrl } : null,
      path: dir,
      checks: countChecks(info.checks),
      patch: info.patchRel,
      clientPath: info.clientPath,
      latestRecord: currentRecords.length > 0 ? compactRecord(currentRecords[0]) : null,
      lastPublish: (() => {
        const last = currentRecords.find((record) => record.ok === true && record.mode === 'publish')
        return last ? compactRecord(last) : null
      })(),
      recordCount: records.length,
      status: publishStatus(pkg, currentRecords),
      mtime: info.mtime,
    }
    return {
      component: summary,
      checks: info.checks,
      settings: mergeSettings(state.settings[dir]),
      records,
      package: {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description || '',
        license: pkg.license || '',
        author: authorText(pkg.author),
        keywords: Array.isArray(pkg.keywords) ? pkg.keywords.slice(0, 12) : [],
        private: pkg.private === true,
        scripts: Object.keys(isPlainObject(pkg.scripts) ? pkg.scripts : {}),
        dependencies: Object.keys(isPlainObject(pkg.dependencies) ? pkg.dependencies : {}).length,
        exports: Object.keys(info.exportsMap),
        files: info.filesList,
        dsh: info.pkg.dsh,
      },
      locale: info.locale,
      icon: info.iconInfo ? { rel: info.iconInfo.rel, bytes: info.iconInfo.bytes, dataUrl: info.iconInfo.dataUrl } : null,
      readmeExists: info.readmeExists,
      npm: { available: npm.available, version: npm.version },
      auth: authEnvironment(),
      defaults: baseSettings(),
      allowPublish: options.allowPublish,
    }
  }

  /* -------------------------------------------------------------- publishing */

  async function writePackageVersion(dir, pkg, version) {
    const pkgPath = join(dir, 'package.json')
    const raw = await readFile(pkgPath, 'utf8')
    const indent = detectIndent(raw)
    const next = { ...pkg, version }
    const trailing = raw.endsWith('\n') ? '\n' : ''
    await writeFile(pkgPath, `${JSON.stringify(next, null, indent)}${trailing}`, 'utf8')
  }

  function makeRecord(input) {
    const commands = Array.isArray(input.commands) ? input.commands : []
    return {
      id: randomUUID(),
      dir: input.dir,
      name: String(input.pkg && input.pkg.name ? input.pkg.name : ''),
      version: input.version,
      tag: input.tag,
      access: input.access,
      registry: input.registry,
      dryRun: input.dryRun === true,
      mode: input.dryRun === true ? 'dry-run' : 'publish',
      ok: input.ok === true,
      stage: input.stage || 'publish',
      message: input.message || '',
      note: input.note || '',
      previousVersion: input.previousVersion || '',
      versionUpdated: input.versionUpdated === true,
      otpProvided: input.otpProvided === true,
      otpRequired: input.otpRequired === true,
      otpAgeMs: Number.isFinite(input.otpAgeMs) ? input.otpAgeMs : null,
      authMode: AUTH_MODES.has(input.authMode) ? input.authMode : 'session',
      tokenProvided: input.tokenProvided === true,
      terminal: input.terminal === true,
      checksFresh: input.checksFresh === true,
      at: new Date().toISOString(),
      durationMs: commands.reduce((sum, command) => sum + (Number(command.durationMs) || 0), 0),
      checks: input.checks ? countChecks(input.checks) : normalizeCheckSummary(input.checksSummary),
      logs: commands.map((command) => ({
        label: command.label,
        command: command.command,
        code: command.code,
        signal: command.signal,
        timedOut: command.timedOut === true,
        durationMs: command.durationMs,
        output: truncate(String(command.output || ''), MAX_RECORD_OUTPUT),
      })),
    }
  }

  async function publishComponent(input) {
    const startedAt = Date.now()
    const { dir, pkg: initialPkg } = await requireComponentDir(input.dir)
    if (publishing.has(dir)) throw httpError(409, '该组件正在发布中，请稍候。')
    publishing.add(dir)
    let restorePackageText = null
    let tokenAuth = null
    try {
      await ensureState()
      const settings = mergeSettings({ ...(state.settings[dir] || {}), ...sanitizeSettings(input) })
      const dryRun = input.dryRun === true
      if (!dryRun && !options.allowPublish) {
        throw httpError(403, '当前插件配置禁止正式发布（allowPublish: false）；仍可执行演练。')
      }
      const version = (typeof input.version === 'string' && input.version.trim() !== '')
        ? input.version.trim()
        : String(initialPkg.version || '')
      if (!isValidVersion(version)) throw httpError(400, '目标版本号不是合法的语义化版本，例如 1.2.3 或 1.3.0-beta.1。')
      const registry = normalizeRegistry(input.registry, settings.registry)
      const tag = TAGS.has(input.tag) ? input.tag : settings.tag
      const access = ACCESS.has(input.access) ? input.access : settings.access
      // Unscoped packages are always public; `--access` is a scoped-package
      // option, so it is omitted from the command and the stored value.
      const isScoped = typeof initialPkg.name === 'string' && initialPkg.name.startsWith('@')
      const effectiveAccess = isScoped ? access : 'public'
      const note = typeof input.note === 'string' ? input.note.trim().slice(0, 500) : settings.note
      const otp = typeof input.otp === 'string' ? input.otp.replace(/\s+/g, '') : ''
      if (otp !== '' && !/^\d{6,8}$/.test(otp)) throw httpError(400, 'OTP 应为 6–8 位数字。')
      const otpProvided = otp !== ''
      const otpAgeMs = Number.isFinite(Number(input.otpAgeMs)) && Number(input.otpAgeMs) >= 0
        ? Math.min(Math.trunc(Number(input.otpAgeMs)), 10 * 60_000)
        : null
      const accessToken = typeof input.accessToken === 'string' ? input.accessToken.trim() : ''
      const requestedAuthMode = AUTH_MODES.has(input.authMode) ? input.authMode : settings.authMode
      // A dry run never authenticates against the registry, so it uses the
      // plain session path and requires no token or OTP.
      const authMode = dryRun ? 'session' : requestedAuthMode
      const envInfo = authEnvironment()
      if (authMode === 'token') {
        if (accessToken === '') throw httpError(400, '请填写 Granular Access Token（细粒度访问令牌）。')
        if (!validAccessToken(accessToken)) throw httpError(400, '访问令牌格式不正确：不能包含空白或换行。')
      }
      if (authMode === 'oidc' && !envInfo.oidc.available) {
        throw httpError(400, '当前环境没有 OIDC：OIDC 可信发布仅在 GitHub Actions（id-token: write）或 GitLab CI（NPM_ID_TOKEN）中可用。')
      }
      const tokenProvided = authMode === 'token' && accessToken !== ''
      const buildScript = typeof input.buildScript === 'string'
        ? cleanScriptName(input.buildScript)
        : settings.buildScript
      const checksFresh = input.checksFresh === true && settings.requireChecks
      const previousVersion = String(initialPkg.version || '')
      const commands = []
      let versionUpdated = false
      let pkg = initialPkg

      await exclusive(async () => {
        state.settings[dir] = {
          ...settings, registry, tag, access: effectiveAccess, note, buildScript,
          authMode: requestedAuthMode,
        }
        await persist()
      })

      const recordFailure = async (stage, message, extra = {}) => {
        const record = makeRecord({
          dir, pkg, version, tag, access: effectiveAccess, registry, dryRun, ok: false, stage, message, note,
          previousVersion, versionUpdated, commands, checks: extra.checks || null,
          checksSummary: extra.checksSummary, checksFresh,
          otpProvided, otpRequired: extra.otpRequired === true, otpAgeMs,
          authMode, tokenProvided,
        })
        await saveRecord(record)
        return {
          ok: false,
          error: message,
          stage,
          record,
          checks: extra.checks || [],
          versionUpdated,
          previousVersion,
          authMode,
          tokenProvided,
        }
      }

      if (version !== previousVersion) {
        if (settings.writeVersion === false) {
          throw httpError(400, `package.json 当前版本为 ${previousVersion}，请先改为 ${version}，或允许自动写入版本号。`)
        }
        // A dry run must leave the checkout untouched: keep the original
        // package.json and restore it after the tarball has been rehearsed.
        if (dryRun) restorePackageText = await readFile(join(dir, 'package.json'), 'utf8')
        await writePackageVersion(dir, initialPkg, version)
        versionUpdated = dryRun !== true
        pkg = await readPackage(dir)
      }

      if (buildScript) {
        if (!isPlainObject(pkg.scripts) || typeof pkg.scripts[buildScript] !== 'string') {
          return await recordFailure('build', `package.json 中没有名为 ${buildScript} 的脚本。`)
        }
        const build = await runNpm(['run', buildScript], { cwd: dir, timeoutMs: options.publishTimeoutMs })
        commands.push({
          label: 'build',
          command: `npm run ${buildScript}`,
          code: build.code,
          signal: build.signal,
          timedOut: build.timedOut,
          durationMs: build.durationMs,
          output: build.output,
        })
        if (!build.ok) {
          return await recordFailure('build', build.timedOut ? '构建超时。' : '构建失败。', {})
        }
      }

      // Only the publish itself needs the one-time token file; build scripts
      // keep the user's normal npm configuration.
      if (authMode === 'token') tokenAuth = await createTokenNpmrc(registry, accessToken)
      const authEnv = tokenAuth ? { npm_config_userconfig: tokenAuth.file } : undefined

      let checkResult = null
      if (settings.requireChecks && !checksFresh) {
        checkResult = await runChecks(dir, {
          targetVersion: version,
          registry,
          tag,
          settings: { ...settings, buildScript },
          dryRun,
          authMode,
          authEnv,
          tokenProvided,
          oidc: envInfo.oidc,
        })
        const failed = checkResult.checks.filter((check) => check.status === 'fail')
        if (failed.length > 0) {
          return await recordFailure('checks', `发布预检查未通过（${failed.length} 项阻断）。`, {
            checks: checkResult.checks,
          })
        }
      }

      const npm = await resolveNpm()
      if (!npm.available) return await recordFailure('publish', '找不到 npm 可执行文件。')
      const args = ['publish']
      if (dryRun) args.push('--dry-run')
      args.push('--tag', tag)
      if (isScoped) args.push('--access', effectiveAccess)
      args.push('--registry', registry)

      // Credentials never enter argv, records, or logs:
      //  - session: OTP through npm_config_otp (npm sends the npm-otp header)
      //  - token: a private temporary npmrc through npm_config_userconfig
      //  - oidc: npm exchanges the CI ID token by itself
      let env
      if (authMode === 'token') env = authEnv
      else if (authMode === 'session' && otp) env = { npm_config_otp: otp }
      const result = await runNpm(args, { cwd: dir, timeoutMs: options.publishTimeoutMs, extraEnv: env })
      const resultText = `${result.stderr || ''}\n${result.output || ''}`
      const otpRequired = /EOTP|one-time password|one-time pass/i.test(resultText)
      const bypassRequired = /bypass 2fa|two-factor authentication or granular access token with bypass|granular access token with bypass 2fa enabled/i.test(resultText)
      const versionConflict = /EPUBLISHCONFLICT|previously published|cannot publish over|已发布的版本/i.test(resultText)
      const latestTagConflict = /Cannot implicitly apply the ["']?latest["']? tag|previously published version .* is higher/i.test(resultText)
      const authFailure = /ENEEDAUTH|need auth|not logged in|E401|401 Unauthorized|Unauthorized|E403|403 Forbidden|not authorized/i.test(resultText)
      const authNote = dryRun
        ? ''
        : authMode === 'token'
          ? ' # auth: granular access token (temporary npmrc)'
          : authMode === 'oidc'
            ? ' # auth: OIDC trusted publishing'
            : otpProvided
              ? ' # auth: local session + OTP (npm_config_otp)'
              : ' # auth: local session'
      commands.push({
        label: 'publish',
        command: `npm ${args.join(' ')}${authNote}`,
        code: result.code,
        signal: result.signal,
        timedOut: result.timedOut,
        durationMs: result.durationMs,
        output: result.output,
      })
      const ok = result.ok
      let message
      if (ok) {
        message = dryRun
          ? restorePackageText !== null
            ? '演练完成：打包正常，package.json 版本已还原，未写入 registry。'
            : '演练完成：npm 打包内容可以发布，未写入 registry。'
          : `已发布 ${String(pkg.name || '')}@${version}。`
      } else if (result.timedOut) {
        message = 'npm publish 超时。'
      } else if (versionConflict) {
        message = '该版本已经存在于 registry，不能被覆盖；请提升版本号后重试。'
      } else if (latestTagConflict) {
        message = '目标版本低于已发布的最新版，不能把 latest 指回旧版本；请提升版本号或改用其他 tag。'
      } else if (bypassRequired) {
        if (authMode === 'token') {
          message = '该 Granular Token 未开启 Bypass 2FA：npm 要求发布时进行 2FA（插件不会弹出浏览器）。请重新创建令牌并开启 Bypass 2FA（npm token create --bypass-2fa），或改用「本机登录会话 + OTP」。'
        } else if (authMode === 'session') {
          message = 'npm 要求发布时进行 2FA：请填写 OTP；如果账号使用安全密钥/网页型 2FA，请在终端发布或使用开启 Bypass 2FA 的令牌。'
        } else {
          message = 'OIDC 发布仍被要求 2FA：请检查 npm 包的 Trusted Publisher 配置。'
        }
      } else if (otpRequired) {
        if (authMode === 'token') {
          message = '该 Granular Token 仍要求 2FA（插件不会弹出浏览器）：请重新创建令牌并开启 Bypass 2FA（npm token create --bypass-2fa），或切换到「本机登录会话 + OTP」。'
        } else if (authMode === 'oidc') {
          message = 'OIDC 发布仍被要求额外验证：请检查 npm 包的 Trusted Publisher 配置。'
        } else if (otpProvided) {
          const ageAtPublish = Number.isFinite(otpAgeMs) ? otpAgeMs + (Date.now() - startedAt) : null
          const ageSeconds = ageAtPublish === null ? null : Math.max(0, Math.round(ageAtPublish / 1000))
          const ageText = ageSeconds === null ? '' : `约 ${ageSeconds} 秒`
          if (ageSeconds !== null && ageSeconds > 25) {
            message = `OTP 可能已过期：到达发布执行时验证码已输入${ageText}。请重新打开确认弹窗，用刚生成的验证码再试。`
          } else {
            message = `OTP 被 registry 拒绝（到达发布执行时验证码仅输入${ageText || '几秒'}）：请确认验证码属于当前 npm 账号，且 2FA 方式是身份验证器 TOTP。如果使用安全密钥/网页型 2FA，请改用开启 Bypass 2FA 的 Granular Token，或在终端执行 npm publish 完成浏览器授权。`
          }
        } else {
          message = 'npm 要求一次性密码（OTP）：请填写 6 位动态验证码后重试。'
        }
      } else if (authFailure) {
        if (authMode === 'token') {
          message = 'Granular Token 无效、已过期或缺少发布权限。'
        } else if (authMode === 'oidc') {
          message = 'OIDC 可信发布未通过：请确认 npm 包已配置 Trusted Publisher，且 CI 具备 id-token 权限。'
        } else {
          message = '本机会话无效或已过期：请在终端运行 npm login（2 小时会话）后重试。'
        }
      } else {
        message = 'npm publish 失败。'
      }
      const record = makeRecord({
        dir, pkg, version, tag, access: effectiveAccess, registry, dryRun, ok, stage: 'publish', message, note,
        previousVersion, versionUpdated, commands,
        checks: checkResult ? checkResult.checks : null,
        checksSummary: checksFresh ? input.checksSummary : undefined,
        checksFresh,
        otpProvided, otpRequired, otpAgeMs, authMode, tokenProvided,
      })
      await saveRecord(record)
      overviewCache = { at: 0, value: null }
      return {
        ok,
        record,
        checks: checkResult ? checkResult.checks : [],
        versionUpdated,
        previousVersion,
        otpProvided,
        otpRequired,
        authMode,
        tokenProvided,
        oidc: envInfo.oidc,
        ...(ok ? {} : { error: message }),
      }
    } finally {
      if (tokenAuth) await tokenAuth.cleanup()
      if (restorePackageText !== null) {
        try {
          await writeFile(join(dir, 'package.json'), restorePackageText, 'utf8')
        } catch (error) {
          ctx.logger?.warn?.(`nanshan-publish-manager: cannot restore package.json: ${String(error && error.message ? error.message : error)}`)
        }
      }
      publishing.delete(dir)
    }
  }

  async function openSystemTerminal(scriptPath) {
    if (process.platform === 'darwin') {
      const opened = await runProcess('/usr/bin/open', ['-a', 'Terminal', scriptPath], { timeoutMs: 15_000 })
      if (!opened.ok) {
        const detail = firstLine(opened.stderr || opened.output) || 'open 失败'
        throw httpError(500, `无法打开 Terminal：${detail}`)
      }
      return 'Terminal'
    }
    if (process.platform === 'win32') {
      try {
        await launchDetached('cmd.exe', ['/d', '/s', '/c', 'start', '', 'cmd.exe', '/k', scriptPath])
        return 'cmd'
      } catch (error) {
        throw httpError(500, `无法打开命令提示符：${String(error && error.message ? error.message : error)}`)
      }
    }
    if (process.platform === 'linux') {
      const candidates = [
        ['x-terminal-emulator', ['-e', 'bash', scriptPath]],
        ['gnome-terminal', ['--', 'bash', scriptPath]],
        ['konsole', ['-e', 'bash', scriptPath]],
        ['xfce4-terminal', ['--command', `bash ${shellQuote(scriptPath)}`]],
        ['xterm', ['-e', 'bash', scriptPath]],
      ]
      for (const [command, args] of candidates) {
        const resolved = await findOnPath(command)
        if (!resolved) continue
        try {
          await launchDetached(resolved, args)
          return command
        } catch {
          // Try the next terminal emulator.
        }
      }
      throw httpError(500, '未找到可用的系统终端（x-terminal-emulator / gnome-terminal / konsole / xfce4-terminal / xterm）。')
    }
    throw httpError(400, `当前系统（${process.platform}）不支持自动打开终端。`)
  }

  async function publishInTerminal(input) {
    const startedAt = Date.now()
    const { dir, pkg: initialPkg } = await requireComponentDir(input.dir)
    if (publishing.has(dir)) throw httpError(409, '该组件正在发布中，请稍候。')
    publishing.add(dir)
    try {
      await ensureState()
      const settings = mergeSettings({ ...(state.settings[dir] || {}), ...sanitizeSettings(input) })
      if (!options.allowPublish) throw httpError(403, '当前插件配置禁止正式发布（allowPublish: false）。')
      const requestedAuthMode = AUTH_MODES.has(input.authMode) ? input.authMode : settings.authMode
      if (requestedAuthMode !== 'session') {
        throw httpError(400, '「在系统终端发布」只适用于本机登录会话方式。')
      }
      const version = (typeof input.version === 'string' && input.version.trim() !== '')
        ? input.version.trim()
        : String(initialPkg.version || '')
      if (!isValidVersion(version)) throw httpError(400, '目标版本号不是合法的语义化版本，例如 1.2.3 或 1.3.0-beta.1。')
      const registry = normalizeRegistry(input.registry, settings.registry)
      const tag = TAGS.has(input.tag) ? input.tag : settings.tag
      const access = ACCESS.has(input.access) ? input.access : settings.access
      const isScoped = typeof initialPkg.name === 'string' && initialPkg.name.startsWith('@')
      const effectiveAccess = isScoped ? access : 'public'
      const note = typeof input.note === 'string' ? input.note.trim().slice(0, 500) : settings.note
      const buildScript = typeof input.buildScript === 'string'
        ? cleanScriptName(input.buildScript)
        : settings.buildScript
      if (settings.requireChecks && input.checksFresh !== true) {
        throw httpError(400, '请先运行发布预检查并通过，再在系统终端发布。')
      }
      if (buildScript && (!isPlainObject(initialPkg.scripts) || typeof initialPkg.scripts[buildScript] !== 'string')) {
        throw httpError(400, `package.json 中没有名为 ${buildScript} 的脚本。`)
      }
      const previousVersion = String(initialPkg.version || '')
      let versionUpdated = false
      let pkg = initialPkg

      await exclusive(async () => {
        state.settings[dir] = {
          ...settings, registry, tag, access: effectiveAccess, note, buildScript, authMode: 'session',
        }
        await persist()
      })

      if (version !== previousVersion) {
        if (settings.writeVersion === false) {
          throw httpError(400, `package.json 当前版本为 ${previousVersion}，请先改为 ${version}，或允许自动写入版本号。`)
        }
        await writePackageVersion(dir, initialPkg, version)
        versionUpdated = true
        pkg = await readPackage(dir)
      }

      const npm = await resolveNpm()
      if (!npm.available) throw httpError(500, '找不到 npm 可执行文件。')
      const publishArgs = ['publish', '--tag', tag]
      if (isScoped) publishArgs.push('--access', effectiveAccess)
      publishArgs.push('--registry', registry)
      const display = `${buildScript ? `npm run ${buildScript} && ` : ''}npm publish --tag ${tag}${isScoped ? ` --access ${effectiveAccess}` : ''} --registry ${registry} # auth: local session (system terminal)`
      const id = randomUUID()
      const taskDir = join(dataDir, 'terminal', id)
      await mkdir(taskDir, { recursive: true })
      const statusPath = join(taskDir, 'publish.status')
      const scriptPath = join(taskDir, process.platform === 'win32' ? 'publish.cmd' : 'publish.command')
      const binDir = npm.binDir || dirname(npm.executable)

      let script
      if (process.platform === 'win32') {
        const q = cmdQuote
        const lines = [
          '@echo off',
          'chcp 65001 >nul',
          'setlocal',
          `set "PATH=${String(binDir).replace(/%/g, '%%')};%PATH%"`,
          `cd /d ${q(dir)}`,
        ]
        if (buildScript) {
          lines.push(`${q(npm.executable)} run ${q(buildScript)}`)
          lines.push('set "code=%ERRORLEVEL%"')
          lines.push('if not "%code%"=="0" goto done')
        } else {
          lines.push('set "code=0"')
        }
        lines.push(`${q(npm.executable)} ${publishArgs.map(q).join(' ')}`)
        lines.push('set "code=%ERRORLEVEL%"')
        lines.push(':done')
        lines.push(`> ${q(statusPath)} echo %code%`)
        lines.push('echo.')
        lines.push('echo Publish finished with exit code %code%.')
        lines.push('pause')
        lines.push('exit /b %code%')
        lines.push('')
        script = lines.join('\r\n')
      } else {
        const q = shellQuote
        const lines = [
          '#!/bin/bash',
          `export PATH=${q(binDir)}:"$PATH"`,
          `cd ${q(dir)} || exit 90`,
        ]
        if (buildScript) {
          lines.push(`${q(npm.executable)} run ${q(buildScript)}`)
          lines.push('code=$?')
        } else {
          lines.push('code=0')
        }
        lines.push('if [ "$code" -eq 0 ]; then')
        lines.push(`  ${q(npm.executable)} ${publishArgs.map(q).join(' ')}`)
        lines.push('  code=$?')
        lines.push('fi')
        lines.push(`printf '%s\\n' "$code" > ${q(statusPath)}`)
        lines.push(`printf '\\n发布结束，退出码 %s。按任意键关闭窗口…\\n' "$code"`)
        lines.push('read -n 1 -s -r')
        lines.push('exit "$code"')
        lines.push('')
        script = lines.join('\n')
      }
      await writeFile(scriptPath, script, { encoding: 'utf8', mode: 0o700 })

      const terminalName = await openSystemTerminal(scriptPath)
      const deadline = Date.now() + 15 * 60_000
      let code = null
      while (Date.now() < deadline) {
        if (await exists(statusPath)) {
          const text = (await readFile(statusPath, 'utf8')).trim()
          if (/^-?\d+$/.test(text)) {
            code = Number(text)
            break
          }
        }
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 1000))
      }
      if (code === null) {
        throw httpError(504, `已打开系统终端（${terminalName}），但等待发布结果超时。请查看终端窗口；如果仍在运行，完成后重新运行发布预检查确认状态。`)
      }
      const ok = code === 0
      const record = makeRecord({
        dir, pkg, version, tag, access: effectiveAccess, registry, dryRun: false, ok, stage: 'publish',
        message: ok
          ? `已在系统终端完成发布 ${String(pkg.name || '')}@${version}。`
          : `终端发布失败（退出码 ${code}）；请查看系统终端窗口中的输出。`,
        note, previousVersion, versionUpdated,
        commands: [{
          label: 'publish',
          command: display,
          code,
          signal: null,
          timedOut: false,
          durationMs: Date.now() - startedAt,
          output: '',
        }],
        checksSummary: input.checksSummary,
        checksFresh: true,
        authMode: 'session',
        tokenProvided: false,
        otpProvided: false,
        otpRequired: false,
        terminal: true,
      })
      await saveRecord(record)
      overviewCache = { at: 0, value: null }
      return {
        ok,
        record,
        versionUpdated,
        previousVersion,
        authMode: 'session',
        terminal: terminalName,
        ...(ok ? {} : { error: record.message }),
      }
    } finally {
      publishing.delete(dir)
    }
  }

  /* ---------------------------------------------------------------- routing */

  async function requireComponentDir(raw) {
    if (typeof raw !== 'string' || raw.trim() === '') throw httpError(400, '缺少组件目录。')
    const rawDir = expandHome(raw.trim())
    if (!isAbsolute(rawDir)) throw httpError(400, '组件目录必须是绝对路径。')
    let dir
    try {
      dir = await realpath(rawDir)
    } catch {
      throw httpError(404, '组件目录不存在。')
    }
    const pkg = await readPackageQuiet(dir)
    if (!pkg) throw httpError(404, '该目录没有可读的 package.json。')
    if (!isDshPackage(pkg)) throw httpError(400, '该目录不是 DSH 组件（缺少 dsh.bundle 或 dsh.client）。')
    return { dir, pkg }
  }

  async function checkComponent(input) {
    const { dir } = await requireComponentDir(input.dir)
    await ensureState()
    const settings = mergeSettings({ ...(state.settings[dir] || {}), ...sanitizeSettings(input) })
    const registry = normalizeRegistry(input.registry, settings.registry)
    const targetVersion = typeof input.version === 'string' && input.version.trim() !== ''
      ? input.version.trim()
      : undefined
    const tag = TAGS.has(input.tag) ? input.tag : settings.tag
    const authMode = AUTH_MODES.has(input.authMode) ? input.authMode : settings.authMode
    const accessToken = typeof input.accessToken === 'string' ? input.accessToken.trim() : ''
    if (authMode === 'token' && accessToken !== '' && !validAccessToken(accessToken)) {
      throw httpError(400, '访问令牌格式不正确：不能包含空白或换行。')
    }
    const tokenProvided = authMode === 'token' && accessToken !== ''
    const envInfo = authEnvironment()
    let tokenAuth = null
    try {
      if (tokenProvided) tokenAuth = await createTokenNpmrc(registry, accessToken)
      const result = await runChecks(dir, {
        targetVersion,
        registry,
        tag,
        settings,
        authMode,
        authEnv: tokenAuth ? { npm_config_userconfig: tokenAuth.file } : undefined,
        tokenProvided,
        oidc: envInfo.oidc,
      })
      return {
        checks: result.checks,
        summary: countChecks(result.checks),
        npmInfo: result.npmInfo,
        targetVersion: result.targetVersion,
        authMode,
        tokenProvided,
        oidc: envInfo.oidc,
        npm: { available: result.npm.available, version: result.npm.version },
      }
    } finally {
      if (tokenAuth) await tokenAuth.cleanup()
    }
  }

  async function fetchTotalAllTime(name, end) {
    const cached = totalsCache.get(name)
    if (cached && Date.now() - cached.at < cached.ttl) return cached.value
    const remember = (value, ttl) => {
      totalsCache.set(name, { at: Date.now(), ttl, value })
      return value
    }
    const rangeTotal = async (from, to) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 15_000)
      let response
      try {
        response = await fetch(`https://api.npmjs.org/downloads/range/${encodeURIComponent(from)}:${encodeURIComponent(to)}/${encodeURIComponent(name)}`, {
          signal: controller.signal,
          headers: { accept: 'application/json' },
        })
      } catch {
        return null
      } finally {
        clearTimeout(timer)
      }
      if (!response.ok) return null
      const data = await response.json().catch(() => null)
      if (!data || !Array.isArray(data.downloads)) return null
      return data.downloads.reduce((sum, point) => sum + (Number(point && point.downloads) || 0), 0)
    }
    // 以包首次发布时间为统计起点，避免从一个固定旧年份空跑请求。
    let created = null
    try {
      const metaResponse = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
        headers: { accept: 'application/json' },
      })
      if (metaResponse.ok) {
        const meta = await metaResponse.json().catch(() => null)
        if (meta && meta.time && meta.time.created) {
          const parsed = new Date(meta.time.created)
          if (!Number.isNaN(parsed.getTime())) created = parsed
        }
      }
    } catch {
      created = null
    }
    if (!created) return remember(null, 60 * 60_000)
    let sum = 0
    let cursor = new Date(created)
    const last = new Date(`${end}T00:00:00Z`)
    while (cursor.getTime() <= last.getTime()) {
      const chunkEnd = new Date(Math.min(cursor.getTime() + 499 * 86_400_000, last.getTime()))
      const part = await rangeTotal(localDateString(cursor), localDateString(chunkEnd))
      if (part != null) sum += part
      cursor = new Date(chunkEnd.getTime() + 86_400_000)
    }
    return remember(sum, 60 * 60_000)
  }

  async function getDownloads(rawDir) {
    const { pkg } = await requireComponentDir(rawDir)
    const name = typeof pkg.name === 'string' ? pkg.name : ''
    if (!name) throw httpError(400, '该组件没有可查询的 npm 包名。')
    // 近 7 天按本机“今天”往前 6 天取显式区间，规避 last-week 的 UTC 滞后窗口，
    // 让最后一天始终是动态的今天。
    const today = new Date()
    const start = localDateString(addDays(today, -6))
    const end = localDateString(today)
    const cacheKey = `${name}|${start}|${end}`
    const cached = downloadsCache.get(cacheKey)
    if (cached && Date.now() - cached.at < cached.ttl) return cached.value
    const remember = (value, ttl) => {
      downloadsCache.set(cacheKey, { at: Date.now(), ttl, value })
      return value
    }
    const unavailable = (message) => remember({
      package: name,
      points: [],
      total: 0,
      totalAllTime: null,
      start,
      end,
      unavailable: true,
      error: message,
      fetchedAt: new Date().toISOString(),
    }, 2 * 60_000)

    const totalAllTime = await fetchTotalAllTime(name, end)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)
    let response
    try {
      response = await fetch(`https://api.npmjs.org/downloads/range/${encodeURIComponent(start)}:${encodeURIComponent(end)}/${encodeURIComponent(name)}`, {
        signal: controller.signal,
        headers: { accept: 'application/json' },
      })
    } catch (error) {
      return unavailable(error && error.name === 'AbortError' ? '查询下载量超时。' : '无法连接 npm 下载统计接口。')
    } finally {
      clearTimeout(timer)
    }
    if (response.status === 404) {
      return remember({
        package: name,
        points: [],
        total: 0,
        totalAllTime,
        start,
        end,
        unavailable: false,
        empty: true,
        fetchedAt: new Date().toISOString(),
      }, 10 * 60_000)
    }
    if (!response.ok) return unavailable(`npm 下载统计接口返回 HTTP ${response.status}。`)
    let data
    try {
      data = await response.json()
    } catch {
      return unavailable('npm 下载统计返回了无法解析的数据。')
    }
    const byDay = new Map()
    for (const point of (Array.isArray(data.downloads) ? data.downloads : [])) {
      const day = String(point && point.day ? point.day : '')
      if (day) byDay.set(day, Number(point && point.downloads) || 0)
    }
    const points = []
    for (let offset = -6; offset <= 0; offset += 1) {
      const day = localDateString(addDays(today, offset))
      points.push({ day, downloads: byDay.get(day) || 0 })
    }
    return remember({
      package: name,
      start,
      end,
      points,
      total: points.reduce((sum, point) => sum + point.downloads, 0),
      totalAllTime,
      unavailable: false,
      empty: points.length === 0,
      fetchedAt: new Date().toISOString(),
    }, 10 * 60_000)
  }

  async function addTarget(rawDir) {
    await ensureState()
    const { dir } = await requireComponentDir(rawDir)
    return exclusive(async () => {
      if (!state.targets.includes(dir)) state.targets.push(dir)
      await persist()
      discoveryCache = { at: 0, value: null }
      overviewCache = { at: 0, value: null }
      return { dir, targets: state.targets.slice() }
    })
  }

  async function npmWhoami() {
    const npm = await resolveNpm()
    if (!npm.available) {
      return { available: false, username: null, npm: null }
    }
    const who = await runNpm(['whoami'], { timeoutMs: 30_000 })
    const username = who.ok ? (firstLine(who.stdout) || firstLine(who.output)) : null
    return { available: true, username: username || null, npm: npm.version || '' }
  }

  async function openLoginTerminal() {
    const npm = await resolveNpm()
    if (!npm.available) throw httpError(500, '找不到 npm 可执行文件。')
    const binDir = npm.binDir || dirname(npm.executable)
    const taskDir = join(dataDir, 'terminal', randomUUID())
    await mkdir(taskDir, { recursive: true })
    const scriptPath = join(taskDir, process.platform === 'win32' ? 'login.cmd' : 'login.command')
    let script
    if (process.platform === 'win32') {
      const q = cmdQuote
      const lines = [
        '@echo off',
        'chcp 65001 >nul',
        'setlocal',
        `set "PATH=${String(binDir).replace(/%/g, '%%')};%PATH%"`,
        'echo Nanshan DSH publish assistant - npm login',
        `${q(npm.executable)} login`,
        'echo.',
        'echo Login finished. Close this window when done.',
        'pause',
        'exit /b %ERRORLEVEL%',
        '',
      ]
      script = lines.join('\r\n')
    } else {
      const q = shellQuote
      const lines = [
        '#!/bin/bash',
        `export PATH=${q(binDir)}:"$PATH"`,
        'printf "Nanshan DSH publish assistant - npm login\\n"',
        `${q(npm.executable)} login`,
        'printf "\\n登录结束，按任意键关闭窗口…\\n"',
        'read -n 1 -s -r',
        'exit 0',
        '',
      ]
      script = lines.join('\n')
    }
    await writeFile(scriptPath, script, { encoding: 'utf8', mode: 0o700 })
    const terminalName = await openSystemTerminal(scriptPath)
    return { terminal: terminalName }
  }

  function maskToken(value) {
    const text = String(value || '')
    if (text.length <= 8) return '••••••'
    return `${text.slice(0, 4)}…${text.slice(-4)}`
  }

  async function listTokens() {
    await ensureState()
    return state.tokens.map((token) => ({ id: token.id, name: token.name, masked: maskToken(token.value), createdAt: token.createdAt || '' }))
  }

  async function saveToken(input) {
    await ensureState()
    const name = typeof input.name === 'string' ? input.name.trim().slice(0, 60) : ''
    const value = typeof input.value === 'string' ? input.value.trim() : ''
    if (name === '') throw httpError(400, '请填写令牌名称。')
    if (!validAccessToken(value)) throw httpError(400, '令牌格式不正确：不能包含空白或换行。')
    const id = typeof input.id === 'string' && input.id !== '' ? input.id : null
    await exclusive(async () => {
      if (id) {
        const existing = state.tokens.find((token) => token.id === id)
        if (!existing) throw httpError(404, '找不到要更新的令牌。')
        existing.name = name
        existing.value = value
      } else {
        state.tokens.push({ id: randomUUID(), name, value, createdAt: new Date().toISOString() })
      }
      await persist()
    })
    return listTokens()
  }

  async function deleteToken(input) {
    await ensureState()
    const id = typeof input.id === 'string' ? input.id : ''
    await exclusive(async () => {
      const before = state.tokens.length
      state.tokens = state.tokens.filter((token) => token.id !== id)
      if (state.tokens.length === before && id !== '') throw httpError(404, '找不到要删除的令牌。')
      await persist()
    })
    return listTokens()
  }

  async function revealToken(input) {
    await ensureState()
    const id = typeof input.id === 'string' ? input.id : ''
    const token = state.tokens.find((entry) => entry.id === id)
    if (!token) throw httpError(404, '找不到该令牌。')
    return { value: token.value }
  }

  async function handler(request, response) {
    let url
    try {
      url = new URL(request.url || API, 'http://localhost')
    } catch {
      return sendJson(response, 400, { ok: false, code: 'bad-url', message: '无法解析请求地址。' })
    }
    const pathname = url.pathname
    try {
      // This surface can execute npm against local directories. Keep it on
      // loopback even when the Web server itself listens beyond it.
      if (!isLoopbackRequest(request)) {
        return sendJson(response, 403, { ok: false, code: 'local-only', message: '发布管理接口只接受本机请求。' })
      }
      if (request.method === 'GET' || request.method === 'HEAD') {
        if (request.method === 'HEAD') {
          response.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
          response.end()
          return
        }
        if (pathname === API) {
          const force = url.searchParams.get('refresh') === '1'
          return sendJson(response, 200, { ok: true, ...(await buildOverview(force)) })
        }
        if (pathname === `${API}/component`) {
          const { dir } = await requireComponentDir(url.searchParams.get('dir'))
          return sendJson(response, 200, { ok: true, ...(await buildDetail(dir)) })
        }
        if (pathname === `${API}/downloads`) {
          return sendJson(response, 200, { ok: true, ...(await getDownloads(url.searchParams.get('dir'))) })
        }
        if (pathname === `${API}/whoami`) {
          return sendJson(response, 200, { ok: true, ...(await npmWhoami()) })
        }
        if (pathname === `${API}/tokens`) {
          return sendJson(response, 200, { ok: true, tokens: await listTokens() })
        }
        return sendJson(response, 404, { ok: false, code: 'not-found', message: '未知的发布管理接口。' })
      }
      if (request.method !== 'POST') {
        response.setHeader('allow', 'GET, HEAD, POST')
        return sendJson(response, 405, { ok: false, code: 'method', message: '请使用 GET 或 POST。' })
      }
      if (!sameOrigin(request)) {
        return sendJson(response, 403, { ok: false, code: 'origin', message: '拒绝跨站写入发布管理数据。' })
      }
      const body = await readJsonBody(request)
      if (pathname === `${API}/check`) {
        return sendJson(response, 200, { ok: true, ...(await checkComponent(body || {})) })
      }
      if (pathname === `${API}/settings`) {
        const { dir } = await requireComponentDir(body && body.dir)
        const settings = await saveSettings(dir, body && body.settings)
        return sendJson(response, 200, { ok: true, settings })
      }
      if (pathname === `${API}/targets`) {
        if (!body || body.action !== 'add') {
          return sendJson(response, 400, { ok: false, code: 'action', message: '只支持添加组件目录。' })
        }
        return sendJson(response, 200, { ok: true, ...(await addTarget(body.dir)) })
      }
      if (pathname === `${API}/publish`) {
        return sendJson(response, 200, { ok: true, ...(await publishComponent(body || {})) })
      }
      if (pathname === `${API}/publish-terminal`) {
        return sendJson(response, 200, { ok: true, ...(await publishInTerminal(body || {})) })
      }
      if (pathname === `${API}/npm-login`) {
        return sendJson(response, 200, { ok: true, ...(await openLoginTerminal()) })
      }
      if (pathname === `${API}/tokens`) {
        const action = body && body.action
        if (action === 'save') return sendJson(response, 200, { ok: true, tokens: await saveToken(body || {}) })
        if (action === 'delete') return sendJson(response, 200, { ok: true, tokens: await deleteToken(body || {}) })
        if (action === 'reveal') return sendJson(response, 200, { ok: true, ...(await revealToken(body || {})) })
        return sendJson(response, 400, { ok: false, code: 'bad-action', message: '未知的令牌操作。' })
      }
      return sendJson(response, 404, { ok: false, code: 'not-found', message: '未知的发布管理接口。' })
    } catch (error) {
      const status = error && Number.isInteger(error.status) ? error.status : 500
      if (status >= 500) {
        ctx.logger?.warn?.(`nanshan-publish-manager: ${error && error.stack ? error.stack : String(error)}`)
      }
      return sendJson(response, status, {
        ok: false,
        code: error && typeof error.code === 'string' ? error.code : status === 500 ? 'internal' : 'request',
        message: error && error.message ? String(error.message) : '发布管理请求失败。',
      })
    }
  }

  ctx.effect(
    () => ctx.webServer.register({ kind: 'prefix', path: API, handler }),
    'nanshan-publish-manager: publish management api',
  )
}

/* ------------------------------------------------------------------ helpers */

function httpError(status, message, code) {
  const error = new Error(message)
  error.status = status
  if (code) error.code = code
  return error
}

function sendJson(response, status, payload) {
  if (response.headersSent) return
  const body = Buffer.from(JSON.stringify(payload), 'utf8')
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.length),
    'cache-control': 'no-store',
  })
  response.end(body)
}

function sameOrigin(request) {
  const origin = request.headers.origin
  if (typeof origin !== 'string' || origin === '') return true
  try {
    return new URL(origin).host === request.headers.host
  } catch {
    return false
  }
}

function isLoopbackRequest(request) {
  const address = request.socket && request.socket.remoteAddress
  if (typeof address !== 'string' || address === '') return true
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
}

function readJsonBody(request) {
  return new Promise((resolveBody, reject) => {
    const declared = Number(request.headers['content-length'])
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      reject(httpError(413, '请求内容过大。'))
      request.destroy()
      return
    }
    let size = 0
    const chunks = []
    request.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(httpError(413, '请求内容过大。'))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => {
      if (chunks.length === 0) {
        resolveBody({})
        return
      }
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(httpError(400, '请求内容不是合法的 JSON。'))
      }
    })
    request.on('error', (error) => reject(httpError(400, String(error && error.message ? error.message : error))))
  })
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isRecordShape(record) {
  return Boolean(record) &&
    typeof record === 'object' &&
    typeof record.id === 'string' &&
    typeof record.at === 'string' &&
    typeof record.version === 'string' &&
    (record.mode === 'publish' || record.mode === 'dry-run')
}

function byAtDesc(left, right) {
  return String(right && right.at).localeCompare(String(left && left.at))
}

function compactRecord(record) {
  if (!record) return null
  const { logs, ...rest } = record
  return { ...rest, logCount: Array.isArray(logs) ? logs.length : 0 }
}

function sanitizeSettings(value) {
  if (!isPlainObject(value)) return {}
  const result = {}
  if (typeof value.registry === 'string' && value.registry.trim() !== '') {
    try {
      result.registry = stripTrailingSlash(value.registry.trim())
      const url = new URL(result.registry)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') delete result.registry
    } catch {
      delete result.registry
    }
  }
  if (TAGS.has(value.tag)) result.tag = value.tag
  if (ACCESS.has(value.access)) result.access = value.access
  if (AUTH_MODES.has(value.authMode)) result.authMode = value.authMode
  for (const key of ['dryRunFirst', 'requireChecks', 'writeVersion']) {
    if (typeof value[key] === 'boolean') result[key] = value[key]
  }
  if (typeof value.buildScript === 'string') {
    const clean = value.buildScript.trim()
    result.buildScript = SCRIPT_RE.test(clean) ? clean : ''
  }
  if (typeof value.note === 'string') result.note = value.note.slice(0, 500)
  return result
}

function normalizeScanRoots(value) {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
  const roots = []
  for (const entry of list) {
    if (typeof entry !== 'string') continue
    const dir = expandHome(entry)
    if (dir && isAbsolute(dir) && !roots.includes(dir)) roots.push(dir)
    if (roots.length >= 20) break
  }
  return roots
}

function expandHome(value) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (trimmed === '~') return homedir()
  if (trimmed.startsWith('~/') || trimmed.startsWith('~\\')) return join(homedir(), trimmed.slice(2))
  return trimmed
}

function scannableRoot(dir) {
  if (typeof dir !== 'string' || !isAbsolute(dir)) return false
  if (dir.includes('.asar')) return false
  const resolved = resolve(dir)
  return resolved !== '/' && resolved !== homedir()
}

function isInside(root, target) {
  const rel = relative(root, target)
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`
}

function quoteCmdArg(value) {
  const text = String(value)
  if (text === '') return '""'
  if (!/[\s"&|<>^()%!]/.test(text)) return text
  return `"${text.replace(/"/g, '\\"')}"`
}

function cmdQuote(value) {
  return `"${String(value).replace(/"/g, '""')}"`
}

async function findOnPath(command) {
  for (const dir of String(process.env.PATH || '').split(delimiter)) {
    if (!dir) continue
    const candidate = join(dir, command)
    if (await exists(candidate)) return candidate
  }
  return null
}

function launchDetached(command, args) {
  return new Promise((resolveLaunch, rejectLaunch) => {
    let child
    try {
      child = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: false })
    } catch (error) {
      rejectLaunch(error)
      return
    }
    child.once('error', rejectLaunch)
    child.once('spawn', () => {
      child.unref()
      resolveLaunch()
    })
  })
}

async function exists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function latestMtime(paths) {
  let latest = 0
  for (const path of paths) {
    try {
      const info = await stat(path)
      if (info.mtimeMs > latest) latest = info.mtimeMs
    } catch {
      // Ignore a missing optional file.
    }
  }
  return latest
}

function extractPatchName(text) {
  const match = /\bname\s*:\s*['"]?([^'"\s#]+)['"]?/.exec(String(text || ''))
  return match ? match[1] : null
}

function pickText(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') return value.trim()
  }
  return ''
}

function authorText(author) {
  if (typeof author === 'string') return author
  if (isPlainObject(author)) {
    const name = typeof author.name === 'string' ? author.name : ''
    const email = typeof author.email === 'string' ? author.email : ''
    if (name && email) return `${name} <${email}>`
    return name || email
  }
  return ''
}

function detectIndent(raw) {
  const match = /\n([ \t]+)"/.exec(String(raw || ''))
  if (!match) return 2
  return match[1].includes('\t') ? '\t' : match[1].length
}

function cleanScriptName(value) {
  const clean = typeof value === 'string' ? value.trim() : ''
  if (clean === '') return ''
  if (!SCRIPT_RE.test(clean)) throw httpError(400, '构建脚本名不合法（只允许字母、数字与 : _ . -）。')
  return clean
}

function stripTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '')
}

function normalizeCheckSummary(value) {
  if (!isPlainObject(value)) return null
  const result = {}
  for (const key of ['pass', 'warn', 'fail', 'skip', 'total']) {
    const number = Number(value[key])
    if (!Number.isFinite(number) || number < 0) return null
    result[key] = Math.trunc(number)
  }
  return result
}

function validAccessToken(value) {
  return typeof value === 'string' && /^[A-Za-z0-9._~+/=-]{20,512}$/.test(value.trim())
}

function isTokenShape(value) {
  return value && typeof value === 'object' && typeof value.id === 'string' && value.id !== '' && typeof value.name === 'string' && value.name !== '' && typeof value.value === 'string' && validAccessToken(value.value)
}

function isValidVersion(value) {
  return typeof value === 'string' && VERSION_RE.test(value)
}

function compareVersions(left, right) {
  const parse = (value) => {
    const [core, pre] = String(value || '').split('+')[0].split('-')
    const numbers = core.split('.').map((part) => Number.parseInt(part, 10) || 0)
    return { numbers, pre: pre || '' }
  }
  const a = parse(left)
  const b = parse(right)
  for (let index = 0; index < 3; index += 1) {
    const delta = (a.numbers[index] || 0) - (b.numbers[index] || 0)
    if (delta !== 0) return delta > 0 ? 1 : -1
  }
  if (a.pre === b.pre) return 0
  if (a.pre === '') return 1
  if (b.pre === '') return -1
  return a.pre.localeCompare(b.pre)
}

function pickLatestVersion(versions) {
  let latest = null
  for (const version of versions) {
    if (!isValidVersion(version)) continue
    if (latest === null || compareVersions(version, latest) > 0) latest = version
  }
  return latest
}

function filesCoverOne(filesList, rel) {
  const target = String(rel || '').replace(/^\.\//, '')
  if (!target) return true
  for (const pattern of filesList) {
    const clean = String(pattern || '').replace(/^\.\//, '')
    if (clean === target) return true
    if (!clean.includes('*')) continue
    if (globToRegExp(clean).test(target)) return true
  }
  return false
}

function globToRegExp(pattern) {
  const escaped = String(pattern).replace(/[.+^${}()|[\]\\]/g, '\\$&')
  const body = escaped.replace(/\*/g, '.*').replace(/\?/g, '.')
  return new RegExp(`^${body}$`)
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`
  return `${(value / (1024 * 1024)).toFixed(1)} MiB`
}

function truncate(text, limit) {
  const value = String(text || '')
  if (value.length <= limit) return value
  return `…${value.slice(-limit)}`
}

function firstLine(text) {
  const value = String(text || '').trim()
  if (value === '') return ''
  const line = value.split(/\r?\n/)[0]
  return line.length > 300 ? `${line.slice(0, 300)}…` : line
}

function clampInt(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(number)))
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function localDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
