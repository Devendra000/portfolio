// Command implementations for the browser terminal. All output is synthetic.
// Network-looking commands (ping, curl, ssh, …) only ever "reach" this site's
// own fake host and never make real requests.

import { caseStudies, links, sections, site } from '@/lib/site-config'
import { displayPath, HOME, lookup, parentOf, type DirNode, type Node } from './fs'
import type { Command, Ctx, Span, Tone } from './shell'

const s = (t: string, c?: Tone): Span => ({ t, c })
const BUILD = new Date(process.env.NEXT_PUBLIC_BUILD_TIME ?? Date.now())
const LOCAL_HOSTS = ['localhost', '127.0.0.1', 'portfolio', 'devendra.hamal', new URL(site.url).hostname]

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) return resolve()
    const t = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => (clearTimeout(t), resolve()), { once: true })
  })
}

/** Splits `-la --force file` into a flag set and positional args. */
function parseFlags(args: string[], withValue: string[] = []) {
  const flags = new Set<string>()
  const values: Record<string, string> = {}
  const rest: string[] = []
  let done = false
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (done || a === '-' || !a.startsWith('-')) rest.push(a)
    else if (a === '--') done = true
    else if (a.startsWith('--')) flags.add(a)
    else if (/^-\d+$/.test(a)) values.n = a.slice(1)
    else
      for (const ch of a.slice(1)) {
        if (withValue.includes(ch)) {
          values[ch] = args[++i] ?? ''
          break
        }
        flags.add(ch)
      }
  }
  return { flags, values, rest }
}

