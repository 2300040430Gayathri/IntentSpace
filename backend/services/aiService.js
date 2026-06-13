const AIReport = require('../models/AIReport');
const Habit = require('../models/Habit');
const HabitEntry = require('../models/HabitEntry');
const Task = require('../models/Task');
const FocusSession = require('../models/FocusSession');
const Mood = require('../models/Mood');
const Memory = require('../models/Memory');
const Skill = require('../models/Skill');
const SkillEntry = require('../models/SkillEntry');
const Diary = require('../models/Diary');

const supportiveTone = (message) => message;

const generateDailySummary = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [habits, habitEntries, tasks, focusSessions, mood] = await Promise.all([
    Habit.countDocuments({ user: userId, isActive: true }),
    HabitEntry.countDocuments({ user: userId, date: { $gte: today, $lt: tomorrow }, completed: true }),
    Task.find({ user: userId, status: 'pending' }).limit(5),
    FocusSession.find({ user: userId, startedAt: { $gte: today, $lt: tomorrow }, completed: true }),
    Mood.findOne({ user: userId, date: { $gte: today, $lt: tomorrow } }),
  ]);

  const focusMinutes = focusSessions.reduce((sum, s) => sum + s.duration, 0);
  const moodText = mood ? `You're feeling ${mood.mood} today.` : '';

  const content = supportiveTone(
    `Good day! Here's your IntentSpace summary:\n\n` +
      `✅ Habits: ${habitEntries}/${habits} completed\n` +
      `⏱️ Focus: ${focusMinutes} minutes of deep work\n` +
      `📋 Pending tasks: ${tasks.length}\n` +
      `${moodText}\n\n` +
      `You're making progress — every small step counts. ` +
      `${tasks.length > 0 ? `Consider tackling "${tasks[0]?.title}" next.` : 'Enjoy this momentum!'}`
  );

  return AIReport.create({ user: userId, type: 'daily_summary', content, periodStart: today, periodEnd: tomorrow });
};

const generateHabitSuggestions = async (userId) => {
  const existing = await Habit.find({ user: userId }).select('name');
  const existingNames = existing.map((h) => h.name.toLowerCase());

  const suggestions = [
    { name: 'Morning Meditation', type: 'yes_no', icon: '🧘', color: '#8B5CF6' },
    { name: 'Water Intake', type: 'range', unit: 'glasses', target: 8, icon: '💧', color: '#06B6D4' },
    { name: 'Reading', type: 'range', unit: 'pages', target: 20, icon: '📖', color: '#F59E0B' },
    { name: 'Exercise', type: 'yes_no', icon: '🏃', color: '#10B981' },
    { name: 'Sleep 8 Hours', type: 'range', unit: 'hours', target: 8, icon: '😴', color: '#6366F1' },
    { name: 'Skincare', type: 'yes_no', icon: '✨', color: '#EC4899' },
    { name: 'Walking', type: 'range', unit: 'steps', target: 8000, icon: '🚶', color: '#14B8A6' },
    { name: 'Study Hours', type: 'range', unit: 'hours', target: 2, icon: '📚', color: '#2563EB' },
  ].filter((s) => !existingNames.includes(s.name.toLowerCase()));

  const content = supportiveTone(
    `Based on your journey, here are habits that could help you grow:\n\n` +
      suggestions
        .slice(0, 4)
        .map((s) => `• ${s.icon} ${s.name}`)
        .join('\n') +
      `\n\nStart with one — consistency beats perfection. You've got this!`
  );

  return AIReport.create({
    user: userId,
    type: 'habit_suggestions',
    content,
    metadata: { suggestions: suggestions.slice(0, 4) },
  });
};

const generateTaskPrioritization = async (userId) => {
  const tasks = await Task.find({ user: userId, status: 'pending' }).sort({ priority: 1, deadline: 1 });

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...tasks].sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
    return a.deadline ? -1 : 1;
  });

  const content = supportiveTone(
    sorted.length === 0
      ? "You're all caught up! Take a moment to celebrate — then maybe plan something meaningful for tomorrow."
      : `Here's how I'd tackle your tasks today:\n\n` +
          sorted
            .slice(0, 5)
            .map((t, i) => `${i + 1}. [${t.priority.toUpperCase()}] ${t.title}${t.deadline ? ` (due ${new Date(t.deadline).toLocaleDateString()})` : ''}`)
            .join('\n') +
          `\n\nFocus on one at a time. You're capable of more than you think!`
  );

  return AIReport.create({
    user: userId,
    type: 'task_prioritization',
    content,
    metadata: { prioritizedIds: sorted.slice(0, 5).map((t) => t._id) },
  });
};

const generateDiaryReflection = async (userId, diaryContent, mood) => {
  const reflections = [
    `Thank you for sharing this with me. It sounds like today had its own rhythm — and you showed up for yourself by writing it down. That matters.`,
    `I can sense the ${mood || 'thoughtful'} energy in your words. Remember, every day is a chapter in your story, and you're the author.`,
    `What you wrote today shows real self-awareness. Be gentle with yourself — growth isn't always linear, and that's perfectly okay.`,
    `I'm proud of you for taking time to reflect. These moments of honesty are where real transformation begins.`,
  ];

  const content = supportiveTone(reflections[Math.floor(Math.random() * reflections.length)]);

  return AIReport.create({
    user: userId,
    type: 'diary_reflection',
    content,
    metadata: { mood, excerpt: diaryContent?.slice(0, 100) },
  });
};

