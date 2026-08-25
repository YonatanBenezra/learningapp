export function LoginForm() {
  return (
    <form className="flex max-w-sm flex-col gap-3">
      <label className="text-sm">
        Email
        <input
          type="email"
          name="email"
          disabled
          className="mt-1 block w-full border px-3 py-2"
        />
      </label>
      <button type="button" disabled className="border px-3 py-2 text-sm">
        Send magic link
      </button>
    </form>
  );
}