function hostOf(arg: string) {
  try {
    return new URL(/^[a-z]+:\/\//i.test(arg) ? arg : `http://${arg}`).hostname
  } catch {
    return arg
  }
}

function readInput(ctx: Ctx, files: string[]): string[] | null {
  if (!files.length) return ctx.stdin ?? []
  const lines: string[] = []
  for (const f of files) {
    const r = ctx.sh.stat(f, ctx.name)
    if ('error' in r) {
      ctx.err(r.error)
      return null
    }
    if (r.node.type === 'dir') {
      ctx.err(`${ctx.name}: ${f}: Is a directory`)
      return null
    }
    lines.push(...r.node.content.split('\n'))
  }
  return lines
}

function fmtDate(d: Date) {
  const mon = d.toLocaleString('en-US', { month: 'short' })
  return `${mon} ${String(d.getDate()).padStart(2)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function fmtDuration(ms: number) {
  const m = Math.floor(ms / 60000)
  const h = Math.floor(m / 60)
  return h ? `${h}:${String(m % 60).padStart(2, '0')}` : `${m} min`
}

const nameSpan = (name: string, node: Node): Span =>
  node.type === 'dir' ? s(name, 'info') : name.endsWith('.md') || name.endsWith('.txt') ? s(name) : s(name, 'ink')

/* ---------- safe arithmetic (no eval) ---------- */

function calc(expr: string): number {
  const toks = expr.match(/\d+(\.\d+)?|[-+*/%^()]/g) ?? []
  if (toks.join('') !== expr.replace(/\s+/g, '')) throw new Error('syntax error')
  let i = 0
  const peek = () => toks[i]
  const take = () => toks[i++]
  const primary = (): number => {
    const t = take()
    if (t === '(') {
      const v = add()
      if (take() !== ')') throw new Error('missing )')
      return v
    }
    if (t === '-') return -primary()
    if (t === '+') return primary()
    if (t === undefined || isNaN(Number(t))) throw new Error('syntax error')
    return Number(t)
  }
  const pow = (): number => {
    const b = primary()
    return peek() === '^' ? (take(), b ** pow()) : b
  }
  const mul = (): number => {
    let v = pow()
    while (['*', '/', '%'].includes(peek())) {
      const op = take()
      const r = pow()
      if ((op === '/' || op === '%') && r === 0) throw new Error('division by zero')
      v = op === '*' ? v * r : op === '/' ? v / r : v % r
    }
    return v
  }
  const add = (): number => {
    let v = mul()
    while (peek() === '+' || peek() === '-') v = take() === '+' ? v + mul() : v - mul()
    return v
  }
  const v = add()
  if (i !== toks.length) throw new Error('syntax error')
  return v
}

/* ---------- data for fake system commands ---------- */

const PROCS = [
  { pid: 1, user: 'root', cpu: 0.0, mem: 0.1, cmd: 'init' },
  { pid: 42, user: 'devendra', cpu: 0.3, mem: 1.2, cmd: 'dhsh' },
  { pid: 128, user: 'root', cpu: 1.1, mem: 4.8, cmd: 'next-server' },
  { pid: 256, user: 'devendra', cpu: 0.7, mem: 0.9, cmd: 'request-flow-animator' },
  { pid: 404, user: 'devendra', cpu: 0.0, mem: 0.0, cmd: 'page-not-found' },
  { pid: 777, user: 'devendra', cpu: 12.5, mem: 2.1, cmd: 'coffee-daemon' },
  { pid: 1337, user: 'devendra', cpu: 3.4, mem: 1.7, cmd: 'side-project --unfinished' },
]

const FORTUNES = [
  'There are only two hard things in Computer Science: cache invalidation and naming things. — Phil Karlton',
  'Premature optimization is the root of all evil. — Donald Knuth',
  'Talk is cheap. Show me the code. — Linus Torvalds',
  'Simplicity is prerequisite for reliability. — Edsger W. Dijkstra',
  'Weeks of coding can save you hours of planning.',
  'It works on my machine. (That’s why I ship containers.)',
  'The best error message is the one that never shows up.',
  'Deploy on Friday? Only with good monitoring.',
]

const GIT_LOG = [
  { sha: '38def37', date: 'Sat Aug 8 21:58:31 2026 +0545', msg: 'feat: implement music player with dynamic file loading and responsive layout updates' },
  { sha: '689c70c', date: 'Sat Aug 8 21:28:55 2026 +0545', msg: 'new portfolio' },
]

/* ---------- command table ---------- */

export const commands: Record<string, Command> = {}
const def = (names: string | string[], cmd: Command) => {
  for (const n of Array.isArray(names) ? names : [names]) commands[n] = cmd
}

const HELP_GROUPS: [string, string[]][] = [
  ['portfolio', ['about', 'projects', 'skills', 'contact', 'hire', 'social', 'resume', 'open', 'theme', 'fullscreen']],
  ['files', ['ls', 'cd', 'pwd', 'cat', 'less', 'head', 'tail', 'tree', 'find', 'file', 'touch', 'mkdir', 'rm', 'rmdir', 'cp', 'mv', 'chmod']],
  ['text', ['echo', 'grep', 'wc', 'sort', 'uniq', 'rev', 'expr', 'calc']],
  ['system', ['whoami', 'id', 'hostname', 'uname', 'date', 'cal', 'uptime', 'ps', 'top', 'kill', 'df', 'free', 'env', 'export', 'alias', 'history', 'which', 'man', 'sudo', 'clear', 'exit']],
  ['network', ['ping', 'curl', 'wget', 'ssh', 'ifconfig', 'ip', 'netstat', 'git']],
  ['fun', ['neofetch', 'fortune', 'cowsay', 'sl', 'yes', 'sleep', 'vim', 'pacman']],
]

def('help', {
  help: 'list available commands',
  run: ({ out }) => {
    out([s('DevendraOS dhsh', 'bold'), s(' — a sandboxed shell that runs entirely in your browser.', 'muted')])
    out([s('Supports pipes (|), redirects (> >>), chaining (; && ||), $VARS, globs, ↑/↓ history, Tab completion, Ctrl+C, Ctrl+L.', 'muted')])
    out()
    for (const [group, names] of HELP_GROUPS) {
      out([s(group.padEnd(10), 'accent'), s(names.join('  '))])
    }
    out()
    out([s('Try: ', 'muted'), s('cat about.txt', 'ink'), s(' · ', 'muted'), s('ls projects | grep chat', 'ink'), s(' · ', 'muted'), s('man grep', 'ink'), s(' · ', 'muted'), s('neofetch', 'ink')])
  },
})

/* ---------- portfolio ---------- */

def('about', { help: 'who I am', run: (ctx) => commands.cat.run({ ...ctx, name: 'cat', args: ['~/about.txt'] }) })
def('skills', { help: 'my tech stack', run: ({ out }) => site.stack.forEach((t) => out([s('▸ ', 'accent'), s(t)])) })
def('projects', {
  help: 'list case studies',
  run: ({ out }) => {
    for (const c of caseStudies) out([s(c.slug.padEnd(17), 'info'), s(c.status.padEnd(13), c.status === 'live' ? 'accent' : 'warn'), s(c.summary, 'muted')])
    out()
    out([s('Read one: ', 'muted'), s('cat projects/chatmandu.md', 'ink'), s('  or  ', 'muted'), s('open chatmandu', 'ink')])
  },
})
def(['contact', 'hire'], {
  help: 'how to reach me',
  run: ({ out, sh, name }) => {
    out([s('email     ', 'muted'), { t: site.email, c: 'accent', href: links.email }])
    out([s('github    ', 'muted'), { t: links.github, c: 'info', href: links.github }])
    out([s('linkedin  ', 'muted'), { t: links.linkedin, c: 'info', href: links.linkedin }])
    if (name === 'hire') {
      out()
      out([s('Opening the contact form…', 'muted')])
      setTimeout(() => sh.host.navigate('contact'), 600)
    }
  },
})
def('social', {
  help: 'social links',
  run: ({ out }) => {
    out([s('github    ', 'muted'), { t: links.github, c: 'info', href: links.github }])
    out([s('linkedin  ', 'muted'), { t: links.linkedin, c: 'info', href: links.linkedin }])
  },
})
def('resume', {
  help: 'get my resume',
  run: ({ out }) => {
    out('My resume is available on request, so I can send you the most current version.')
    out([s('Email ', 'muted'), { t: site.email, c: 'accent', href: `${links.email}?subject=Resume%20request` }])
  },
})
def(['open', 'goto', 'xdg-open'], {
  help: 'jump to a section or case study',
  usage: `open <${[...sections.map((x) => x.id), ...caseStudies.map((c) => c.slug)].join('|')}>`,
  run: ({ args, out, err, sh }) => {
    const target = args[0]?.replace(/^#/, '')
    if (!target) {
      out(`usage: ${commands.open.usage}`)
      return 1
    }
    if (!sh.host.navigate(target)) {
      err(`open: ${target}: no such section or case study`)
      return 1
    }
    out([s(`→ ${target}`, 'muted')])
  },
})
def('theme', {
  help: 'switch light / dark mode',
  usage: 'theme [light|dark]',
  run: ({ args, sh, out }) => {
    const t = args[0] === 'light' || args[0] === 'dark' ? args[0] : 'toggle'
    sh.host.setTheme(t)
    out([s(`theme: ${t === 'toggle' ? 'toggled' : t}`, 'muted')])
  },
})
def(['fullscreen', 'maximize'], { help: 'maximize the terminal (Esc to restore)', run: ({ sh }) => sh.host.maximize(true) })

/* ---------- files ---------- */

def(['ls', 'dir'], {
  help: 'list directory contents',
  usage: 'ls [-la1d] [path...]',
  run: (ctx) => {
    const { flags, rest } = parseFlags(ctx.args)
    const paths = rest.length ? rest : ['.']
    let status = 0
    paths.forEach((p, idx) => {
      const r = ctx.sh.stat(p, 'ls')
      if ('error' in r) {
        ctx.err(r.error.replace(/^ls: (.*): /, "ls: cannot access '$1': "))
        status = 2
        return
      }
      if (paths.length > 1) ctx.out([s(`${p}:`, 'bold')])
      const entries: [string, Node][] =
        r.node.type === 'file' || flags.has('d')
          ? [[p, r.node]]
          : [
              ...(flags.has('a') ? ([['.', r.node], ['..', r.node]] as [string, Node][]) : []),
              ...Object.entries(r.node.children)
                .filter(([n]) => flags.has('a') || !n.startsWith('.'))
                .sort(([a], [b]) => a.localeCompare(b)),
            ]
      if (flags.has('l')) {
        ctx.out(`total ${entries.length * 4}`)
        for (const [n, node] of entries) {
          const isDir = node.type === 'dir'
          const perm = node.denied ? (isDir ? 'drwx------' : '-rw-------') : isDir ? 'drwxr-xr-x' : '-rw-r--r--'
          const owner = node.denied ? 'root    ' : 'devendra'
          const size = isDir ? 4096 : node.binary ? 48213 : node.content.length
          ctx.out([s(`${perm} 1 ${owner} ${owner} ${String(size).padStart(6)} ${fmtDate(BUILD)} `, 'muted'), nameSpan(n, node)])
        }
      } else if (flags.has('1') || !ctx.tty) {
        entries.forEach(([n, node]) => ctx.out([nameSpan(n, node)]))
      } else if (entries.length) {
        ctx.out(entries.flatMap(([n, node], i) => (i ? [s('  '), nameSpan(n, node)] : [nameSpan(n, node)])))
      }
      if (paths.length > 1 && idx < paths.length - 1) ctx.out()
    })
    return status
  },
})

def('cd', {
  help: 'change directory',
  usage: 'cd [dir|-|~]',
  run: ({ args, sh, err, out }) => {
    let target = args[0] ?? HOME
    if (target === '-') {
      target = sh.prevCwd
      out(displayPath(target))
    }
    const r = sh.stat(target, 'cd')
    if ('error' in r) {
      err(r.error.replace(/^cd:/, 'dhsh: cd:'))
      return 1
    }
    if (r.node.type !== 'dir') {
      err(`dhsh: cd: ${target}: Not a directory`)
      return 1
    }
    sh.prevCwd = sh.cwd
    sh.cwd = r.abs
  },
})

def('pwd', { help: 'print working directory', run: ({ out, sh }) => out(sh.cwd) })

def(['cat', 'less', 'more', 'bat'], {
  help: 'print file contents',
  usage: 'cat [-n] [file...]',
  run: (ctx) => {
    const { flags, rest } = parseFlags(ctx.args)
    if (!rest.length) {
      ;(ctx.stdin ?? []).forEach((l) => ctx.out(l))
      return
    }
    let status = 0
    let n = 1
    for (const f of rest) {
      const r = ctx.sh.stat(f, ctx.name)
      if ('error' in r) {
        ctx.err(r.error)
        status = 1
        continue
      }
      if (r.node.type === 'dir') {
        ctx.err(`${ctx.name}: ${f}: Is a directory`)
        status = 1
        continue
      }
      if (r.node.binary) {
        ctx.out([s('%PDF-1.7 ����', 'muted')])
        ctx.out([s(`${ctx.name}: ${f}: binary file. Want the real thing? Run `, 'muted'), s('resume', 'accent')])
        continue
      }
      for (const l of r.node.content.split('\n')) ctx.out(flags.has('n') ? `${String(n++).padStart(6)}  ${l}` : l)
    }
    return status
  },
})

def(['head', 'tail'], {
  help: 'first / last lines of input',
  usage: 'head [-n N] [file...]',
  run: (ctx) => {
    const { values, rest } = parseFlags(ctx.args, ['n'])
    const n = Math.max(0, parseInt(values.n ?? '10', 10) || 10)
    const lines = readInput(ctx, rest)
    if (!lines) return 1
    ;(ctx.name === 'head' ? lines.slice(0, n) : lines.slice(-n)).forEach((l) => ctx.out(l))
  },
})

def('grep', {
  help: 'search text for a pattern',
  usage: 'grep [-invc] pattern [file...]',
  run: (ctx) => {
    const { flags, rest } = parseFlags(ctx.args)
    const [pattern, ...files] = rest
    if (pattern === undefined) {
      ctx.err('usage: grep [-invc] pattern [file...]')
      return 2
    }
    let re: RegExp
    try {
      re = new RegExp(pattern, flags.has('i') ? 'gi' : 'g')
    } catch {
      re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags.has('i') ? 'gi' : 'g')
    }
    const lines = readInput(ctx, files)
    if (!lines) return 2
    let count = 0
    lines.forEach((line, i) => {
      re.lastIndex = 0
      const hit = re.test(line)
      if (hit === flags.has('v')) return
      count++
      if (flags.has('c')) return
      const spans: Span[] = flags.has('n') ? [s(`${i + 1}:`, 'accent')] : []
      if (flags.has('v') || !pattern) spans.push(s(line))
      else {
        let last = 0
        re.lastIndex = 0
        for (const m of line.matchAll(re)) {
          if (!m[0]) break
          spans.push(s(line.slice(last, m.index)), s(m[0], 'danger'))
          last = m.index! + m[0].length
        }
        spans.push(s(line.slice(last)))
      }
      ctx.out(spans)
    })
    if (flags.has('c')) ctx.out(String(count))
    return count ? 0 : 1
  },
})

def('wc', {
  help: 'count lines, words, bytes',
  usage: 'wc [-lwc] [file...]',
  run: (ctx) => {
    const { flags, rest } = parseFlags(ctx.args)
    const lines = readInput(ctx, rest)
    if (!lines) return 1
    const text = lines.join('\n')
    const l = lines.length
    const w = text.split(/\s+/).filter(Boolean).length
    const c = text.length
    const parts = flags.size ? [flags.has('l') && l, flags.has('w') && w, flags.has('c') && c].filter((x) => x !== false) : [l, w, c]
    ctx.out(parts.map((x) => String(x).padStart(7)).join('') + (rest.length ? ` ${rest.join(' ')}` : ''))
  },
})

def('sort', {
  help: 'sort lines',
  usage: 'sort [-r] [file...]',
  run: (ctx) => {
    const { flags, rest } = parseFlags(ctx.args)
    const lines = readInput(ctx, rest)
    if (!lines) return 1
    const sorted = [...lines].sort((a, b) => a.localeCompare(b))
    ;(flags.has('r') ? sorted.reverse() : sorted).forEach((l) => ctx.out(l))
  },
})
def('uniq', {
  help: 'drop repeated adjacent lines',
  run: (ctx) => {
    const lines = readInput(ctx, ctx.args)
    if (!lines) return 1
    lines.filter((l, i) => l !== lines[i - 1]).forEach((l) => ctx.out(l))
  },
})
def('rev', {
  help: 'reverse each line',
  run: (ctx) => {
    const lines = readInput(ctx, ctx.args)
    if (!lines) return 1
    lines.forEach((l) => ctx.out([...l].reverse().join('')))
  },
})

def('echo', {
  help: 'print text',
  usage: 'echo [text...]',
  run: ({ args, out }) => out(args.filter((a, i) => !(i === 0 && (a === '-n' || a === '-e'))).join(' ')),
})

def('touch', {
  help: 'create an empty file',
  run: ({ args, sh, err }) => {
    if (!args.length) return err('touch: missing file operand'), 1
    for (const f of args) {
      const r = sh.stat(f, 'touch')
      if (!('error' in r)) continue
      const e = sh.writeFile(f, '', false)
      if (e) return err(e.replace('dhsh:', 'touch:')), 1
    }
  },
})

def('mkdir', {
  help: 'create a directory',
  usage: 'mkdir [-p] dir...',
  run: ({ args, sh, err }) => {
    const { flags, rest } = parseFlags(args)
    if (!rest.length) return err('mkdir: missing operand'), 1
    for (const d of rest) {
      const abs = sh.resolve(d)
      if (!abs.startsWith(HOME) && !abs.startsWith('/tmp')) return err(`mkdir: cannot create directory '${d}': Permission denied`), 1
      const segs = abs.split('/').filter(Boolean)
      let node: DirNode = sh.fs
      for (let i = 0; i < segs.length; i++) {
        const next: Node | undefined = node.children[segs[i]]
        const isLast = i === segs.length - 1
        if (next?.type === 'file') return err(`mkdir: cannot create directory '${d}': Not a directory`), 1
        if (next && isLast && !flags.has('p')) return err(`mkdir: cannot create directory '${d}': File exists`), 1
        if (!next) {
          if (!isLast && !flags.has('p')) return err(`mkdir: cannot create directory '${d}': No such file or directory`), 1
          node.children[segs[i]] = { type: 'dir', children: {} }
        }
        node = node.children[segs[i]] as DirNode
      }
    }
  },
})

def('rm', {
  help: 'remove files (in this sandbox only)',
  usage: 'rm [-rf] file...',
  run: async ({ args, sh, err, out, signal }) => {
    const { flags, rest } = parseFlags(args)
    const recursive = flags.has('r') || flags.has('R')
    if (!rest.length) return err('rm: missing operand'), 1
    if (rest.some((p) => sh.resolve(p) === '/')) {
      if (!flags.has('--no-preserve-root')) {
        err("rm: it is dangerous to operate recursively on '/'")
        err('rm: use --no-preserve-root to override this failsafe')
        return 1
      }
      for (const d of ['/bin', '/etc', '/home', '/usr', '/var']) {
        out([s(`removed directory '${d}'`, 'muted')])
        await wait(250, signal)
      }
      out([s('Just kidding. This system is immutable, and so is my commitment to backups.', 'accent')])
      return 0
    }
    let status = 0
    for (const p of rest) {
      const r = sh.stat(p, 'rm')
      if ('error' in r) {
        if (!flags.has('f')) err(r.error.replace(/^rm: (.*): /, "rm: cannot remove '$1': ")), (status = 1)
        continue
      }
      if (r.node.type === 'dir' && !recursive) {
        err(`rm: cannot remove '${p}': Is a directory`)
        status = 1
        continue
      }
      if (!r.abs.startsWith(HOME + '/') && !r.abs.startsWith('/tmp/')) {
        err(`rm: cannot remove '${p}': Permission denied`)
        status = 1
        continue
      }
      const { parent, name } = parentOf(r.abs)
      delete (lookup(sh.fs, parent) as DirNode).children[name]
      if (sh.cwd === r.abs || sh.cwd.startsWith(r.abs + '/')) sh.cwd = parent
    }
    return status
  },
})

def('rmdir', {
  help: 'remove an empty directory',
  run: (ctx) => {
    for (const d of ctx.args) {
      const r = ctx.sh.stat(d, 'rmdir')
      if ('error' in r) return ctx.err(r.error), 1
      if (r.node.type !== 'dir') return ctx.err(`rmdir: failed to remove '${d}': Not a directory`), 1
      if (Object.keys(r.node.children).length) return ctx.err(`rmdir: failed to remove '${d}': Directory not empty`), 1
      return commands.rm.run({ ...ctx, name: 'rm', args: ['-r', d] })
    }
  },
})

function copyOrMove(move: boolean): Command['run'] {
  return ({ args, sh, err, name }) => {
    const { flags, rest } = parseFlags(args)
    if (rest.length < 2) return err(`${name}: missing destination file operand`), 1
    const dest = rest.pop()!
    const destStat = sh.stat(dest, name)
    const destIsDir = !('error' in destStat) && destStat.node.type === 'dir'
    for (const src of rest) {
      const r = sh.stat(src, name)
      if ('error' in r) return err(r.error.replace(new RegExp(`^${name}: (.*): `), `${name}: cannot stat '$1': `)), 1
      if (r.node.type === 'dir' && !move && !flags.has('r')) return err(`${name}: -r not specified; omitting directory '${src}'`), 1
      const target = sh.resolve(destIsDir ? `${dest}/${parentOf(r.abs).name}` : dest)
      if (!target.startsWith(HOME + '/') && !target.startsWith('/tmp/')) return err(`${name}: cannot create '${dest}': Permission denied`), 1
      if (move && !r.abs.startsWith(HOME + '/') && !r.abs.startsWith('/tmp/')) return err(`${name}: cannot move '${src}': Permission denied`), 1
      const { parent, name: base } = parentOf(target)
      const p = lookup(sh.fs, parent)
      if (!p || p.type !== 'dir') return err(`${name}: cannot create '${dest}': No such file or directory`), 1
      p.children[base] = structuredClone(r.node)
      if (move) {
        const from = parentOf(r.abs)
        delete (lookup(sh.fs, from.parent) as DirNode).children[from.name]
      }
    }
  }
}
def('cp', { help: 'copy files', usage: 'cp [-r] src... dest', run: copyOrMove(false) })
def('mv', { help: 'move / rename files', usage: 'mv src... dest', run: copyOrMove(true) })

def('chmod', {
  help: 'change file mode',
  run: ({ args, sh, err }) => {
    const files = args.slice(1)
    if (!files.length) return err('chmod: missing operand'), 1
    for (const f of files) {
      const r = sh.stat(f, 'chmod')
      if ('error' in r) return err(r.error.replace(/^chmod: (.*): /, "chmod: cannot access '$1': ")), 1
      if (!r.abs.startsWith(HOME)) return err(`chmod: changing permissions of '${f}': Operation not permitted`), 1
    }
  },
})
def('chown', { help: 'change file owner', run: ({ args, err }) => (err(`chown: changing ownership of '${args.at(-1) ?? ''}': Operation not permitted`), 1) })

def('tree', {
  help: 'show directory tree',
  run: (ctx) => {
    const start = ctx.args[0] ?? '.'
    const r = ctx.sh.stat(start, 'tree')
    if ('error' in r) return ctx.err(r.error), 1
    let dirs = 0
    let files = 0
    const walk = (node: DirNode, prefix: string) => {
      const entries = Object.entries(node.children)
        .filter(([n]) => !n.startsWith('.'))
        .sort(([a], [b]) => a.localeCompare(b))
      entries.forEach(([n, child], i) => {
        const last = i === entries.length - 1
        ctx.out([s(prefix + (last ? '└── ' : '├── '), 'muted'), nameSpan(n, child)])
        if (child.type === 'dir') {
          dirs++
          if (!child.denied) walk(child, prefix + (last ? '    ' : '│   '))
        } else files++
      })
    }
    ctx.out([s(start, 'info')])
    if (r.node.type === 'dir') walk(r.node, '')
    ctx.out()
    ctx.out(`${dirs} directories, ${files} files`)
  },
})

def('find', {
  help: 'search for files',
  usage: 'find [path] [-name pattern] [-type f|d]',
  run: (ctx) => {
    const args = [...ctx.args]
    const start = args[0] && !args[0].startsWith('-') ? args.shift()! : '.'
    let name: RegExp | null = null
    let type: string | null = null
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-name' || args[i] === '-iname')
        name = new RegExp('^' + (args[++i] ?? '*').replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', args[i - 1] === '-iname' ? 'i' : '')
      else if (args[i] === '-type') type = args[++i]
    }
    const r = ctx.sh.stat(start, 'find')
    if ('error' in r) return ctx.err(r.error.replace(/^find: (.*): /, "find: '$1': ")), 1
    const walk = (node: Node, path: string, base: string) => {
      const typeOk = !type || (type === 'd' ? node.type === 'dir' : node.type === 'file')
      if (typeOk && (!name || name.test(base))) ctx.out(path)
      if (node.type === 'dir') {
        if (node.denied) return ctx.err(`find: '${path}': Permission denied`)
        for (const [n, c] of Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b))) walk(c, `${path === '/' ? '' : path}/${n}`, n)
      }
    }
    walk(r.node, start, parentOf(r.abs).name || '/')
  },
})

def('file', {
  help: 'determine file type',
  run: (ctx) => {
    for (const f of ctx.args) {
      const r = ctx.sh.stat(f, 'file')
      if ('error' in r) {
        ctx.out(`${f}: cannot open \`${f}' (No such file or directory)`)
        continue
      }
      const n = r.node
      const kind =
        n.type === 'dir' ? 'directory' : n.binary ? 'PDF document, version 1.7' : f.endsWith('.json') ? 'JSON text data' : f.endsWith('.md') ? 'Markdown text, UTF-8' : n.content ? 'ASCII text' : 'empty'
      ctx.out(`${f}: ${kind}`)
    }
  },
})

