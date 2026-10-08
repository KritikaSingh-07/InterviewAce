interface AnimatedBackgroundProps {
  /** Render behind a section instead of the whole viewport */
  contained?: boolean;
  showGrain?: boolean;
}

// Slowly drifting colour blobs + film grain. Purely decorative.
export default function AnimatedBackground({ contained = false, showGrain = true }: AnimatedBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none inset-0 overflow-hidden ${contained ? 'absolute -z-0' : 'fixed -z-10'}`}
    >
      <div className="aurora-blob w-[42rem] h-[42rem] -top-48 -left-40 bg-indigo-300 dark:bg-indigo-700 animate-aurora" />
      <div className="aurora-blob w-[36rem] h-[36rem] top-1/3 -right-48 bg-gray-400 dark:bg-purple-800 animate-aurora-reverse" />
      <div className="aurora-blob w-[30rem] h-[30rem] -bottom-40 left-1/4 bg-purple-200 dark:bg-violet-900 animate-aurora" style={{ animationDelay: '-6s' }} />
      {showGrain && <div className="bg-grain" />}
    </div>
  );
}
