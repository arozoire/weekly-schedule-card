import terser from '@rollup/plugin-terser';

export default [
  {
    input: 'src/weekly-schedule-card.js',
    output: {
      file: 'dist/weekly-schedule-card.js',
      format: 'iife',
      name: 'WeeklyScheduleCard'
    },
    plugins: [terser()]
  },
  {
    input: 'src/weekly-schedule-view-card.js',
    output: {
      file: 'dist/weekly-schedule-view-card.js',
      format: 'iife',
      name: 'WeeklyScheduleViewCard'
    },
    plugins: [terser()]
  },
  {
    input: 'src/quick-timer-card.js',
    output: {
      file: 'dist/quick-timer-card.js',
      format: 'iife',
      name: 'QuickTimerCard'
    },
    plugins: [terser()]
  }
];
