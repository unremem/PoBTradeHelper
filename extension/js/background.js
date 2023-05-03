var port = null
var pob_path = ""
var pob_loaded = false
var message_queue = []

chrome.action.onClicked.addListener(tab => {
  chrome.tabs.create({ url: 'https://www.pathofexile.com/trade/search/League' })

  return true;
})

function sendNativeMessage(message) {
  port.postMessage(message);
  console.log("Sent message: <b>" + JSON.stringify(message) + "</b>");
}

function onNativeMessage(message) {
  console.log("Received message: <b>" + JSON.stringify(message) + "</b>");
  switch (message.type) {
    case "set_item_impact": {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      });
      break;
    }
    case "host_started": {
      sendNativeMessage({ type: "load_pob", path: pob_path });
      break;
    }
    case "pob_loaded": {
      pob_loaded = true;
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      });

      // Clear the message queue
      message_queue.forEach(message => {
        sendNativeMessage(message);
      });
      message_queue = [];
      break;
    }
  }

  return true;
}

function onDisconnected() {
  const message = { type: "native_app_error", error: "Failed to connect: " + chrome.runtime.lastError.message }
  console.log(message.error);
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message);
  });
  port = null;
  pob_loaded = false;

  return true;
}

chrome.runtime.onMessage.addListener(message => {
  switch (message.type) {
    case "load_pob": {
      var hostName = "com.google.chrome.pob.tradehelper";
      console.log("Connecting to native messaging host <b>" + hostName + "</b>")
      pob_loaded = false;
      port = chrome.runtime.connectNative(hostName);
      port.onMessage.addListener(onNativeMessage);
      port.onDisconnect.addListener(onDisconnected);
      pob_path = message.path;
      console.log("Connected: " + port + "</b>")

      break;
    }
    case "get_item_impact": {
      if (pob_loaded) {
        sendNativeMessage(message);
      } else {
        message_queue.push(message);
      }
      break;
    }
  }

})