/* ---------- system ---------- */

def('whoami', { help: 'print current user', run: ({ out, sh }) => out(sh.env.USER) })
def('id', { help: 'print user identity', run: ({ out }) => out('uid=1000(devendra) gid=1000(devendra) groups=1000(devendra),27(wheel),998(coffee)') })
def('groups', { help: 'print groups', run: ({ out }) => out('devendra wheel coffee') })
def('hostname', { help: 'print host name', run: ({ out, sh }) => out(sh.env.HOSTNAME) })
def('uname', {
  help: 'system information',
  usage: 'uname [-a]',
  run: ({ args, out }) =>
    out(args.includes('-a') ? `DevendraOS portfolio 6.9.0-portfolio #1 SMP PREEMPT_DYNAMIC ${BUILD.toUTCString()} x86_64 GNU/Linux` : args.includes('-r') ? '6.9.0-portfolio' : 'DevendraOS'),
})
def('lsb_release', {
  help: 'distribution information',
  run: ({ out }) => ['Distributor ID:\tDevendraOS', 'Description:\tDevendraOS (Arch-based, portfolio edition)', 'Release:\trolling', 'Codename:\tstays-up'].forEach((l) => out(l)),
})
def('date', { help: 'print the date', run: ({ out }) => out(new Date().toString().replace(/ \(.*\)$/, '')) })
def('cal', {
  help: 'show a calendar',
  run: ({ out }) => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const title = now.toLocaleString('en-US', { month: 'long' }) + ' ' + y
    out(title.padStart(10 + Math.floor(title.length / 2)).padEnd(20))
    out('Su Mo Tu We Th Fr Sa')
    const first = new Date(y, m, 1).getDay()
    const days = new Date(y, m + 1, 0).getDate()
    let row: Span[] = [s('   '.repeat(first))]
    for (let d = 1; d <= days; d++) {
      row.push(s(String(d).padStart(2), d === now.getDate() ? 'accent' : undefined), s(' '))
      if ((first + d) % 7 === 0 || d === days) {
        out(row)
        row = []
      }
    }
  },
})
def('uptime', {
  help: 'how long this session has been up',
  run: ({ out, sh }) => {
    const t = new Date()
    out(` ${t.toTimeString().slice(0, 8)} up ${fmtDuration(Date.now() - sh.startedAt)},  1 user,  load average: 0.04, 0.02, 0.00`)
  },
})
def(['w', 'who'], { help: 'who is logged in', run: ({ out }) => out(`devendra pts/0        ${fmtDate(new Date())} (you)`) })

