import { ChatPanel } from "@/features/home";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-100 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col p-4 sm:p-6">
        <ChatPanel />
      </div>
    </div>
  );
}
