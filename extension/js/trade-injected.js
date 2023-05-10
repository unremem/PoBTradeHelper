let itemByDataId = {}
let enabled = document.currentScript.getAttribute('enabled') == 'true'

/**
 * Ask pob for the item impact
 * Won't return the impact, it is handled in onMessage
 * @param {Node} node - The item node
 */
function askItemImpact(node) {
  let text = node.getElementsByClassName('copy')[0]._v_clipboard.text()
  let dataId = node.getAttribute('data-id')
  // Create div to contain item impact
  let itemImpact = document.createElement('div')
  itemImpact.className = 'item_impact'
  node.getElementsByClassName('right')[0].appendChild(itemImpact)

  itemByDataId[dataId] = [node, itemImpact]
  window.postMessage({ message: "get_item_impact", item: btoa(text), dataId: dataId })
}

/**
 * Observe change made to the DOM
 * Especially when items and mods are added
 */
let observer = new MutationObserver((mutationsList, observer) => {
  for (let mutation of mutationsList) {
    for (let node of mutation.addedNodes) {
      if (node.className == 'row') { // An item has been added to the DOM
        if (enabled) {
          askItemImpact(node)
        } else { // Not enabled, propose a link to get stats
          let button = document.createElement('button')
          button.className = 'pte-button trade-button'
          button.innerText = 'Compute the impact of the item'
          button.addEventListener('click', () => {
            node.getElementsByClassName('right')[0].removeChild(button)
            askItemImpact(node)
          })
          node.getElementsByClassName('right')[0].appendChild(button)
        }
      }
    }
  }
})

window.addEventListener('message', e => {
  if (e.data.message == 'set_item_impact') {
    let itemImpact = itemByDataId[e.data.dataId][1]
    itemImpact.innerHTML = e.data.itemImpact
  } else if (e.data.message == 'toggle') {
    enabled = e.data.enabled
  }
}, false)

observer.observe(document.body, {
  attributes: false,
  childList: true,
  subtree: true
})
