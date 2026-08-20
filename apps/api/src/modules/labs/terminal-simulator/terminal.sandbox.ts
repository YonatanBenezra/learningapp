// Fully-simulated shell (§2.1). This is NOT a real shell: there is no child
// process, no host filesystem, and no command execution. Commands operate on an
// in-memory virtual FS with a strict whitelist — anything else is "command not
// found". This makes host escape / arbitrary execution structurally impossible.

type VNode = { type: 'file'; content: string } | { type: 'dir'; children: Record<string, VNode> };

const FS: VNode = {
  type: 'dir',
  children: {
    home: {
      type: 'dir',
      children: {
        analyst: {
          type: 'dir',
          children: {
            'readme.txt': {
              type: 'file',
              content: 'Welcome to the lab terminal. Try: ls, cat, cd, pwd, whoami.\n',
            },
            logs: {
              type: 'dir',
              children: {
                'auth.log': {
                  type: 'file',
                  content: 'Jul 14 02:14 sshd Accepted password for analyst from 10.0.0.9\n',
                },
              },
            },
          },
        },
      },
    },
    etc: {
      type: 'dir',
      children: {
        motd: { type: 'file', content: 'Authorized training use only.\n' },
      },
    },
  },
};

const ALLOWED = ['help', 'pwd', 'ls', 'cd', 'cat', 'echo', 'whoami', 'clear'] as const;

export const DEFAULT_CWD = '/home/analyst';

export interface TerminalState {
  cwd: string;
}
export interface TerminalResult {
  output: string;
  cwd: string;
  error: boolean;
}

// Normalizes an absolute/relative path within the virtual FS. `..` can never
// escape the root — it simply clamps — so there is no traversal out of the sandbox.
function resolvePath(cwd: string, arg?: string): string {
  const raw = !arg ? cwd : arg.startsWith('/') ? arg : `${cwd}/${arg}`;
  const stack: string[] = [];
  for (const part of raw.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  return `/${stack.join('/')}`;
}

function nodeAt(path: string): VNode | null {
  if (path === '/') return FS;
  let node: VNode = FS;
  for (const part of path.split('/').filter(Boolean)) {
    if (node.type !== 'dir' || !node.children[part]) return null;
    node = node.children[part];
  }
  return node;
}

// Minimal quote-aware tokenizer: "a b" and 'a b' are single tokens with the
// surrounding quotes stripped; bare runs split on whitespace.
function tokenize(line: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) tokens.push(m[1] ?? m[2] ?? m[3]);
  return tokens;
}

export function runCommand(state: TerminalState, commandLine: string): TerminalResult {
  const cwd = state.cwd || DEFAULT_CWD;
  const trimmed = commandLine.trim();
  if (!trimmed) return { output: '', cwd, error: false };

  const [cmd, ...args] = tokenize(trimmed);
  if (!(ALLOWED as readonly string[]).includes(cmd)) {
    return { output: `sh: ${cmd}: command not found`, cwd, error: true };
  }

  switch (cmd) {
    case 'help':
      return { output: `Available commands: ${ALLOWED.join(', ')}`, cwd, error: false };
    case 'whoami':
      return { output: 'analyst', cwd, error: false };
    case 'clear':
      return { output: '', cwd, error: false };
    case 'echo':
      return { output: args.join(' '), cwd, error: false };
    case 'pwd':
      return { output: cwd, cwd, error: false };
    case 'ls': {
      const target = resolvePath(cwd, args[0]);
      const node = nodeAt(target);
      if (!node) return { output: `ls: ${args[0] ?? target}: No such file or directory`, cwd, error: true };
      if (node.type === 'file') return { output: target.split('/').pop() ?? '', cwd, error: false };
      return { output: Object.keys(node.children).sort().join('  '), cwd, error: false };
    }
    case 'cd': {
      const target = resolvePath(cwd, args[0] ?? DEFAULT_CWD);
      const node = nodeAt(target);
      if (!node) return { output: `cd: ${args[0]}: No such file or directory`, cwd, error: true };
      if (node.type !== 'dir') return { output: `cd: ${args[0]}: Not a directory`, cwd, error: true };
      return { output: '', cwd: target, error: false };
    }
    case 'cat': {
      if (!args[0]) return { output: 'cat: missing operand', cwd, error: true };
      const target = resolvePath(cwd, args[0]);
      const node = nodeAt(target);
      if (!node) return { output: `cat: ${args[0]}: No such file or directory`, cwd, error: true };
      if (node.type !== 'file') return { output: `cat: ${args[0]}: Is a directory`, cwd, error: true };
      return { output: node.content, cwd, error: false };
    }
    default:
      return { output: `sh: ${cmd}: command not found`, cwd, error: true };
  }
}
