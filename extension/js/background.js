var port = null

chrome.action.onClicked.addListener(tab => {
  chrome.tabs.create({ url: 'https://www.pathofexile.com/trade/search/League' })
})

function sendNativeMessage(message) {
  port.postMessage(message);
  console.log("Sent message: <b>" + JSON.stringify(message) + "</b>");
}

function onNativeMessage(message) {
  console.log("Received message: <b>" + JSON.stringify(message) + "</b>");
  switch (message.type) {
    case "ITEM_IMPACT": {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      });
    }
  }
}

function onDisconnected() {
  console.log("Failed to connect: " + chrome.runtime.lastError.message);
  port = null;
}

chrome.runtime.onMessage.addListener(message => {
  switch (message.text) {
    case "LOAD_POB": {
      var hostName = "com.google.chrome.example.echo";
      console.log("Connecting to native messaging host <b>" + hostName + "</b>")
      port = chrome.runtime.connectNative(hostName);
      port.onMessage.addListener(onNativeMessage);
      port.onDisconnect.addListener(onDisconnected);
      console.log("Connected: " + port + "</b>")

      setTimeout(function () {
        sendNativeMessage(message);
      }, 1000);

      break;
    }
    case "ITEM_IMPACT": {
      setTimeout(function () {
        sendNativeMessage(message);
      }, 5000);
      break;
    }
  }

})
