import gulp from 'gulp';
import rename from 'gulp-rename';

// 1) Node icons (corrected path)
gulp.task('build:icons', () => {
  return gulp
    .src('src/nodes/SmartSuite/smartsuite.svg')
    .pipe(rename('SmartSuite.svg'))
    .pipe(gulp.dest('dist/nodes/SmartSuite'));
});

// 2) Credential icon (corrected path)
gulp.task('build:credential-icon', () => {
  return gulp
    .src('src/nodes/SmartSuite/smartsuite.svg')
    .pipe(rename('SmartSuiteApi.svg'))
    .pipe(gulp.dest('dist/credentials'));
});

// 3) Codex JSON files for Quick-Action UI
gulp.task('build:codex', () => {
  return gulp
    .src('src/nodes/SmartSuite/*.node.json')
    .pipe(gulp.dest('dist/nodes/SmartSuite'));
});

// Aggregate all build steps
gulp.task(
  'build',
  gulp.series('build:icons', 'build:credential-icon', 'build:codex'),
);

// alias icons to the build sequence
gulp.task('icons', gulp.series('build'));

// default task
gulp.task('default', gulp.series('build'));
