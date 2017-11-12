var CronJob = require('cron').CronJob;
var request = require('superagent')
const NotificationCenter = require('node-notifier/notifiers/notificationcenter');

var storesUrl = 'https://reserve-prime.apple.com/AU/en_AU/reserve/iPhoneX/stores.json';
var availabilityUrl = 'https://reserve-prime.apple.com/AU/en_AU/reserve/iPhoneX/availability.json';
var onlineReserveURL = 'https://reserve-prime.apple.com/AU/en_AU/reserve/iPhoneX/availability'

var updatedAt;

var stores;
var availabilityList;
var storeAvailabilityMapping = {};

new CronJob('* * * * * *', function() {
    console.log("Checking iPhone X stock in the AU stores...")

    if (!stores) {
        request.get(storesUrl).end(function (err, res) {
            if (err || !res.ok) {
                console.log(err)
            } else {
                stores = JSON.parse(res.text).stores;
            }
        });
    }

    request.get(availabilityUrl).end(function(err, res)  {
        if (err || !res.ok) {
            console.log(err)
        } else {
            var body = JSON.parse(res.text)
            availabilityList = body.stores;
            updatedAt = new Date(body.updated);
            checkStock(stores, availabilityList);
        }
    });

}, null, true);

function checkStock(stores, availabilityList) {
    var notifier = new NotificationCenter();
    if (stores && availabilityList) {
        for (var i in stores) {
            var store = stores[i];
            var storeName = store.storeName;
            var storeNumber = store.storeNumber;
            storeAvailabilityMapping[storeNumber] = storeName;
        }

        var stockFound = false;

        for (var storeNumber in availabilityList) {
            var stockEntry = availabilityList[storeNumber];
            var storeName = storeAvailabilityMapping[storeNumber];

            for (var s in stockEntry) {
                var availability = stockEntry[s].availability
                if (availability && (availability.unlocked || availability.contract)) {
                    stockFound = true;
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

        if (!stockFound) {
            console.log("No stock at all");
        }

        console.log("Last updated: " + updatedAt.getHours()+":"+updatedAt.getMinutes());
        console.log("___")
    }
}