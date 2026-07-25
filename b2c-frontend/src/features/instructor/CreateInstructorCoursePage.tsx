'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { useCreateInstructorCourse } from '@/src/features/instructor/useInstructor';

const CATEGORIES = [
  'Programming',
  'Artificial Intelligence',
  'Cyber Security',
  'Networking',
  'Data Science',
  'Business',
  'Design',
  'Other',
];

export function CreateInstructorCoursePage() {
  const router = useRouter();
  const create = useCreateInstructorCourse();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [topics, setTopics] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [price, setPrice] = useState('49');
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const topicList = topics
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const priceCents = Math.round(Number(price) * 100);

    if (!title.trim() || description.trim().length < 10) {
      setError('Add a title and a description of at least 10 characters.');
      return;
    }
    if (topicList.length === 0) {
      setError('Add at least one topic (comma-separated).');
      return;
    }
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      setError('Set a valid price greater than zero.');
      return;
    }

    create.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        category,
        topics: topicList,
        level,
        priceCents,
        currency: 'USD',
      },
      {
        onSuccess: ({ course }) => router.push(`/instructor/courses/${course.id}`),
        onError: () => setError('Could not create the course. Please try again.'),
      },
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Create a course to sell</h2>
        <p className="mt-1 text-sm text-ink-2">
          We will generate the curriculum with AI. You can publish it once generation completes.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-lg border border-line bg-bg-elev p-6 shadow-soft"
      >
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium text-ink">
            Course title
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 w-full rounded-lg border border-line bg-bg-elev px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            placeholder="Advanced React Patterns"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium text-ink">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-line bg-bg-elev px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            placeholder="What learners will gain from this course…"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="mb-2 block text-sm font-medium text-ink">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 w-full rounded-lg border border-line bg-bg-elev px-4 text-sm outline-none focus:border-primary"
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="level" className="mb-2 block text-sm font-medium text-ink">
              Level
            </label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value as typeof level)}
              className="h-11 w-full rounded-lg border border-line bg-bg-elev px-4 text-sm outline-none focus:border-primary"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="topics" className="mb-2 block text-sm font-medium text-ink">
              Topics
            </label>
            <input
              id="topics"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              className="h-11 w-full rounded-lg border border-line bg-bg-elev px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Hooks, performance, patterns"
            />
            <p className="mt-1 text-xs text-ink-3">Comma-separated</p>
          </div>
          <div>
            <label htmlFor="price" className="mb-2 block text-sm font-medium text-ink">
              Price (USD)
            </label>
            <input
              id="price"
              type="number"
              min="1"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-11 w-full rounded-lg border border-line bg-bg-elev px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>

        {error ? (
          <p className="rounded-lg border border-bad/30 bg-bad-soft px-4 py-3 text-sm text-bad">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending} className="rounded-lg bg-primary">
            {create.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Create & generate
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateInstructorCoursePage;
