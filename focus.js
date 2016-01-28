'use strict';

const cp            = require('child_process');
const electron      = require('electron'),
      app           = electron.app,
      BrowserWindow = electron.BrowserWindow;
var   main_win      = null,
      target_proc   = null;

const bg_loc  = '/tmp/tmp_bg.png';
cp.spawnSync('screencapture', ['-x', bg_loc]);

const sizep   = cp.spawnSync('sh', ['-c', 'system_profiler SPDisplaysDataType | \
                                           grep -Eoh "[0-9]{4} x [0-9]{4}" | \
                                           tr -d [:space:]']).stdout.toString().split('x');

function run_applescript(cmd) {
  const x = cp.spawnSync('osascript', ['-e', cmd]);
  return [ x.stdout.toString(), x.stderr.toString() ];
}

function get_activewin() {
  return run_applescript('tell application "System Events" to return name of first application process whose frontmost is true')[0].slice(0, -1);
}

if (process.argv.length <= 2)
  target_proc = get_activewin();
else
  target_proc = process.argv[2];

app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  main_win = new BrowserWindow({
    width                  : parseInt(sizep[0]),
    height                 : parseInt(sizep[1]),
    transparent            : true,
    frame                  : false,
    moveable               : false,
    resizable              : false,
    enableLargerThanScreen : true,
    x                      : -8,
    y                      : -8
  });
  main_win.loadURL('file://' + __dirname + '/index.html');

  if (run_applescript('\
tell application "' + target_proc + '"\n\
  if it is running then\n\
    activate \n\
  else\n\
    tell application "System Events"\n\
      set frontmost of process "' + target_proc + '" to true\n\
    end tell\n\
  end if\n\
end tell')[1].length > 0) {
    console.log('No valid application/process "' + target_proc + '"');
    app.quit();
  } else
    target_proc = get_activewin();

  setInterval(() => {
    if (get_activewin() != target_proc)
      app.quit();
  }, 1);

  main_win.on('closed', function() {
    require('fs').unlink(bg_loc);
    app.quit();
  }).on('focus', function() {
    require('fs').unlink(bg_loc);
    app.quit();
  });
});
