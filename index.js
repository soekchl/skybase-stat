const sky = require('skybase')
const Pack = require('./package.json')
const config = require('./config')
const createIoredis = require('skybase/sky-module/create_ioredis')
const createRbmq = require('skybase/sky-module/create_amqplib')

/* global $ */

config.beforeMount = async () => {
  // 连接redisStack
  const redisStack = createIoredis(config.redisStack)
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
  // global.rtsMQ = await createRbmq(config.stackRabbitMQ)
}

sky.start(config, async () => {
  $.log('项目成功启动')
  recvRts()
})

async function recvRts (queueName = 'rtsApi') {
  if (!global.rtsMQ) {
    return
  }
  $.log(`启动rts接收 queueName =`, queueName)
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
