// Static achievement catalog (§3). Seeded into the Achievement collection at boot;
// the awarding RULES live in gamification.service (evaluateAndAward).

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: 'first-lesson', title: 'First Steps', description: 'Complete your first lesson.', icon: '🎯' },
  { key: 'ten-lessons', title: 'Dedicated Learner', description: 'Complete 10 lessons.', icon: '📚' },
  { key: 'streak-3', title: 'On a Roll', description: 'Reach a 3-day learning streak.', icon: '🔥' },
  { key: 'streak-7', title: 'Week Warrior', description: 'Reach a 7-day learning streak.', icon: '⚡' },
  { key: 'streak-30', title: 'Unstoppable', description: 'Reach a 30-day learning streak.', icon: '🏆' },
  { key: 'course-complete', title: 'Course Conqueror', description: 'Complete an entire course.', icon: '🎓' },
  { key: 'assessment-pass', title: 'Passed!', description: 'Pass an assessment (70%+).', icon: '✅' },
  { key: 'perfect-score', title: 'Flawless', description: 'Score 100% on an assessment.', icon: '💯' },
];
