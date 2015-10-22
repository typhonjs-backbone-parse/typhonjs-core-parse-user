/**
 * Gulp operations for Backbone-Parse-Typhon-ES6
 *
 * The following tasks are available:
 * docs - Creates documentation and outputs it in './docs'
 * lint - Runs ESLint outputting to console.
 * jspm-inspect - Executes 'jspm inspect'
 * jspm-install - Executes 'jspm install'
 * jspm-update - Executes 'jspm update'
 * npm-install - Executes 'npm install'
 * npm-uninstall - Executes 'npm uninstall'
 * test - Runs lint and bundle tasks.  (Add "--travis" argument to run minimal bundle op for Travis CI)
 */

/* eslint-disable */

var gulp =        require('gulp');

var argv =        require('yargs').argv;
var esdoc =       require('gulp-esdoc');
var eslint =      require('gulp-eslint');
var fs =          require('fs');
var jspm =        require('jspm');

// Set the package path to the local root where config.js is located.
jspm.setPackagePath('.');

/**
 * Create docs from ./src using ESDoc. The docs are located in ./docs
 */
gulp.task('docs', function()
{
   var path =        require('path');
   var url =         require('url');

   var esdocConfigLocation = '.' +path.sep +'esdoc.json';
   var esdocJSPMConfigLocation = '.' +path.sep +'esdoc-jspm.json';

   var esdocJSPMConfig = require(esdocJSPMConfigLocation);

   var localSrcRoot = require(esdocConfigLocation).source;

   var System = new jspm.Loader();

   var normalizedData = [];

   var rootDir = __dirname.split(path.sep).pop();

   if (esdocJSPMConfig.jspm && esdocJSPMConfig.jspm.packages)
   {
      for (var cntr = 0; cntr < esdocJSPMConfig.jspm.packages.length; cntr++)
      {
         var packageName = esdocJSPMConfig.jspm.packages[cntr];
         var normalized = System.normalizeSync(packageName);

         // Only process valid JSPM packages
         if (normalized.indexOf('jspm_packages') >= 0)
         {
            var parsedPath = path.parse(url.parse(normalized).pathname);
            var fullPath = parsedPath.dir +path.sep +parsedPath.name;
            var relativePath = path.relative(__dirname, parsedPath.dir) +path.sep +parsedPath.name;

            try
            {
               // Lookup JSPM package esdoc.json to pull out the source location.
               var packageESDocConfig = require(fullPath +path.sep +'esdoc.json');
               relativePath += path.sep + packageESDocConfig.source;
               fullPath += path.sep + packageESDocConfig.source;

               normalizedData.push(
               {
                  packageName: packageName,
                  jspmFullPath: fullPath,
                  jspmPath: relativePath,
                  normalizedPath: packageName +path.sep +packageESDocConfig.source,
                  source: packageESDocConfig.source
               });
            }
            catch(err)
            {
               console.log('docs - failed to require JSPM package esdoc.json');
            }
         }
      }
   }

   // There are JSPM packages so add generated config data created above.
   if (normalizedData.length > 0)
   {
      esdocJSPMConfig.jspm.localSrcRoot = localSrcRoot;
      esdocJSPMConfig.jspm.rootDir = rootDir;
      esdocJSPMConfig.jspm.packageData = normalizedData;
   }

   // Launch ESDoc with the generated config from above.
   return gulp.src(localSrcRoot).pipe(esdoc(esdocJSPMConfig));
});

/**
 * Runs eslint
 */
gulp.task('lint', function()
{
   return gulp.src('./src/**/*.js')
    .pipe(eslint({ useEslintrc: true }))
    .pipe(eslint.formatEach('compact', process.stderr))
    .pipe(eslint.failOnError());
});

/**
 * Runs "jspm inspect"
 */
gulp.task('jspm-inspect', function(cb)
{
   var exec = require('child_process').exec;
   exec('jspm inspect', function (err, stdout, stderr)
   {
      console.log(stdout);
      console.log(stderr);
      cb(err);
   });
});

/**
 * Runs "jspm install"
 */
gulp.task('jspm-install', function(cb)
{
   var exec = require('child_process').exec;
   exec('jspm install', function (err, stdout, stderr)
   {
      console.log(stdout);
      console.log(stderr);
      cb(err);
   });
});

/**
 * Runs "jspm update"
 */
gulp.task('jspm-update', function(cb)
{
   var exec = require('child_process').exec;
   exec('jspm update', function (err, stdout, stderr)
   {
      console.log(stdout);
      console.log(stderr);
      cb(err);
   });
});

/**
 * Runs "npm install"
 */
gulp.task('npm-install', function(cb)
{
   var exec = require('child_process').exec;
   exec('npm install', function (err, stdout, stderr)
   {
      console.log(stdout);
      console.log(stderr);
      cb(err);
   });
});

/**
 * Runs "npm uninstall <package> for all node modules installed."
 */
gulp.task('npm-uninstall', function(cb)
{
   var exec = require('child_process').exec;
   exec('for package in `ls node_modules`; do npm uninstall $package; done;', function (err, stdout, stderr)
   {
      console.log(stdout);
      console.log(stderr);
      cb(err);
   });
});

/**
 * Runs "lint" and "bundle"; useful for testing and Travis CI.
 */
gulp.task('test', ['lint']);