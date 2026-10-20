// A tiny POSIX-ish shell for the browser terminal: quoting, $VARS, ~, globs,
// pipes (|), redirection (> >>), and chaining (; && ||).
// It never evaluates JavaScript and never touches the network.

import { createFs, displayPath, HOME, lookup, normalize, parentOf, type DirNode, type Node } from './fs'

export type Tone = 'ink' | 'muted' | 'accent' | 'info' | 'warn' | 'danger' | 'bold'
export type Span = { t: string; c?: Tone; href?: string }
export type Line = string | Span[]

export const lineText = (l: Line) => (typeof l === 'string' ? l : l.map((s) => s.t).join(''))

export type Ctx = {
  args: string[]
  name: string
  stdin: string[] | null
  out: (line?: Line) => void
  err: (line: Line) => void
  sh: Shell
  signal: AbortSignal
  /** false when output is piped or redirected (like isatty) */
  tty: boolean
}
export type Command = {
  run: (ctx: Ctx) => number | void | Promise<number | void>
  help: string
  usage?: string
  hidden?: boolean
}

/* Host hooks so commands can affect the page (theme, navigation, window). */
export type Host = {
  clear: () => void
  setTheme: (t: 'light' | 'dark' | 'toggle') => void
  navigate: (target: string) => boolean
  maximize: (on?: boolean) => void
  close: () => void
}

export class Shell {
  fs: DirNode = createFs()
  cwd = HOME
  prevCwd = HOME
  history: string[] = []
  lastStatus = 0
  readonly startedAt = Date.now()
  env: Record<string, string> = {
    USER: 'devendra',
    LOGNAME: 'devendra',
    HOME,
    SHELL: '/bin/dhsh',
    TERM: 'xterm-256color',
    LANG: 'en_US.UTF-8',
    PATH: '/usr/local/bin:/usr/bin:/bin',
    EDITOR: 'vim',
    HOSTNAME: 'portfolio',
    HIRE_ME: 'true',
  }
  aliases: Record<string, string> = { ll: 'ls -la', la: 'ls -a', l: 'ls', cls: 'clear' }

  constructor(
    public commands: Record<string, Command>,
    public host: Host,
  ) {}

  get prompt() {
    return { user: `${this.env.USER}@${this.env.HOSTNAME}`, path: displayPath(this.cwd) }
  }

  /* ---------- filesystem helpers used by commands ---------- */

  resolve(path: string) {
    return normalize(path, this.cwd)
  }

  /** Returns the node, or an error message in the style of coreutils. */
  stat(path: string, cmd: string): { node: Node; abs: string } | { error: string } {
    const abs = this.resolve(path)
    let node: Node = this.fs
    for (const seg of abs.split('/').filter(Boolean)) {
      if (node.type !== 'dir') return { error: `${cmd}: ${path}: Not a directory` }
      if (node.denied) return { error: `${cmd}: ${path}: Permission denied` }
      const next: Node | undefined = node.children[seg]
      if (!next) return { error: `${cmd}: ${path}: No such file or directory` }
      node = next
    }
    if (node.denied) return { error: `${cmd}: ${path}: Permission denied` }
    return { node, abs }
  }

  writeFile(path: string, content: string, append: boolean): string | null {
    const abs = this.resolve(path)
    if (abs === '/dev/null') return null
    const { parent, name } = parentOf(abs)
    const p = lookup(this.fs, parent)
    if (!p || p.type !== 'dir') return `dhsh: ${path}: No such file or directory`
    if (p.denied || !(abs.startsWith(HOME) || abs.startsWith('/tmp'))) return `dhsh: ${path}: Permission denied`
    const existing = p.children[name]
    if (existing?.type === 'dir') return `dhsh: ${path}: Is a directory`
    const prev = existing?.type === 'file' ? existing.content : ''
    p.children[name] = { type: 'file', content: append && prev ? `${prev}\n${content}` : content }
    return null
  }

  /* ---------- parsing ---------- */

