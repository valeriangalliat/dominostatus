const Promise = require('bluebird')
const R = require('ramda')
const request = require('request-promise')
const parseXml = Promise.promisify(require('xml2js').parseString)

const urls = {
  us: 'https://order.dominos.com/orderstorage/GetTrackerData',
  ca: 'https://order.dominos.ca/orderstorage/GetTrackerData'
}

exports.getOrders = (country, phone) =>
  request({
    url: urls[country],
    qs: { Phone: phone }
  })
    .then(parseXml)
    .then(R.path(['soap:Envelope', 'soap:Body', 0, 'GetTrackerDataResponse', 0, 'OrderStatuses', 0, 'OrderStatus']))
    .then(R.defaultTo([]))
    .map(R.map(R.head))
