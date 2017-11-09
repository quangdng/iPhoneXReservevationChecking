var https = require('https');
var Notification = require('node-notifier');
var CronJob = require('cron').CronJob;
var request = require('superagent')
const NotificationCenter = require('node-notifier/notifiers/notificationcenter');

var storesUrl = 'https://reserve-prime.apple.com/AU/en_AU/reserve/iPhoneX/stores.json';
var stockUrl = 'https://reserve-prime.apple.com/AU/en_AU/reserve/iPhoneX/availability.json';
var onlineReserveURL = 'https://reserve-prime.apple.com/AU/en_AU/reserve/iPhoneX/availability?channel=1'

var stockLastUpdated;

var stores;
var stock;
var storeNameMap = {};

new CronJob('*/5 * * * * *', function() {
    console.log("Checking iPhone X stock in the AU stores...")

    if (!stores) {
        request.get(storesUrl).end(function (err, res) {
            if (err || !res.ok) {
                console.log("Got error for URL " + storesUrl + " : ", err);
            } else {
                stores = JSON.parse(res.text).stores;
            }
        });
    }

    request.get(stockUrl).end(function(err, res)  {
        if (err || !res.ok) {
            console.log("Got error for URL "+stockUrl+" : ", err);
        } else {
            var body = JSON.parse(res.text)
            stock = body.stores;
            console.log(body.updated)
            stockLastUpdated = new Date(body.updated);
            delete stock.updated;
            listAvailableStock();
        }
    });

}, null, true);

function listAvailableStock() {
    var notifier = new NotificationCenter();
    if (stores != null && stock != null) {
        for (var i in stores) {
            var store = stores[i];
            var storeName = store.storeName;
            var storeNumber = store.storeNumber;
            storeNameMap[storeNumber] = storeName;
        }

        var foundStock = false;

        for (var storeNumber in stock) {
            var stockEntry = stock[storeNumber];
            var storeName = storeNameMap[storeNumber];

            for (var s in stockEntry) {
                var availability = stockEntry[s].availability
                if (availability && availability.unlocked) {
                    foundStock = true;
                    console.log(storeName + " has stock!");
                    notifier.notify({
                        title: 'Found!',
                        message: storeName + " has stock!",
                        open: onlineReserveURL
                    });
                    break;
                }
            }
        }

        if (!foundStock) {
            console.log("No stock at all");
        }

        // console.log("");
        // console.log(`Go to ${stockUrl} for more info`);
        // console.log("");
        console.log("Last updated: " + stockLastUpdated.getHours()+":"+stockLastUpdated.getMinutes());
        console.log("___")
    }
}