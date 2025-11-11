---
title: Intercepting iOS Network Traffic on Mac
tags:
- wireshark
- sniffing
- recon
...
For the most part you are probably fine just using a solution like `mitmproxy` ([shown here](http://jasdev.me/intercepting-ios-traffic)) and sniffing HTTP/S traffic but sometimes there's a need to go deeper.. 

When testing an application you may notice something like an in-game chat server "not sending any requests" (w/ mitmproxy) when we are posting a new message to the server / getting messages from other players. Luckily for us we have some better tools to dig into all network activity on the device!

At some point Apple introduced a dev tool called `rvictl` (Remote Virtual Interface Tool) that allows us to create a seperate network interface for a connected device by providing its UDID. This allows us to use our favorite sniffing tool on the given device :D

## Find UDID 
Connect your device
Open up iTunes, select the device, and copy the UDID (might have to click on serial number to get to it)
## Create new interface

    rvictl -s YOUR_UDID

The command should SUCCEED and you will see your new interface (eg. `rvi0`)

## Sniff away
`tcpdump` or Wireshark away w/ the new interface and have fun with the extra requests on strange ports
:rocket:
