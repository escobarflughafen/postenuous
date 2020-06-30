const fs = require('fs')

export config = JSON.parse(fs.readFileSync('config.json', 'utf-8'))
