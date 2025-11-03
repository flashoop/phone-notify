I want to implement a app to monitor API response field, and with a interval function to monitor the field status, if the field content changed, notifi moe with pushover api, to monitor the iphone stocks Available status.


1.generate config.yml with environment variables API address, interval time,and env file with pushover apikey and userkey , partNumber and store number, these parameter will combinate the api url

2.request the api 

https://www.apple.com/my/shop/fulfillment-messages?fae=true&pl=true&mts.0=regular&mts.1=compact&parts.0=MFYM4X/A&searchNearby=true&store=R742

and parse the reponse json, check the value of pickupSearchQuote , if the value is "Currently unavailable", that means the stock is unavailable. if the value is "Available Today", that means the stock is Available.

3.if stock is Available, with pushover api , send the notification

4.the function above execute every period again, with the config value to monitor the stock status
