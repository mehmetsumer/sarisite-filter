const filterTypes = {
    Blur: 'Blur',
    Hide: 'Hide',
};
const STORAGE_EXTENSION_ENABLED = 'sarisiteExtensionEnabled';
const STORAGE_FILTER_TYPE = 'sarisiteFilterType';

$(document).ready(function() {
    console.log('[sarisite] popup.js injected');

    chrome.storage.local.get([ STORAGE_EXTENSION_ENABLED, STORAGE_FILTER_TYPE ], function (data) {
        const isEnabled = data[STORAGE_EXTENSION_ENABLED];
        const filterType = data[STORAGE_FILTER_TYPE] || filterTypes.Hide;
        
        $('#extToggle').prop('checked', isEnabled);
        $(`input[name="filterType"][value="${filterType}"]`).prop('checked', true); 
    });

    $(document).on('change', '#extToggle', function(e) {
        const checked = this.checked;

        var request = {};
        request[STORAGE_EXTENSION_ENABLED] = checked;
        chrome.storage.local.set(request);

        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, 
                { 
                    key: 'isEnabled', 
                    value: checked, 
                });
        });
    });

    $(document).on('change', 'input[name="filterType"]', function () {
        const selected = $(this).val();
        console.log('[sarisite] selected: ', selected);

        var request = {};
        request[STORAGE_FILTER_TYPE] = selected;
        chrome.storage.local.set(request);
    
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                key: 'filterType',
                value: selected
            });
        });
    });
});
