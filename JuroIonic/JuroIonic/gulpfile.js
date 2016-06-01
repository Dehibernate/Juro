var gulp = require('gulp');
var babel = require("gulp-babel");
var es2015 = require('babel-preset-es2015');
var plumber = require("gulp-plumber");

var paths = {
  app: ['./app/**/*'],
  nonJS: ['./app/**/*', '!./app/**/*.js'],
  js: ['./app/**/*.js'],
};

//gulp.task('default', ['babel']);

gulp.task("src", function () {
  gulp.src(paths.nonJS)
  .pipe(gulp.dest("./www/src"));
});

gulp.task("babel", ['src'], function () {
  gulp.src(paths.js)
  .pipe(plumber())
  .pipe(babel({presets: ['es2015']}))
  .pipe(gulp.dest("./www/src"));
});

gulp.task('watch', function () {
  gulp.watch(paths.app,['babel']);
});
