const fs = require('fs')

module.exports = { outFile, codeConfig }

// 配置文档
function codeConfig () {
  return {
    config: getConfig(), // 独立配置
    index: { // 独立文档配置
      require: getRequire(),
      func: getFunc(),
      funcCall: getFuncCall(),
      beforeMount: getBeforeMount()
    }
  }
}

function getFuncCall () {
  return `
  // recvRts() // 启动mq队列接收
`
}

function getFunc () {
  return `

// 启动mq队列接收
async function recvRts (queueName = 'rtsApi') {
  if (!global.rtsMQ) {
    return
  }
  $.log(\`启动rts接收 queueName =\`, queueName)
  const ch = await global.rtsMQ.createConfirmChannel()
  await ch.assertQueue(queueName)
  ch.consume(queueName, myConsumer, { noAck: true })
}

// 接收mq队列数据并且增加到统计里
function myConsumer (recvObj) {
  if (recvObj && recvObj.content) {
    let obj = JSON.parse(recvObj.content.toString())
    global.rts.record(obj.key, obj.value, ['count', 'max', 'min', 'avg'])
  }
}

`
}

function getBeforeMount () {
  return `
  // 连接redisStack
  const redisStack = createRtsIoRedis(config.redisStack)
  await redisStack.waitForConnected()
  global.redisStack = redisStack
  // 启动 rts
  global.rts = require('./model/rts')({
    redis: redisStack,
    redisAsync: redisStack,
    gran: '5m, 1h, 1d, 1w, 1M, 1y',
    points: 1000,
    prefix: Pack.name
  })

  // 连接mq
  // global.rtsMQ = await createRtsMq(config.stackRabbitMQ)
`
}

function getRequire () {
  return `
const createRtsIoRedis = require('skybase/sky-module/create_ioredis')
// const createRtsMq = require('skybase/sky-module/create_amqplib')
`
}

function getConfig () {
  return `
  redisStack: {
    host: 'localhost',
    port: 6379,
    auth: '',
    db: 2
  },
  // stackRabbitMQ: {
  //   protocol: 'amqp',
  //   host: 'localhost',
  //   port: '5672'
  // },
`
}

async function outFile (destBaseDir = '.', srcBaseDir = `${__dirname}/node_modules/skybase-stat/`) {
  const obj = {
    router: { // 生成 router目录
      skyapi: { // 生成 router/skyapi 目录
        'stat.js': './router/skyapi/stat.js' // 生成 router/skyapi/stat.js 从 ./router/skyapi/stat.js 拷贝 相对路径
      }
    },
    service: {
      skyapi: {
        'stat.js': './service/skyapi/stat.js'
      }
    },
    model: {
      api: {
        skyapi: {
          'stat.js': './model/api/skyapi/stat.js'
        }
      },
      'htmlOut.js': './model/htmlOut.js',
      rts: {
        'index.js': './model/rts/index.js',
        lua: {
          'avg.lua': './model/rts/lua/avg.lua',
          'max.lua': './model/rts/lua/max.lua',
          'min.lua': './model/rts/lua/min.lua',
          'update_pf.lua': './model/rts/lua/update_pf.lua'
        },
        util: {
          'util.js': './model/rts/util/util.js'
        }
      }
    }
  }
  try {
    const isExist = fs.existsSync(srcBaseDir) // 判断目录是否存在
    if (!isExist) {
      console.error(srcBaseDir, '目录不存在！')
      return
    }

    await outPutFile(destBaseDir, '', obj, srcBaseDir)
  } catch (e) {
    console.error(e.stack)
  }
}

async function outPutFile (dir, key, obj, srcBaseDir) {
  if (typeof obj === 'string') {
    // console.log(`创建目录  ${dir}`)
    await fs.mkdirSync(dir, { recursive: true })
    // console.log(`原：${srcBaseDir}${obj}  目的：${dir}/${key}`)
    if (!await checkFileExist(`${srcBaseDir}${obj}`)) {
      console.error(`原文件不存在\t${srcBaseDir}${obj}`)
      return
    }
    await fs.copyFileSync(`${srcBaseDir}${obj}`, `${dir}/${key}`)
    return
  }
  for (const k in obj) {
    outPutFile(key === '' ? dir : `${dir}/${key}`, k, obj[k], srcBaseDir)
  }
}

async function checkFileExist (filePath) {
  try {
    await fs.accessSync(filePath, fs.constants.R_OK)
    return true
  } catch (e) { }
  return false
}
