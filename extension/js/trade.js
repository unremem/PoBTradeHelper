{
  // Can't use synced storage for pob build code because they are too long
  const storage = /Chrome/.test(navigator.userAgent)
    ? chrome.storage.sync
    : browser.storage.local
  const manifest = /Chrome/.test(navigator.userAgent)
    ? chrome.runtime.getManifest()
    : browser.runtime.getManifest()
  let script = null
  let enabled = null // Whether the automatic impact computation is enabled or not

  let errorIcon = `<img src="${chrome.runtime.getURL('img/error-40.png')}">`

  /**
   * Handle communication
   */
  window.addEventListener('message', e => {
    if (e.data.message == 'message') {
      message(e.data.content, e.data.type, e.data.timeout, e.data.append)
    } else if (e.data.message == 'get_item_impact') {
      chrome.runtime.sendMessage(null, { type: e.data.message, item: e.data.item, dataId: e.data.dataId })
    }
  })

  chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
    console.log(data)
    switch (data.type) {
      case 'set_item_impact': {
        window.top.postMessage({
          message: 'set_item_impact',
          itemImpact: atob(data.impact),
          dataId: data.dataId
        }, '*')
        break;
      }
      case 'native_app_error': {
        message(data.error, 'error')
        break;
      }
      case 'pob_loaded': {
        message('Build link set, you need to perform a new search to update the values.', 'message', 5000)
        break;
      }
    }

    return true
  });

  /**
   * Enable/Disable the impact computation
   * @param {boolean} value - If it should be enabled or not
   */
  function toggle(value) {
    enabled = typeof value == 'boolean'
      ? value
      : !enabled

    window.top.postMessage({
      message: 'toggle',
      enabled: enabled
    })
  }

  /**
   * Build User Interface
   */
  let controlPanel = document.createElement('div')
  controlPanel.setAttribute('id', 'pte-control-panel')
  document.body.appendChild(controlPanel)

  let icon = `<img src="${chrome.runtime.getURL('img/icon-40.png')}">`
  let togglePanelButton = document.createElement('button')
  togglePanelButton.setAttribute('id', 'toggle-panel-button')
  togglePanelButton.className = 'pte-button'
  togglePanelButton.innerHTML = icon
  togglePanelButton.addEventListener('click', e => {
    controlPanel.classList.toggle('visible')
    togglePanelButton.classList.toggle('visible')
    togglePanelButton.innerHTML = controlPanel.classList.contains('visible')
      ? '&times;'
      : icon
  })
  document.body.appendChild(togglePanelButton)

  let panelTitle = document.createElement('div')
  panelTitle.setAttribute('id', 'panel-title')
  panelTitle.innerHTML = `${manifest.name}`
  controlPanel.appendChild(panelTitle)

  // Settings for POB
  let settings = document.createElement('section')
  settings.className = 'pte-section'
  let title = document.createElement('h1')
  title.className = 'pte-section-title'
  title.innerText = 'POB settings'
  settings.appendChild(title)

  // The switch to enable/disable the extension (memorize the state)
  let switchSection = document.createElement('div')
  let toggleSwitch = document.createElement('input')
  toggleSwitch.setAttribute('type', 'checkbox')
  toggleSwitch.className = 'switch'
  switchSection.appendChild(toggleSwitch)

  let toggleLabel = document.createElement('label')
  toggleLabel.innerText = 'Getting state...'
  switchSection.appendChild(toggleLabel)

  toggleSwitch.addEventListener('change', e => {
    toggleLabel.innerText = toggleSwitch.checked
      ? 'Enabled'
      : 'Disabled'
    storage.set({ enabled: toggleSwitch.checked })
    toggle(toggleSwitch.checked)
  })
  settings.appendChild(switchSection)

  // PoB link input
  let pobLinkInput = document.createElement('input')
  pobLinkInput.className = 'pte-input'
  pobLinkInput.setAttribute('placeholder', 'Path of POB on disk')
  settings.appendChild(pobLinkInput)

  let pobLinkButton = document.createElement('button')
  pobLinkButton.className = 'pte-button'
  pobLinkButton.innerHTML = 'Set PoB path'
  pobLinkButton.addEventListener('click', e => {
    storage.set({ build_path: pobLinkInput.value }, () => {
      setBuild(pobLinkInput.value)
    })
  })
  settings.appendChild(pobLinkButton)
  controlPanel.appendChild(settings)

  // Console
  let consoleSection = document.createElement('section')
  consoleSection.className = 'pte-section'
  title = document.createElement('h1')
  title.className = 'pte-section-title'
  title.innerText = 'Console'
  consoleSection.appendChild(title)
  controlPanel.appendChild(consoleSection)

  // Message
  let messageDiv = document.createElement('div')
  messageDiv.setAttribute('id', 'pte-message')
  consoleSection.appendChild(messageDiv)

  let messageTimeout = null
  function message(content, type = 'message', timeout = null, append = false) {
    clearTimeout(messageTimeout)

    messageDiv.className = type

    if (append) {
      if (messageDiv.innerHTML.length > 0) messageDiv.innerHTML += '<br>'
      messageDiv.innerHTML += content
    } else {
      messageDiv.innerHTML = content
    }

    if (type == 'error') {
      console.error(content)
      if (!controlPanel.classList.contains('visible')) togglePanelButton.innerHTML = errorIcon
    } else {
      console.log(content)
    }

    if (timeout != null) {
      messageTimeout = setTimeout(() => {
        messageDiv.className = ''
        messageDiv.innerHTML = ''
      }, timeout)
    }
  }

  // Footer
  let githubLogo = `<svg class="octicon octicon-mark-github v-align-middle" height="16" viewBox="0 0 16 16" version="1.1" width="16" aria-hidden="true"><path fill-rule="evenodd" fill="white" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>`

  let footer = document.createElement('div')
  let githubLink = document.createElement('a')
  githubLink.setAttribute('id', 'github-link')
  githubLink.setAttribute('target', '_blank')
  githubLink.setAttribute('href', 'https://github.com/unremem/PoBTradeHelper')
  githubLink.innerHTML = githubLogo + 'GitHub'
  footer.appendChild(githubLink)

  controlPanel.appendChild(footer)

  /**
    * Inject the script for listening to the items
    */
  function injectCode() {
    if (script != null) return
    script = document.createElement('script')
    script.setAttribute('type', 'text/javascript')
    script.setAttribute('src', chrome.runtime.getURL('js/trade-injected.js'))
    script.setAttribute('enabled', enabled)
    document.body.appendChild(script)
  }

  /**
   * Set The build
   * @param {String} build_path - path to local installed POB
   */
  function setBuild(build_path) {
    chrome.runtime.sendMessage(null, { type: "load_pob", path: btoa(build_path) })
    message('Initializing headless PoB. Please wait.', 'message')
  }

  // initialize
  storage.get(['build_path', 'enabled'], res => {
    if (res.build_path) {
      pobLinkInput.value = res.build_path
      setBuild(res.build_path)
    }

    enabled = typeof res.enabled == 'undefined' || res.enabled
    toggleSwitch.checked = enabled
    toggleLabel.innerText = enabled
      ? 'Enabled'
      : 'Disabled'

    injectCode()
  })
}