  private expandVars(s: string) {
    return s.replace(/\$(\?|[A-Za-z_][A-Za-z0-9_]*|\{[A-Za-z_][A-Za-z0-9_]*\})/g, (_, name: string) => {
      if (name === '?') return String(this.lastStatus)
      const key = name.replace(/[{}]/g, '')
      return this.env[key] ?? ''
    })
  }

  private glob(word: string): string[] {
    const slash = word.lastIndexOf('/')
    const dirPart = slash >= 0 ? word.slice(0, slash + 1) : ''
    const pattern = word.slice(slash + 1)
    const node = lookup(this.fs, this.resolve(dirPart || '.'))
    if (!node || node.type !== 'dir' || node.denied) return [word]
    const re = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$')
    const hits = Object.keys(node.children)
      .filter((n) => re.test(n) && (pattern.startsWith('.') || !n.startsWith('.')))
      .sort()
      .map((n) => dirPart + n)
    return hits.length ? hits : [word]
  }

  /** Splits a command line into words and operators, honouring quotes. */
  tokenize(input: string): { words: { v: string; glob: boolean }[]; ops: (string | null)[] } | { error: string } {
    const tokens: ({ type: 'word'; v: string; glob: boolean } | { type: 'op'; v: string })[] = []
    let cur = ''
    let inWord = false
    let globbable = false
    let quote: '"' | "'" | null = null

    const push = () => {
      if (inWord) tokens.push({ type: 'word', v: cur, glob: globbable })
      cur = ''
      inWord = false
      globbable = false
    }

    for (let i = 0; i < input.length; i++) {
      const ch = input[i]
      if (quote) {
        if (ch === quote) quote = null
        else if (ch === '\\' && quote === '"' && i + 1 < input.length) cur += input[++i]
        else if (ch === '$' && quote === '"') {
          const m = input.slice(i).match(/^\$(\?|[A-Za-z_][A-Za-z0-9_]*|\{[A-Za-z_][A-Za-z0-9_]*\})/)
          if (m) {
            cur += this.expandVars(m[0])
            i += m[0].length - 1
          } else cur += ch
        } else cur += ch
        continue
      }
      if (ch === '"' || ch === "'") {
        quote = ch
        inWord = true
        continue
      }
      if (ch === '\\' && i + 1 < input.length) {
        cur += input[++i]
        inWord = true
        continue
      }
      if (/\s/.test(ch)) {
        push()
        continue
      }
      const two = input.slice(i, i + 2)
      if (two === '&&' || two === '||' || two === '>>') {
        push()
        tokens.push({ type: 'op', v: two })
        i++
        continue
      }
      if (ch === '|' || ch === ';' || ch === '>') {
        push()
        tokens.push({ type: 'op', v: ch })
        continue
      }
      if (ch === '$') {
        const m = input.slice(i).match(/^\$(\?|[A-Za-z_][A-Za-z0-9_]*|\{[A-Za-z_][A-Za-z0-9_]*\})/)
        if (m) {
          cur += this.expandVars(m[0])
          i += m[0].length - 1
          inWord = true
          continue
        }
      }
      if (ch === '~' && !inWord && (i + 1 === input.length || /[\s/]/.test(input[i + 1]))) {
        cur += HOME
        inWord = true
        continue
      }
      if (ch === '*' || ch === '?') globbable = true
      cur += ch
      inWord = true
    }
    if (quote) return { error: `dhsh: unexpected EOF while looking for matching \`${quote}'` }
    push()

    // Flatten into words with an operator marker after each position.
    const words: { v: string; glob: boolean }[] = []
    const ops: (string | null)[] = []
    for (const t of tokens) {
      if (t.type === 'word') {
        words.push({ v: t.v, glob: t.glob })
        ops.push(null)
      } else {
        words.push({ v: '', glob: false })
        ops.push(t.v)
      }
    }
    return { words, ops }
  }

  /* ---------- execution ---------- */

