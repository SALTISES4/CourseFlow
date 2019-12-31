const gulp = require("gulp");

gulp.task("build-js", function(callback) {
  const runCommand = require("child_process").execSync;
  runCommand("./node_modules/.bin/rollup -c", function(err, stdout, stderr) {
    console.log("Output: " + stdout);
    console.log("Error: " + stderr);
    if (err) {
      console.log("Error: " + err);
    }
  });
  // Call the callback to signal completion
  callback();
});
