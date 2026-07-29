import { Star } from 'lucide-react';

interface SkillRatingProps {
  skills: Record<string, number>;
  onChange: (skills: Record<string, number>) => void;
}

const SKILL_DESCRIPTIONS: Record<number, string> = {
  1: 'Beginner',
  2: 'Novice',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

export default function SkillRating({ skills, onChange }: SkillRatingProps) {
  const handleRate = (skill: string, rating: number) => {
    onChange({
      ...skills,
      [skill]: rating,
    });
  };

  return (
    <div className="space-y-6">
      {Object.entries(skills).map(([skill, rating]) => (
        <div
          key={skill}
          className="p-5 rounded-xl border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-sm"
        >
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">
              {skill}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Rate your confidence and problem-solving readiness in this area.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Stars */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRate(skill, star)}
                  className="focus:outline-none transition-transform active:scale-125"
                >
                  <Star
                    className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300 dark:text-gray-700 hover:text-amber-300 dark:hover:text-amber-500'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Descriptor Text */}
            <span
              className={`w-24 text-center px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${
                rating > 0
                  ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
              }`}
            >
              {SKILL_DESCRIPTIONS[rating] || 'Unrated'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
