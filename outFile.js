const fs = require('fs')

module.exports = async (destBaseDir = '.', srcBaseDir = `${__dirname}/node_modules/skybase-stat/`) => {
  let obj = {
    'router': {
      'skyapi': {
        'stat.js': './router/skyapi/stat.js'
      }
    },
    'service': {
      'skyapi': {
        'stat.js': './service/skyapi/stat.js'
      }
    },
    'model': {
      'api': {
        'skyapi': {
          'stat.js': './model/api/skyapi/stat.js'
        }
      },
      'htmlOut.js': './model/htmlOut.js',
      'rts': {
        'index.js': './model/rts/index.js',
        'lua': {
          'avg.lua': './model/rts/lua/avg.lua',
          'max.lua': './model/rts/lua/max.lua',
          'min.lua': './model/rts/lua/min.lua',
          'update_pf.lua': './model/rts/lua/update_pf.lua',
        },
        'util': {
          'util.js': './model/rts/util/util.js'
        }
      }
    }
  }
  try {
    let isExist = fs.existsSync(srcBaseDir) // 判断目录是否存在
    if (!isExist) {
      console.error(srcBaseDir, '目录不存在！')
      return
    }

    await outPutFile(destBaseDir, '', obj, srcBaseDir)
  } catch (e) {
    console.error(e.stack)
  }
}

async function outPutFile(dir, key, obj, srcBaseDir) {
  if (typeof obj == 'string') {
    // console.log(`创建目录  ${dir}`)
    await fs.mkdirSync(dir, { recursive: true })
    // console.log(`原：${srcBaseDir}${obj}  目的：${dir}/${key}`)
    if (!await checkFileExist(`${srcBaseDir}${obj}`)) {
      console.error(`原文件不存在\t${srcBaseDir}${obj}`)
      return
    }
    await fs.copyFileSync(`${srcBaseDir}${obj}`, `${dir}/${key}`);
    return
  }
  for (let k in obj) {
    outPutFile(key === '' ? dir : `${dir}/${key}`, k, obj[k], srcBaseDir)
  }
}

async function checkFileExist(filePath) {
  try {
    await fs.accessSync(filePath, fs.constants.R_OK)
    return true
  } catch (e) { }
  return false
}