def(['ps'], {
  help: 'list processes',
  run: ({ out }) => {
    out('    PID USER      %CPU %MEM COMMAND')
    for (const p of PROCS) out(`${String(p.pid).padStart(7)} ${p.user.padEnd(9)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${p.cmd}`)
  },
})
def(['top', 'htop', 'btop'], {
  help: 'process snapshot',
  run: ({ out, sh }) => {
    out(`top - ${new Date().toTimeString().slice(0, 8)} up ${fmtDuration(Date.now() - sh.startedAt)},  1 user,  load average: 0.04, 0.02, 0.00`)
    out(`Tasks: ${PROCS.length} total,   1 running, ${PROCS.length - 1} sleeping,   0 stopped,   0 zombie`)
    out('%Cpu(s):  2.1 us,  0.8 sy,  0.0 ni, 97.1 id,  0.0 wa')
    out('MiB Mem :  16384.0 total,  12288.0 free,   2048.0 used,   2048.0 buff/cache')
    out()
    out([s('    PID USER      %CPU %MEM COMMAND', 'bold')])
    for (const p of [...PROCS].sort((a, b) => b.cpu - a.cpu)) out(`${String(p.pid).padStart(7)} ${p.user.padEnd(9)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${p.cmd}`)
    out([s('(snapshot — interactive mode is not available in this sandbox)', 'muted')])
  },
})
def(['kill', 'killall', 'pkill'], {
  help: 'terminate a process',
  usage: 'kill [-9] pid',
  run: ({ args, err, out, name }) => {
    const target = args.filter((a) => !a.startsWith('-'))[0]
    if (!target) return err(`${name}: usage: ${name} [-s sigspec | -n signum | -sigspec] pid`), 2
    const p = PROCS.find((x) => String(x.pid) === target || x.cmd.startsWith(target))
    if (!p) return err(`${name}: (${target}) - No such process`), 1
    if (p.cmd === 'coffee-daemon') return err(`${name}: (${p.pid}) - Refused: coffee-daemon is critical to system stability`), 1
    if (p.cmd === 'dhsh') return out("You'd be killing the shell you're typing in. Bold, but no."), 1
    if (p.user === 'root') return err(`${name}: (${p.pid}) - Operation not permitted`), 1
    out(`[1]+  Terminated              ${p.cmd}`)
    out([s('(it respawned — supervisors are a wonderful thing)', 'muted')])
  },
})
def(['df'], {
  help: 'disk usage',
  run: ({ out }) => {
    out('Filesystem      Size  Used Avail Use% Mounted on')
    out('/dev/browser    512M   12M  500M   3% /')
    out('tmpfs           128M     0  128M   0% /tmp')
    out('/dev/coffee      ∞     95%   5%  95% /home/devendra/energy')
  },
})
def(['free'], {
  help: 'memory usage',
  run: ({ out }) => {
    out('               total        used        free      shared  buff/cache   available')
    out('Mem:            16Gi       2.0Gi        12Gi       128Mi       2.0Gi        14Gi')
    out('Swap:             0B          0B          0B')
  },
})
def(['env', 'printenv'], {
  help: 'print environment variables',
  run: ({ args, out, sh }) => {
    if (args[0]) return sh.env[args[0]] !== undefined ? out(sh.env[args[0]]) : 1
    Object.entries(sh.env).forEach(([k, v]) => out(`${k}=${v}`))
  },
})
def('export', {
  help: 'set an environment variable',
  usage: 'export NAME=value',
  run: ({ args, sh, out }) => {
    if (!args.length) return Object.entries(sh.env).forEach(([k, v]) => out(`declare -x ${k}="${v}"`))
    for (const a of args) {
      const m = a.match(/^([A-Za-z_][A-Za-z0-9_]*)(?:=(.*))?$/)
      if (m && m[2] !== undefined) sh.env[m[1]] = m[2]
    }
  },
})
def('unset', { help: 'remove a variable', run: ({ args, sh }) => args.forEach((a) => delete sh.env[a]) })
def('alias', {
  help: 'list or define aliases',
  usage: "alias name='command'",
  run: ({ args, sh, out }) => {
    if (!args.length) return Object.entries(sh.aliases).forEach(([k, v]) => out(`alias ${k}='${v}'`))
    for (const a of args) {
      const m = a.match(/^([^=]+)=(.*)$/)
      if (m) sh.aliases[m[1]] = m[2]
      else if (sh.aliases[a]) out(`alias ${a}='${sh.aliases[a]}'`)
    }
  },
})
def('unalias', { help: 'remove an alias', run: ({ args, sh }) => args.forEach((a) => delete sh.aliases[a]) })
def('history', {
  help: 'command history',
  usage: 'history [-c]',
  run: ({ args, sh, out }) => {
    if (args[0] === '-c') return void (sh.history = [])
    sh.history.forEach((h, i) => out([s(String(i + 1).padStart(5) + '  ', 'muted'), s(h)]))
  },
})
def(['which', 'type', 'whereis'], {
  help: 'locate a command',
  run: ({ args, sh, out, err, name }) => {
    let status = 0
    for (const a of args) {
      if (sh.aliases[a]) out(name === 'type' ? `${a} is aliased to \`${sh.aliases[a]}'` : `${a}: aliased to ${sh.aliases[a]}`)
      else if (commands[a]) out(name === 'type' ? `${a} is /usr/bin/${a}` : `/usr/bin/${a}`)
      else {
        err(`${name}: no ${a} in (${sh.env.PATH})`)
        status = 1
      }
    }
    return status
  },
})
def(['man', 'whatis'], {
  help: 'manual for a command',
  usage: 'man <command>',
  run: ({ args, out, err, name }) => {
    if (!args[0]) return out('What manual page do you want?'), out('For example, try `man ls`.'), 1
    const c = commands[args[0]]
    if (!c) return err(`No manual entry for ${args[0]}`), 16
    if (name === 'whatis') return out(`${args[0]} (1) - ${c.help}`)
    out([s('NAME', 'bold')])
    out(`       ${args[0]} - ${c.help}`)
    out()
    out([s('SYNOPSIS', 'bold')])
    out(`       ${c.usage ?? args[0]}`)
    out()
    out([s('NOTES', 'bold')])
    out('       Runs inside a sandboxed, in-browser shell. No real system is affected.')
  },
})
def('sudo', {
  help: 'run as root (not here)',
  run: ({ args, out, err }) => {
    if (!args.length) return err('usage: sudo command'), 1
    out('[sudo] password for devendra: ')
    err('devendra is not in the sudoers file. This incident will be reported.')
    out([s('  ↳ incident report filed: ', 'muted'), { t: '/incident-sudo', c: 'info', href: '/incident-sudo' }])
    return 1
  },
})
def('su', { help: 'switch user', run: ({ err }) => (err('su: Authentication failure'), 1) })
def('passwd', { help: 'change password', run: ({ err }) => (err('passwd: Authentication token manipulation error (this is a portfolio, not a password manager)'), 1) })
def(['clear', 'reset'], { help: 'clear the screen', run: ({ sh }) => sh.host.clear() })
def(['exit', 'logout'], {
  help: 'leave fullscreen / close the terminal',
  run: ({ sh }) => sh.host.close(),
})
def(['shutdown', 'reboot', 'poweroff', 'halt'], {
  help: 'power management',
  run: ({ err, out }) => {
    err('Call to PowerOff failed: Access denied')
    out([s('This site has a 99.98% uptime target. You’re not going to be the 0.02%.', 'muted')])
    return 1
  },
})

