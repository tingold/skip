// Saves options to chrome.storage
function save_options() {
  var clientid = document.getElementById('clientid').value;
  var ak = document.getElementById('apikey').value;
  chrome.storage.sync.set({
    apikey: ak,
    cid: clientid
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 1000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get(
    ['apikey','cid'], function(items) {
    document.getElementById('clientid').value = items.cid;
    document.getElementById('apikey').value = items.apikey;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);