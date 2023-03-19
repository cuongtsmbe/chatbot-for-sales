const handleFacebook = require("./handleFacebook");
require('dotenv').config();

const VERIFY_TOKEN_FACEBOOK = process.env.VERIFY_TOKEN_FACEBOOK;

module.exports = {
    getWebHook:(req, res) => {
        console.log("\nGET - webhook");
        // Parse the query params
          let mode = req.query["hub.mode"];
          let token = req.query["hub.verify_token"];
          let challenge = req.query["hub.challenge"];
          // Check if a token and mode is in the query string of the request
          if (mode && token) {
            // Check the mode and token sent is correct
            if (mode === "subscribe" && token === VERIFY_TOKEN_FACEBOOK) {
              // Respond with the challenge token from the request
              console.log("WEBHOOK_VERIFIED");
              return res.status(200).send(challenge);
            } else {
              // Respond with '403 Forbidden' if verify tokens do not match
              return res.sendStatus(403);
            }
          }
        
          return res.sendStatus(404);
    },
    postWebHook:(req, res) => {  
        console.log("\nPOST - webhook");
        // Parse the request body from the POST
        let body = req.body;
      
        // Check the webhook event is from a Page subscription
        if (body.object === 'page') {
      
          // Iterate over each entry - there may be multiple if batched
          // handle in message - messenger or postback
          body.entry.forEach(function(entry) {
    
            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            //console.log(webhook_event);
          
            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
          
            // Check if the event is a message 
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleFacebook.handleMessage(sender_psid, webhook_event);        
            }
            
          });
      
          // Return a '200 OK' response to all events
          res.status(200).send('EVENT_RECEIVED');
      
        } else {
          // Return a '404 Not Found' if event is not from a page subscription
          res.sendStatus(404);
        }
      
    }
}