/* ---------- package managers & runtimes ---------- */

def(['apt', 'apt-get', 'dnf', 'yum', 'snap', 'brew', 'zypper', 'apk'], {
  help: 'package manager',
  run: ({ err, out, name }) => {
    if (name === 'brew') err('Error: Running Homebrew on DevendraOS? Bold choice. Also: no network in this sandbox.')
    else err(`E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)`), err('E: Unable to acquire the lock, are you root?')
    out([s('hint: this is DevendraOS. We use ', 'muted'), s('pacman', 'accent'), s(' here.', 'muted')])
    return 100
  },
})
def(['pacman', 'yay', 'paru'], {
  help: 'the one true package manager',
  run: ({ args, err, out }) => {
    if (!args.length) return err('error: no operation specified (use -h for help)'), 1
    err('error: you cannot perform this operation unless you are root.')
    out([s('(I use Arch, btw.)', 'muted')])
    return 1
  },
})
def(['npm', 'pnpm', 'yarn', 'pip', 'pip3', 'cargo', 'composer', 'docker', 'kubectl'], {
  help: 'developer tooling',
  run: ({ name, err, out }) => {
    if (name === 'docker' || name === 'kubectl') err(`${name}: Cannot connect to the daemon. Is the docker daemon running? (No — it's a browser tab.)`)
    else err(`${name}: network access is disabled in this sandbox`)
    out([s('I do use it daily on real projects though. See ', 'muted'), s('projects', 'accent')])
    return 1
  },
})
def(['node', 'python', 'python3', 'ruby', 'php', 'irb', 'bash', 'sh', 'zsh'], {
  help: 'language runtimes',
  run: ({ name, err }) => (err(`${name}: interpreters are disabled in this sandbox (no code is ever executed)`), 126),
})

