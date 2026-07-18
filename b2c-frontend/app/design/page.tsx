import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Progress,
  Skeleton,
  Spinner,
  ThemeToggle,
} from '@/src/components/ui';

const swatches = [
  { name: 'primary', cls: 'bg-primary' },
  { name: 'primary-soft', cls: 'bg-primary-soft' },
  { name: 'good', cls: 'bg-good' },
  { name: 'bad', cls: 'bg-bad' },
  { name: 'warn', cls: 'bg-warn' },
  { name: 'tint-blue', cls: 'bg-tint-blue' },
  { name: 'tint-mint', cls: 'bg-tint-mint' },
  { name: 'tint-peach', cls: 'bg-tint-peach' },
  { name: 'tint-pink', cls: 'bg-tint-pink' },
  { name: 'tint-lime', cls: 'bg-tint-lime' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-14">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-primary to-primary-2 font-extrabold text-primary-ink shadow-card">
            A
          </span>
          <div>
            <div className="text-lg font-extrabold tracking-tight">ABC Design System</div>
            <div className="text-xs text-ink-3">FP0 — foundation ready</div>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <Section title="Color tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {swatches.map((s) => (
            <div key={s.name} className="flex flex-col gap-2">
              <div className={`h-14 rounded-xl border border-line ${s.cls}`} />
              <span className="font-mono text-[11px] text-ink-3">{s.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="soft">Soft</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="primary">Premium</Badge>
          <Badge variant="good">Ready</Badge>
          <Badge variant="bad">Failed</Badge>
          <Badge variant="warn">Generating</Badge>
          <Badge variant="outline">Draft</Badge>
        </div>
      </Section>

      <Section title="Form">
        <div className="flex max-w-sm flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" />
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>SOC Analyst — Level 1</CardTitle>
              <CardDescription>68% complete · 6 labs · 3 exams</CardDescription>
            </CardHeader>
            <CardBody className="flex flex-col gap-4 pt-4">
              <Progress value={68} />
              <div className="flex items-center gap-3">
                <Avatar name="Rafi Ahmed" />
                <div className="text-sm">
                  <div className="font-semibold">Rafi Ahmed</div>
                  <div className="text-ink-3">12-day streak</div>
                </div>
                <Badge variant="primary" className="ml-auto">
                  Premium
                </Badge>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loading states</CardTitle>
              <CardDescription>Skeleton + spinner</CardDescription>
            </CardHeader>
            <CardBody className="flex flex-col gap-3 pt-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <div className="flex items-center gap-2 text-sm text-ink-2">
                <Spinner className="size-4 text-primary" /> Generating course…
              </div>
            </CardBody>
          </Card>
        </div>
      </Section>
    </main>
  );
}