const generateFocusCoaching = async (userId) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const sessions = await FocusSession.find({
    user: userId,
    startedAt: { $gte: weekAgo },
    completed: true,
  });

  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
  const avgSession = sessions.length ? Math.round(totalMinutes / sessions.length) : 0;

  const content = supportiveTone(
    sessions.length === 0
      ? `Ready to start your focus journey? Try a 25-minute session today — small wins build big habits. I'll be cheering you on!`
      : `This week you completed ${sessions.length} focus sessions (${totalMinutes} min total, ~${avgSession} min avg).\n\n` +
          `${totalMinutes >= 300 ? "Incredible dedication! You're building a powerful focus muscle." : "Good start! Try adding one more session this week — you've got the discipline."}\n\n` +
          `Tip: Pick your hardest task for your first session tomorrow. Fresh mind, fresh energy!`
  );

  return AIReport.create({ user: userId, type: 'focus_coaching', content, periodStart: weekAgo });
};

const generateSkillInsights = async (userId, skillId) => {
  const skill = await Skill.findById(skillId);
  if (!skill) return null;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const entries = await SkillEntry.find({ skill: skillId, date: { $gte: weekAgo } });

  const topics = entries.flatMap((e) => e.topicsLearned);
  const content = supportiveTone(
    entries.length === 0
      ? `You haven't logged practice for ${skill.name} this week. Even 15 minutes counts — what topic will you explore today?`
      : `Weekly ${skill.name} insights:\n\n` +
          `📚 ${entries.length} practice sessions\n` +
          `🔥 Current streak: ${skill.currentStreak} days\n` +
          `📖 Topics: ${topics.slice(0, 5).join(', ') || 'General practice'}\n\n` +
          `Keep building — mastery is a marathon, not a sprint. I'm proud of your consistency!`
  );

  return AIReport.create({
    user: userId,
    type: 'skill_insights',
    content,
    metadata: { skillId, skillName: skill.name },
  });
};

const generateMemoryRecap = async (userId, month, year) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const memories = await Memory.find({ user: userId, date: { $gte: start, $lte: end } }).sort({ date: -1 });

  const moodCounts = memories.reduce((acc, m) => {
    acc[m.mood] = (acc[m.mood] || 0) + 1;
    return acc;
  }, {});

  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'happy';

  const content = supportiveTone(
    memories.length === 0
      ? `No memories captured in ${start.toLocaleString('default', { month: 'long' })} ${year}. Start collecting moments — they're worth preserving!`
      : `${start.toLocaleString('default', { month: 'long' })} ${year} Recap:\n\n` +
          `📸 ${memories.length} beautiful memories captured\n` +
          `💫 Dominant mood: ${dominantMood}\n` +
          `✨ Highlights: ${memories.slice(0, 3).map((m) => m.title).join(', ')}\n\n` +
          `Life is made of these moments. Thank you for preserving them.`
  );

  return AIReport.create({
    user: userId,
    type: 'memory_recap',
    content,
    metadata: { month, year, count: memories.length },
    periodStart: start,
    periodEnd: end,
  });
};

const generatePlannerReview = async (userId, blocks) => {
  const completed = blocks.filter((b) => b.completed).length;
  const total = blocks.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  const content = supportiveTone(
    total === 0
      ? `Your planner is empty today. Take 5 minutes to map out your ideal day — structure creates freedom!`
      : `Daily Review: ${completed}/${total} blocks completed (${pct}%)\n\n` +
          `${pct >= 80 ? "Outstanding execution! You honored your intentions today." : pct >= 50 ? "Solid progress. Tomorrow, protect your morning blocks — they set the tone." : "Tomorrow is a fresh canvas. Pick your top 3 priorities and build around them."}\n\n` +
          `Remember: the planner serves you, not the other way around.`
  );

  return AIReport.create({ user: userId, type: 'planner_review', content, metadata: { completed, total, pct } });
};

const generateWeeklySummary = async (userId) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [habitEntries, completedTasks, focusSessions, moods, memories] = await Promise.all([
    HabitEntry.countDocuments({ user: userId, date: { $gte: weekAgo }, completed: true }),
    Task.countDocuments({ user: userId, completedAt: { $gte: weekAgo } }),
    FocusSession.find({ user: userId, startedAt: { $gte: weekAgo }, completed: true }),
    Mood.find({ user: userId, date: { $gte: weekAgo } }),
    Memory.countDocuments({ user: userId, date: { $gte: weekAgo } }),
  ]);

  const focusMin = focusSessions.reduce((s, f) => s + f.duration, 0);

  const content = supportiveTone(
    `Your Week in Review:\n\n` +
      `✅ ${habitEntries} habit completions\n` +
      `📋 ${completedTasks} tasks done\n` +
      `⏱️ ${focusMin} focus minutes\n` +
      `📸 ${memories} memories saved\n` +
      `😊 ${moods.length} mood check-ins\n\n` +
      `You're building a life with intention. Keep going — I'm here cheering for you every step of the way.`
  );

  return AIReport.create({ user: userId, type: 'weekly_summary', content, periodStart: weekAgo });
};

const generateMotivation = async (userId) => {
  const messages = [
    `Hey there! Just a gentle reminder: you're doing better than you think. One intentional day at a time.`,
    `Progress isn't always visible, but it's always happening. Trust the process — I believe in you.`,
    `Today is a gift. Use it to move one step closer to the person you're becoming.`,
    `Consistency is your superpower. Even on hard days, showing up matters more than perfection.`,
    `Your future self will thank you for the habits you're building today. Keep going!`,
  ];

  const content = supportiveTone(messages[Math.floor(Math.random() * messages.length)]);
  return AIReport.create({ user: userId, type: 'motivation', content });
};

module.exports = {
  generateDailySummary,
  generateHabitSuggestions,
  generateTaskPrioritization,
  generateDiaryReflection,
  generateFocusCoaching,
  generateSkillInsights,
  generateMemoryRecap,
  generatePlannerReview,
  generateWeeklySummary,
  generateMotivation,
};
