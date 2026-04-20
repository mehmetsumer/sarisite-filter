const STORAGE_EXTENSION_ENABLED = 'sarisiteExtensionEnabled';

$(document).ready(function() {
    console.log('popup.js injected');

    chrome.storage.local.get([ STORAGE_EXTENSION_ENABLED ], function (data) {
        var isEnabled = data[STORAGE_EXTENSION_ENABLED];
        
        $('#extToggle').prop('checked', isEnabled);
    });

    $(document).on('change', '#extToggle', function(e) {
        const checked = this.checked;

        var request = {};
        request[STORAGE_EXTENSION_ENABLED] = checked;
        chrome.storage.local.set(request);

        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, 
                { 
                    type: 'setting', 
                    isEnabled: checked, 
                });
        });
    });
});
