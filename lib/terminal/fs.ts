// In-memory filesystem for the browser terminal.
// Everything here is fake, generated from public site content, and lives only
// in the visitor's tab. Nothing is read from or written to a real machine.

import { caseStudies, links, site } from '@/lib/site-config'

export type FileNode = { type: 'file'; content: string; denied?: boolean; binary?: boolean }
export type DirNode = { type: 'dir'; children: Record<string, Node>; denied?: boolean }
export type Node = FileNode | DirNode

export const HOME = '/home/devendra'

const file = (content: string, extra: Partial<FileNode> = {}): FileNode => ({ type: 'file', content, ...extra })
const dir = (children: Record<string, Node> = {}, extra: Partial<DirNode> = {}): DirNode => ({ type: 'dir', children, ...extra })

function caseStudyMarkdown(c: (typeof caseStudies)[number]) {
  return [
    `# ${c.name}`,
    '',
    c.summary,
    '',
    '## Problem',
    c.problem,
    '',
    '## Role',
    ...c.role.map((r) => `- ${r}`),
    '',
    '## Stack',
    c.stack.join(', '),
    '',
    '## Decisions & trade-offs',
    ...c.decisions.flatMap((d, i) => [`${i + 1}. ${d.decision}`, `   trade-off: ${d.tradeoff}`]),
    '',
    '## Results',
    ...c.results.map((r) => `- ${r.metric} ${r.label}`),
    '',
    "## How I'd rebuild it today",
    c.rebuild,
    ...(c.demo ? ['', `demo: ${c.demo}`] : []),
    '',
    `Full write-up: /work/${c.slug}  (run: open ${c.slug})`,
  ].join('\n')
}

export function createFs(): DirNode {
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME ?? new Date().toISOString()

  return dir({
    bin: dir(),
    etc: dir({
      hostname: file('portfolio'),
      'os-release': file(
        ['NAME="DevendraOS"', 'PRETTY_NAME="DevendraOS (Arch-based, portfolio edition)"', 'ID=devendraos', 'ID_LIKE=arch', 'HOME_URL="' + site.url + '"'].join('\n'),
      ),
      passwd: file(
        ['root:x:0:0:root:/root:/usr/bin/nologin', 'devendra:x:1000:1000:Devendra Hamal:/home/devendra:/bin/dhsh', 'guest:x:1001:1001:You:/tmp:/bin/dhsh'].join('\n'),
      ),
      shadow: file('', { denied: true }),
      motd: file('Welcome to DevendraOS. Type `help` to see what this terminal can do.'),
    }),
    home: dir({
      devendra: dir({
        'about.txt': file(
          [
            `${site.name} — ${site.role}`,
            site.location,
            '',
            site.intro,
            '',
            `Experience: ${site.yearsExperience}+ years`,
            `Currently building: ${site.currentlyBuilding}`,
            `Status: ${site.availability}`,
          ].join('\n'),
        ),
        'contact.txt': file([`email     ${site.email}`, `github    ${links.github}`, `linkedin  ${links.linkedin}`, '', 'Or run: hire'].join('\n')),
        'skills.json': file(JSON.stringify({ stack: site.stack, also: ['Docker', 'CI/CD', 'Linux', 'REST & webhooks', 'queues'] }, null, 2)),
        'resume.pdf': file('', { binary: true }),
        projects: dir(Object.fromEntries(caseStudies.map((c) => [`${c.slug}.md`, file(caseStudyMarkdown(c))]))),
        notes: dir({
          'todo.txt': file(['[x] ship portfolio', '[x] make the terminal actually work', '[ ] reply to your message (send one: `hire`)', '[ ] touch grass'].join('\n')),
        }),
        '.bashrc': file(["# ~/.bashrc", "alias ll='ls -la'", "alias la='ls -a'", "alias l='ls'", "export EDITOR=vim", "export HIRE_ME=true"].join('\n')),
        '.secrets': file(
          'Nice try. There are no secrets here: this terminal runs entirely in your browser\nand nothing you type ever leaves this tab.',
        ),
      }),
    }),
    root: dir({}, { denied: true }),
    tmp: dir(),
    usr: dir({ bin: dir(), share: dir({ 'fortune.txt': file('') }) }),
    var: dir({
      log: dir({
        'deploy.log': file(
          [`[${buildTime}] build started`, `[${buildTime}] compiled successfully`, `[${buildTime}] deployed to edge`, `[${buildTime}] health check: 200 OK`].join('\n'),
        ),
      }),
    }),
    dev: dir({ null: file('') }),
  })
}

/* ---------- Path helpers ---------- */

export function normalize(path: string, cwd: string): string {
  let p = path
  if (p === '~' || p.startsWith('~/')) p = HOME + p.slice(1)
  if (!p.startsWith('/')) p = `${cwd}/${p}`
  const parts: string[] = []
  for (const seg of p.split('/')) {
    if (!seg || seg === '.') continue
    if (seg === '..') parts.pop()
    else parts.push(seg)
  }
  return '/' + parts.join('/')
}

export function displayPath(abs: string) {
  return abs === HOME ? '~' : abs.startsWith(HOME + '/') ? '~' + abs.slice(HOME.length) : abs
}

export function lookup(root: DirNode, abs: string): Node | null {
  if (abs === '/') return root
  let node: Node = root
  for (const seg of abs.split('/').filter(Boolean)) {
    if (node.type !== 'dir') return null
    const next: Node | undefined = node.children[seg]
    if (!next) return null
    node = next
  }
  return node
}

export function parentOf(abs: string): { parent: string; name: string } {
  const i = abs.lastIndexOf('/')
  return { parent: i <= 0 ? '/' : abs.slice(0, i), name: abs.slice(i + 1) }
}