  async execute(raw: string, print: (l: Line) => void, signal: AbortSignal) {
    let input = raw.trim()
    if (!input) return
    if (input.includes('!!')) {
      const last = this.history[this.history.length - 1]
      if (!last) {
        print([{ t: 'dhsh: !!: event not found', c: 'danger' }])
        return
      }
      input = input.replaceAll('!!', last)
      print([{ t: input, c: 'muted' }])
    }
    this.history.push(input)

    const steps = splitSteps(input)
    if ('error' in steps) {
      print([{ t: steps.error, c: 'danger' }])
      this.lastStatus = 2
      return
    }

    for (const step of steps) {
      if (signal.aborted) break
      if (step.join === '&&' && this.lastStatus !== 0) continue
      if (step.join === '||' && this.lastStatus === 0) continue
      // Tokenize per step so $VARS and globs see the effects of earlier steps
      // (e.g. `export X=1 && echo $X`, `mkdir d && ls d*`).
      const pipeline = this.parsePipeline(step.text)
      if ('error' in pipeline) {
        print([{ t: pipeline.error, c: 'danger' }])
        this.lastStatus = 2
        return
      }
      this.lastStatus = await this.runPipeline(pipeline, print, signal)
    }
  }

  private parsePipeline(text: string): PipelineCmd[] | { error: string } {
    const tk = this.tokenize(text)
    if ('error' in tk) return tk
    const pipeline: PipelineCmd[] = []
    let words: { v: string; glob: boolean }[] = []
    let redirect: PipelineCmd['redirect']
    let pendingRedirect: boolean | null = null

    const endCmd = () => {
      if (!words.length && !redirect) return
      const name = words[0]?.v
      const noGlob = name !== undefined && NO_GLOB.has(name)
      const argv = words.flatMap((w) => (w.glob && !noGlob ? this.glob(w.v) : [w.v]))
      pipeline.push({ argv, redirect })
      words = []
      redirect = undefined
    }

    for (let i = 0; i < tk.words.length; i++) {
      const op = tk.ops[i]
      if (op === null) {
        const w = tk.words[i]
        if (pendingRedirect !== null) {
          redirect = { file: w.v, append: pendingRedirect }
          pendingRedirect = null
        } else words.push(w)
        continue
      }
      if (pendingRedirect !== null) return { error: `dhsh: syntax error near unexpected token \`${op}'` }
      if (op === '>' || op === '>>') pendingRedirect = op === '>>'
      else if (op === '|') {
        if (!words.length) return { error: "dhsh: syntax error near unexpected token `|'" }
        endCmd()
      }
    }
    if (pendingRedirect !== null) return { error: "dhsh: syntax error near unexpected token `newline'" }
    endCmd()
    return pipeline
  }

  private expandAlias(argv: string[]): string[] {
    const a = this.aliases[argv[0]]
    if (!a) return argv
    return [...a.split(' '), ...argv.slice(1)]
  }

  private async runPipeline(
    pipeline: PipelineCmd[],
    print: (l: Line) => void,
    signal: AbortSignal,
  ): Promise<number> {
    let stdin: string[] | null = null
    let status = 0
    for (let i = 0; i < pipeline.length; i++) {
      const { redirect } = pipeline[i]
      const argv = this.expandAlias(pipeline[i].argv)
      const isLast = i === pipeline.length - 1
      const captured: Line[] = []
      const capture = !isLast || !!redirect
      // Both return void so `=> out(...)` one-liners never leak a value as the exit status.
      const out = (l: Line = ''): void => {
        if (capture) captured.push(l)
        else print(l)
      }
      const err = (l: Line): void => {
        print(typeof l === 'string' ? [{ t: l, c: 'danger' }] : l)
      }

      if (!argv.length) {
        status = 0
      } else {
        const [name, ...args] = argv
        // VAR=value assignment
        const assign = name.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
        if (assign && !args.length) {
          this.env[assign[1]] = assign[2]
          status = 0
        } else {
          const command = this.commands[name]
          if (!command) {
            err(`${name}: command not found`)
            const hint = this.suggest(name)
            if (hint) print([{ t: `did you mean `, c: 'muted' }, { t: hint, c: 'accent' }, { t: '?  (try `help`)', c: 'muted' }])
            status = 127
          } else {
            try {
              status = (await command.run({ name, args, stdin, out, err, sh: this, signal, tty: !capture })) ?? 0
            } catch (e) {
              err(`${name}: ${(e as Error).message}`)
              status = 1
            }
          }
        }
      }

      if (redirect) {
        const e = this.writeFile(redirect.file, captured.map(lineText).join('\n'), redirect.append)
        if (e) {
          print([{ t: e, c: 'danger' }])
          status = 1
        }
        stdin = []
      } else {
        stdin = captured.map(lineText)
      }
      if (signal.aborted) return 130
    }
    return status
  }