/* ---------- network (all fake, all local) ---------- */

def('ping', {
  help: 'send ICMP echo (simulated)',
  usage: 'ping [-c count] host',
  run: async ({ args, out, err, signal }) => {
    const { values, rest } = parseFlags(args, ['c'])
    const host = rest[0]
    if (!host) return err('ping: usage error: Destination address required'), 1
    if (!LOCAL_HOSTS.includes(hostOf(host))) {
      err(`ping: ${host}: Temporary failure in name resolution`)
      out([s('(sandboxed terminal: no outbound network. Try `ping devendra.hamal`)', 'muted')])
      return 2
    }
    const count = Math.min(50, Math.max(1, parseInt(values.c ?? '4', 10) || 4))
    out(`PING ${host} (127.0.0.1) 56(84) bytes of data.`)
    const times: number[] = []
    const start = Date.now()
    for (let i = 1; i <= count; i++) {
      if (signal.aborted) break
      const t = +(0.03 + Math.random() * 0.05).toFixed(3)
      times.push(t)
      out(`64 bytes from ${host} (127.0.0.1): icmp_seq=${i} ttl=64 time=${t} ms`)
      if (i < count) await wait(1000, signal)
    }
    if (signal.aborted) out('^C')
    out()
    out(`--- ${host} ping statistics ---`)
    out(`${times.length} packets transmitted, ${times.length} received, 0% packet loss, time ${Date.now() - start}ms`)
    if (times.length) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length
      out(`rtt min/avg/max/mdev = ${Math.min(...times).toFixed(3)}/${avg.toFixed(3)}/${Math.max(...times).toFixed(3)}/0.012 ms`)
    }
  },
})

