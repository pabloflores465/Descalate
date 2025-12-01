import * as SQLite from 'expo-sqlite';

const exercises = [
  'Respiracion profunda',
  'Meditacion guiada',
  'Relajacion muscular',
  'Visualizacion',
  'Ejercicio de grounding',
  'Caminata consciente',
  'Escritura terapeutica',
  'Escaneo corporal',
];

const tipCategories = ['Mindfulness', 'Ejercicio', 'Nutricion', 'Sueno', 'Social'];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomExercises(): string {
  const count = getRandomInt(1, 3);
  const selected: string[] = [];
  for (let i = 0; i < count; i++) {
    const exercise = exercises[getRandomInt(0, exercises.length - 1)];
    if (!selected.includes(exercise)) {
      selected.push(exercise);
    }
  }
  return JSON.stringify(selected);
}

function formatDate(date: Date): string {
  return date.toISOString();
}

export async function seedHistoricalSessions(userId: number): Promise<void> {
  const db = await SQLite.openDatabaseAsync('descalate.db');

  const sessionsToInsert: Array<{
    user_id: number;
    anxiety_level: number;
    selected_exercises: string;
    tip_id: number;
    tip_title: string;
    tip_category: string;
    final_action: string;
    duration_seconds: number;
    completed_at: string;
    created_at: string;
  }> = [];

  const now = new Date();

  // Last 7 days - 2-4 sessions per day
  for (let day = 0; day < 7; day++) {
    const sessionsPerDay = getRandomInt(2, 4);
    for (let s = 0; s < sessionsPerDay; s++) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      date.setHours(getRandomInt(8, 22), getRandomInt(0, 59), 0, 0);

      sessionsToInsert.push({
        user_id: userId,
        anxiety_level: getRandomInt(1, 5),
        selected_exercises: getRandomExercises(),
        tip_id: getRandomInt(1, 20),
        tip_title: `Tip de prueba ${getRandomInt(1, 20)}`,
        tip_category: tipCategories[getRandomInt(0, tipCategories.length - 1)],
        final_action: Math.random() > 0.3 ? 'completed' : 'skipped',
        duration_seconds: getRandomInt(120, 900),
        completed_at: formatDate(date),
        created_at: formatDate(date),
      });
    }
  }

  // Last 6 months (excluding current week) - 10-20 sessions per month
  for (let month = 0; month < 6; month++) {
    const sessionsPerMonth = getRandomInt(10, 20);
    for (let s = 0; s < sessionsPerMonth; s++) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - month);
      // Skip if in current week
      if (month === 0) {
        date.setDate(date.getDate() - 7 - getRandomInt(0, 20));
      } else {
        date.setDate(getRandomInt(1, 28));
      }
      date.setHours(getRandomInt(8, 22), getRandomInt(0, 59), 0, 0);

      // Trend: slightly lower anxiety in more recent months
      const baseLevel = month < 2 ? getRandomInt(1, 4) : getRandomInt(2, 5);

      sessionsToInsert.push({
        user_id: userId,
        anxiety_level: baseLevel,
        selected_exercises: getRandomExercises(),
        tip_id: getRandomInt(1, 20),
        tip_title: `Tip de prueba ${getRandomInt(1, 20)}`,
        tip_category: tipCategories[getRandomInt(0, tipCategories.length - 1)],
        final_action: Math.random() > 0.3 ? 'completed' : 'skipped',
        duration_seconds: getRandomInt(120, 900),
        completed_at: formatDate(date),
        created_at: formatDate(date),
      });
    }
  }

  // Previous years data - generate for each of the last 3 years explicitly
  const currentYear = now.getFullYear();

  // Year 2023 - 30-50 sessions
  const sessions2023 = getRandomInt(30, 50);
  for (let s = 0; s < sessions2023; s++) {
    const month = getRandomInt(0, 11);
    const day = getRandomInt(1, 28);
    const hour = getRandomInt(8, 22);
    const minute = getRandomInt(0, 59);
    const date = new Date(2023, month, day, hour, minute, 0, 0);

    sessionsToInsert.push({
      user_id: userId,
      anxiety_level: getRandomInt(3, 5),
      selected_exercises: getRandomExercises(),
      tip_id: getRandomInt(1, 20),
      tip_title: `Tip de prueba ${getRandomInt(1, 20)}`,
      tip_category: tipCategories[getRandomInt(0, tipCategories.length - 1)],
      final_action: Math.random() > 0.3 ? 'completed' : 'skipped',
      duration_seconds: getRandomInt(120, 900),
      completed_at: formatDate(date),
      created_at: formatDate(date),
    });
  }

  // Year 2024 - 40-60 sessions
  const sessions2024 = getRandomInt(40, 60);
  for (let s = 0; s < sessions2024; s++) {
    const month = getRandomInt(0, 11);
    const day = getRandomInt(1, 28);
    const hour = getRandomInt(8, 22);
    const minute = getRandomInt(0, 59);
    const date = new Date(2024, month, day, hour, minute, 0, 0);

    sessionsToInsert.push({
      user_id: userId,
      anxiety_level: getRandomInt(2, 5),
      selected_exercises: getRandomExercises(),
      tip_id: getRandomInt(1, 20),
      tip_title: `Tip de prueba ${getRandomInt(1, 20)}`,
      tip_category: tipCategories[getRandomInt(0, tipCategories.length - 1)],
      final_action: Math.random() > 0.3 ? 'completed' : 'skipped',
      duration_seconds: getRandomInt(120, 900),
      completed_at: formatDate(date),
      created_at: formatDate(date),
    });
  }

  // Earlier months of current year (before the last 6 months)
  const currentMonth = now.getMonth();
  if (currentMonth > 5) {
    const sessionsEarlierThisYear = getRandomInt(20, 40);
    for (let s = 0; s < sessionsEarlierThisYear; s++) {
      const month = getRandomInt(0, currentMonth - 6);
      const day = getRandomInt(1, 28);
      const hour = getRandomInt(8, 22);
      const minute = getRandomInt(0, 59);
      const date = new Date(currentYear, month, day, hour, minute, 0, 0);

      sessionsToInsert.push({
        user_id: userId,
        anxiety_level: getRandomInt(1, 4),
        selected_exercises: getRandomExercises(),
        tip_id: getRandomInt(1, 20),
        tip_title: `Tip de prueba ${getRandomInt(1, 20)}`,
        tip_category: tipCategories[getRandomInt(0, tipCategories.length - 1)],
        final_action: Math.random() > 0.3 ? 'completed' : 'skipped',
        duration_seconds: getRandomInt(120, 900),
        completed_at: formatDate(date),
        created_at: formatDate(date),
      });
    }
  }

  // Insert all sessions
  for (const session of sessionsToInsert) {
    await db.runAsync(
      `INSERT INTO sessions (user_id, anxiety_level, selected_exercises, tip_id, tip_title, tip_category, final_action, duration_seconds, completed_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.user_id,
        session.anxiety_level,
        session.selected_exercises,
        session.tip_id,
        session.tip_title,
        session.tip_category,
        session.final_action,
        session.duration_seconds,
        session.completed_at,
        session.created_at,
      ]
    );
  }

  console.log(`Seeded ${sessionsToInsert.length} historical sessions for user ${userId}`);
}

export async function clearSessions(userId: number): Promise<void> {
  const db = await SQLite.openDatabaseAsync('descalate.db');
  await db.runAsync('DELETE FROM sessions WHERE user_id = ?', [userId]);
  console.log(`Cleared all sessions for user ${userId}`);
}
