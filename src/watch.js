const debug = require('debug')('dominostatus:watch')
const { EventEmitter } = require('events')
const dominos = require('./')

module.exports = (users, state) => {
  const emitter = new EventEmitter()
  const queue = []

  emitter.state = Object.assign({
    interval: 1000 * 60 * 60, // Check every 10 minutes
    requestInterval: 1000 * 10, // Make a request every 10 seconds at most
    lastOrders: {}
  }, state)


  function check (user) {
    dominos.getOrders(user.country, user.phone)
      .asCallback((err, orders) => {
        const userId = `${user.country}:${user.phone}`
        const userText = user.name ? `${user.name} (${userId})` : userId
        if (err) return debug(`Error while fetching orders for ${userText}:`, err.toString())
        debug(`Orders for ${userText}:`, orders)
      })
      .each(order => {
        const lastKey = emitter.state.lastOrders[user.phone]

        if (!lastKey || order.OrderKey > lastKey) {
          emitter.state.lastOrders[user.phone] = order.OrderKey
          emitter.emit('order', order, user)
        }
      })
      .catch(err => emitter.emit('error', err, user))
  }

  function consume () {
    let id;

    const f = () => {
      const user = queue.shift()

      if (!user) {
        return clearInterval(id)
      }

      check(user)
    }

    id = setInterval(f, emitter.state.requestInterval)
    setImmediate(f)
  }

  users
    .map(user => () => {
      queue.push(user)

      if (queue.length === 1) {
        consume()
      }
    })
    .forEach(f => {
      setInterval(f, emitter.state.interval)
      setImmediate(f)
    })

  return emitter
}