const fakeHeaders = () => [
  'HTTP/2 200',
  'content-type: text/html; charset=utf-8',
  `x-engineer: ${site.name}`,
  'x-role: full-stack · freelance',
  'x-stack: laravel, next.js, nestjs, aws',
  `x-location: ${site.location.toLowerCase()}`,
  'x-available: true',
  'cache-control: public, max-age=0, must-revalidate',
]

def(['curl', 'http', 'wget'], {
  help: 'fetch a URL (simulated, local only)',
  usage: 'curl [-I] devendra.hamal',
  run: async ({ args, out, err, name, sh, signal }) => {
    const { flags, rest } = parseFlags(args, ['o', 'X', 'H', 'd'])
    const url = rest[0]
    if (!url) return err(name === 'wget' ? 'wget: missing URL' : `${name}: try '${name} devendra.hamal'`), 2
    const host = hostOf(url)
    if (!LOCAL_HOSTS.includes(host)) {
      if (name === 'wget') {
        out(`--${new Date().toISOString().slice(0, 19).replace('T', ' ')}--  ${url}`)
        err(`Resolving ${host} (${host})... failed: Temporary failure in name resolution.`)
        err(`wget: unable to resolve host address '${host}'`)
      } else err(`curl: (6) Could not resolve host: ${host}`)
      out([s('(sandboxed terminal: no outbound network. Try `curl devendra.hamal`)', 'muted')])
      return 6
    }
    if (name === 'wget') {
      out(`Resolving ${host}... 127.0.0.1`)
      out(`Connecting to ${host}|127.0.0.1|:443... connected.`)
      out('HTTP request sent, awaiting response... 200 OK')
      await wait(400, signal)
      out("Saving to: 'index.html'")
      out()
      out(`index.html          100%[===================>]   1.2K  --.-KB/s    in 0s`)
      sh.writeFile('index.html', `<!doctype html>\n<title>${site.name}</title>\n<h1>${site.tagline}</h1>`, false)
      return
    }
    if (flags.has('I') || flags.has('i')) {
      fakeHeaders().forEach((h, i) => out(i === 0 ? [s('HTTP/2 ', 'ink'), s('200', 'accent')] : [s(h.split(':')[0], 'info'), s(':' + h.split(':').slice(1).join(':'), 'ink')]))
      if (flags.has('I')) return
      out()
    }
    out(JSON.stringify({ name: site.name, role: site.role, tagline: site.tagline, available: true, contact: site.email }, null, 2))
  },
})
def(['ssh', 'scp', 'sftp', 'telnet', 'nc', 'ftp'], {
  help: 'remote connections (refused)',
  run: ({ args, err, name }) => {
    const target = args.filter((a) => !a.startsWith('-')).pop()
    if (!target) return err(`usage: ${name} [user@]hostname`), 255
    err(`${name}: connect to host ${target.split('@').pop()} port 22: Connection refused`)
    return 255
  },
})
def('nmap', {
  help: 'port scanner',
  run: ({ out }) => {
    out('Starting Nmap 7.95 ( https://nmap.org )')
    out('Nmap scan report for portfolio (127.0.0.1)')
    out('PORT    STATE  SERVICE')
    out('443/tcp open   https   (it’s a website)')
    out('22/tcp  closed ssh')
    out([s('Nothing to exploit here — but if you like poking at systems, we should talk: ', 'muted'), s('hire', 'accent')])
  },
})
def(['ifconfig', 'ip'], {
  help: 'network interfaces',
  run: ({ out }) => {
    out('lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536')
    out('        inet 127.0.0.1  netmask 255.0.0.0')
    out()
    out('sandbox0: flags=4098<BROADCAST,MULTICAST>  mtu 1500')
    out('        (no address — this terminal has no network access)')
  },
})
def(['netstat', 'ss'], {
  help: 'listening sockets',
  run: ({ out }) => {
    out('Proto Local Address           State')
    out('tcp   0.0.0.0:443             LISTEN   (https)')
    out('tcp   127.0.0.1:5432          LISTEN   (postgres — kidding, there is no DB here)')
  },
})

def('git', {
  help: 'version control',
  usage: 'git <status|log|branch|remote|--version>',
  run: ({ args, out, err }) => {
    const sub = args[0]
    if (sub === '--version' || sub === 'version') return out('git version 2.47.0')
    if (sub === 'status')
      return ['On branch main', "Your branch is up to date with 'origin/main'.", '', 'nothing to commit, working tree clean'].forEach((l) => out(l))
    if (sub === 'log') {
      const oneline = args.includes('--oneline')
      for (const c of GIT_LOG) {
        if (oneline) out([s(c.sha, 'warn'), s(' ' + c.msg)])
        else {
          out([s(`commit ${c.sha}`, 'warn')])
          out(`Author: ${site.name}`)
          out(`Date:   ${c.date}`)
          out()
          out(`    ${c.msg}`)
          out()
        }
      }
      return
    }
    if (sub === 'branch') return out([s('* main', 'accent')])
    if (sub === 'remote') return out(args.includes('-v') ? `origin\t${links.github} (fetch)` : 'origin')
    if (sub === 'push' || sub === 'pull' || sub === 'clone' || sub === 'fetch') return err('fatal: unable to access remote: network disabled in this sandbox'), 128
    if (!sub) return out('usage: git <status|log|branch|remote> — a read-only, very small git'), 1
    err(`git: '${sub}' is not a git command. See 'git --help'.`)
    return 1
  },
})

