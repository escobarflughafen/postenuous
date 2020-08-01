const fs = require('fs');
const { error } = require('console');

exports.chkdir = function chkdir(dir) {
  fs.mkdir(dir, (err) => {
    if (err) {
      console.log(err);
      return err;
    } else {
      return dir;
    }
  })
}

exports.rename = async function rename(from, dest) {
  fs.exists(from, (exists) => {
    if (exists && dest != '') {
      var counter = 1;
      var destname = dest;
      var existed = fs.existsSync(destname);
      while (existed) {
        let destnameToHandle = dest.split('.')
        if (destnameToHandle.length == 1) {
          destname = destnameToHandle[0] + '_' + counter;
        } else {
          destnameToHandle[destnameToHandle.length - 2] += '_' + counter;
          destname = destnameToHandle.join('.');
        }
        counter++;
        existed = fs.existsSync(destname);
      }
      fs.renameSync(from, destname);
    } else {
      return console.error('file not exists');
    }
  });
}