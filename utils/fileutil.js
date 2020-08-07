const fs = require('fs');
const { error } = require('console');


exports.mkdir = (path) => {
  path = path.split(' ').join('');
  try {
    fs.mkdirSync(path, { recursive: true });
  } catch (err) {
    throw err;
  }
}

exports.mv = (from, dest) => {
  let exists = fs.existsSync(from)
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
    return destname;
  } else {
    console.error('file not exists');
    return false;
  }

}