  suggest(name: string): string | null {
    let best: string | null = null
    let bestD = 3
    for (const c of Object.keys(this.commands)) {
      if (this.commands[c].hidden) continue
      const d = levenshtein(name, c)
      if (d < bestD) {
        bestD = d
        best = c
      }
    }
    return best
  }

  /* ---------- tab completion ---------- */

  complete(input: string): { value: string; options: string[] } {
    const m = input.match(/^(.*?)([^\s|;&>]*)$/)!
    const before = m[1]
    const word = m[2]
    const isFirst = !before.trim() || /[|;&]\s*$/.test(before)

    if (isFirst && !word.includes('/')) {
      const opts = [...Object.keys(this.commands).filter((c) => !this.commands[c].hidden), ...Object.keys(this.aliases)]
        .filter((c) => c.startsWith(word))
        .sort()
      return finish(before, word, opts, (o) => o + ' ')
    }

    const slash = word.lastIndexOf('/')
    const dirPart = slash >= 0 ? word.slice(0, slash + 1) : ''
    const prefix = word.slice(slash + 1)
    const node = lookup(this.fs, this.resolve(dirPart || '.'))
    if (!node || node.type !== 'dir' || node.denied) return { value: input, options: [] }
    const names = Object.keys(node.children)
      .filter((n) => n.startsWith(prefix) && (prefix.startsWith('.') || !n.startsWith('.')))
      .sort()
    return finish(before + dirPart, prefix, names, (n) => (node.children[n].type === 'dir' ? n + '/' : n + ' '))
  }
}

type PipelineCmd = { argv: string[]; redirect?: { file: string; append: boolean } }

// Arithmetic commands get `*` literally instead of a filename glob.
const NO_GLOB = new Set(['calc', 'expr', 'bc'])

/** Splits a command line on top-level ; && || (outside quotes). */
function splitSteps(input: string): { join: string; text: string }[] | { error: string } {
  const steps: { join: string; text: string }[] = []
  let join = ';'
  let cur = ''
  let quote: string | null = null
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (quote) {
      if (ch === quote) quote = null
      else if (ch === '\\' && quote === '"') {
        cur += ch + (input[++i] ?? '')
        continue
      }
      cur += ch
      continue
    }
    if (ch === '"' || ch === "'") quote = ch
    else if (ch === '\\') {
      cur += ch + (input[++i] ?? '')
      continue
    } else if (ch === ';' || input.startsWith('&&', i) || input.startsWith('||', i)) {
      if (!cur.trim()) return { error: `dhsh: syntax error near unexpected token \`${ch === ';' ? ';' : input.slice(i, i + 2)}'` }
      steps.push({ join, text: cur })
      join = ch === ';' ? ';' : input.slice(i, i + 2)
      if (ch !== ';') i++
      cur = ''
      continue
    }
    cur += ch
  }
  if (quote) return { error: `dhsh: unexpected EOF while looking for matching \`${quote}'` }
  if (cur.trim()) steps.push({ join, text: cur })
  else if (join !== ';') return { error: 'dhsh: syntax error: unexpected end of file' }
  return steps
}

function finish(before: string, word: string, opts: string[], suffix: (o: string) => string) {
  if (opts.length === 0) return { value: before + word, options: [] }
  if (opts.length === 1) return { value: before + suffix(opts[0]), options: [] }
  let common = opts[0]
  for (const o of opts) while (!o.startsWith(common)) common = common.slice(0, -1)
  return { value: before + (common.length > word.length ? common : word), options: opts }
}

function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return dp[a.length][b.length]
}