/* ---------- editors ---------- */

def(['vim', 'vi', 'nvim', 'nano', 'emacs', 'code'], {
  help: 'text editors',
  run: ({ name, out }) => {
    if (name === 'emacs') return out('emacs: a great operating system, lacking only a decent editor. (Not installed.)')
    if (name === 'nano') return out('nano: not installed. Use `echo "text" > file.txt` instead.')
    if (name === 'code') return out('code: VS Code is on my real machine. This one runs in a <div>.')
    out([s('~', 'info')])
    out([s('~      ', 'info'), s(`${name.toUpperCase()} - Vi IMproved`, 'bold')])
    out([s('~      ', 'info'), s('Good news: you don’t need to figure out how to exit.', 'muted')])
    out([s(':q!', 'accent')])
  },
})

/* ---------- text & fun ---------- */

def(['expr', 'calc', 'bc'], {
  help: 'evaluate arithmetic',
  usage: 'calc 2 * (3 + 4)',
  run: ({ args, stdin, out, err, name }) => {
    const expr = args.length ? args.join(' ') : (stdin ?? []).join(' ')
    if (!expr.trim()) return err(`usage: ${name} <expression>`), 2
    try {
      const v = calc(expr)
      out(Number.isInteger(v) ? String(v) : String(+v.toFixed(10)))
    } catch (e) {
      err(`${name}: ${(e as Error).message}`)
      return 2
    }
  },
})
def('fortune', { help: 'a random quote', run: ({ out }) => out(FORTUNES[Math.floor(Math.random() * FORTUNES.length)]) })
def('cowsay', {
  help: 'a talking cow',
  run: ({ args, stdin, out }) => {
    const text = (args.length ? args.join(' ') : (stdin ?? []).join(' ')) || 'Moo. Hire Devendra.'
    const words = text.split(' ')
    const rows: string[] = []
    let cur = ''
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > 38) rows.push(cur.trim()), (cur = '')
      cur += ' ' + w
    }
    if (cur.trim()) rows.push(cur.trim())
    const width = Math.max(...rows.map((r) => r.length))
    out(' ' + '_'.repeat(width + 2))
    rows.forEach((r, i) => {
      const [l, rr] = rows.length === 1 ? ['<', '>'] : i === 0 ? ['/', '\\'] : i === rows.length - 1 ? ['\\', '/'] : ['|', '|']
      out(`${l} ${r.padEnd(width)} ${rr}`)
    })
    out(' ' + '-'.repeat(width + 2))
    ;['        \\   ^__^', '         \\  (oo)\\_______', '            (__)\\       )\\/\\', '                ||----w |', '                ||     ||'].forEach((l) => out(l))
  },
})
def('sl', {
  help: 'you meant ls',
  run: async ({ out, signal }) => {
    const train = [
      '      ====        ________                ___________',
      '  _D _|  |_______/        \\__I_I_____===__|_________|',
      '   |(_)---  |   H\\________/ |   |        =|___ ___|',
      '   /     |  |   H  |  |     |   |         ||_| |_||',
      '  |      |  |   H  |__--------------------| [___] |',
      '  | ________|___H__/__|_____/[][]~\\_______|       |',
      '  |/ |   |-----------I_____I [][] []  D   |=======|_',
      '__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__',
      ' |/-=|___|=    ||    ||    ||    |_____/~\\___/',
      '  \\_/      \\O=====O=====O=====O_/      \\_/',
    ]
    for (const l of train) {
      out([s(l, 'muted')])
      await wait(40, signal)
    }
    out([s('choo choo. (you probably meant ', 'muted'), s('ls', 'accent'), s(')', 'muted')])
  },
})
def('yes', {
  help: 'print y forever (Ctrl+C to stop)',
  run: async ({ args, out, signal }) => {
    const word = args.join(' ') || 'y'
    for (let i = 0; i < 500 && !signal.aborted; i++) {
      out(word)
      if (i % 10 === 9) await wait(30, signal)
    }
    if (!signal.aborted) out([s('yes: stopping at 500 lines to spare your browser', 'muted')])
  },
})
def('sleep', {
  help: 'wait N seconds',
  run: async ({ args, err, signal }) => {
    const n = parseFloat(args[0] ?? '')
    if (isNaN(n)) return err('sleep: missing operand'), 1
    await wait(Math.min(n, 60) * 1000, signal)
  },
})
def(['neofetch', 'fastfetch', 'screenfetch'], {
  help: 'system info, with style',
  run: ({ out, sh }) => {
    const art = ['     ____  __  __  ', '    |  _ \\|  ||  | ', '    | | | |  ||  | ', '    | |_| |  __  | ', '    |____/|_|  |_| ', '                   ', '   devendra.hamal  ', '                   ']
    const w = typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown'
    const info: [string, string][] = [
      ['', 'devendra@portfolio'],
      ['', '──────────────────'],
      ['OS', 'DevendraOS (Arch-based) x86_64'],
      ['Host', 'Your browser tab'],
      ['Kernel', '6.9.0-portfolio'],
      ['Uptime', fmtDuration(Date.now() - sh.startedAt)],
      ['Shell', 'dhsh 1.0'],
      ['Resolution', w],
      ['Stack', 'Laravel · Next.js · NestJS · AWS'],
      ['CPU', 'Caffeine-powered (8) @ 4.2GHz'],
      ['Memory', `${site.yearsExperience}+ years of production incidents`],
      ['Status', site.availability],
    ]
    const rows = Math.max(art.length, info.length)
    for (let i = 0; i < rows; i++) {
      const [k, v] = info[i] ?? ['', '']
      out([s(art[i] ?? ' '.repeat(19), 'accent'), ...(k ? [s(k, 'info'), s(': ' + v)] : [s(v, i === 0 ? 'accent' : 'muted')])])
    }
    out([s(' '.repeat(19)), ...(['danger', 'warn', 'accent', 'info', 'muted', 'ink'] as Tone[]).map((c) => s('███', c))])
  },
})

def('true', { help: 'do nothing, successfully', run: () => 0 })
def('false', { help: 'do nothing, unsuccessfully', run: () => 1 })

// Common typos / hidden extras.
def('cd..', { help: '', hidden: true, run: (ctx) => commands.cd.run({ ...ctx, args: ['..'] }) })
def('please', { help: '', hidden: true, run: ({ out }) => out('Since you asked nicely: still no root. But here’s a cookie 🍪') })
def('coffee', { help: '', hidden: true, run: ({ out }) => out('☕  brewing… coffee-daemon (pid 777) is already on it.') })
def('hello', { help: '', hidden: true, run: ({ out }) => out('Hello! Type `help` to look around, or `hire` to say hi properly.') })
