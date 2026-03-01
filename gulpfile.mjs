import gulp from 'gulp';
import postcss from 'gulp-postcss';
import tailwindcss from '@tailwindcss/postcss';
import rename from 'gulp-rename';
import { exec } from 'child_process';
import { utimesSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import browserSync from 'browser-sync';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bs = browserSync.create();

function compileCss() {
    return gulp.src('./source/css/input.css')
        .pipe(postcss([tailwindcss()]))
        .pipe(rename('apollo.css'))
        .pipe(gulp.dest('./source/css'));
}

function generate(cb) {
    exec(
        `node ${path.join(__dirname, 'node_modules/.bin/hexo')} generate`,
        { cwd: path.join(__dirname, 'demo') },
        (err) => { if (err) console.error(err); cb(); }
    );
}

function serve(cb) {
    bs.init({
        server: path.join(__dirname, 'dist'),
        port: 3000,
        open: false,
        notify: false,
        logPrefix: 'Apollo',
    });
    cb();
}

function watch() {
    // CSS change: recompile → regenerate → hot-swap stylesheet only
    gulp.watch('./source/css/input.css', gulp.series(compileCss, generate, (cb) => {
        bs.reload('apollo.css');
        cb();
    }));

    // Template change: touch input.css so Tailwind sees a change and rescans
    // for new utility classes, then regenerate → full reload
    gulp.watch('./layout/**/*.pug', gulp.series(
        (cb) => { const t = new Date(); utimesSync('./source/css/input.css', t, t); cb(); },
        compileCss,
        generate,
        (cb) => { bs.reload(); cb(); }
    ));
}

export { compileCss as sass };
export default gulp.series(compileCss, generate, serve, watch);
