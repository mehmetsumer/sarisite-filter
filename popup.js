var willBeRemoved = [];

let selectedBrands = TryParseObj(localStorage.getItem('selectedBrands'));

let allBrands = TryParseObj(localStorage.getItem('allBrands'));
if(allBrands) {
    FillBrands();
}

let models = TryParseObj(localStorage.getItem('models')) ?? [];
if(models) { 
    FillModels();
}

$(document).ready(function() {
    var input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => { 
        var file = e.target.files[0]; 

        var reader = new FileReader();
        reader.readAsText(file,'UTF-8');

        reader.onload = readerEvent => {
            const resultObj = TryParseObj(readerEvent.target.result);
            if(resultObj) {
                selectedBrands = resultObj.selectedBrands;
                models = resultObj.models;
                allBrands = resultObj.allBrands;
                localStorage.setItem('selectedBrands', JSON.stringify(selectedBrands));
                localStorage.setItem('models', JSON.stringify(models));
                localStorage.setItem('allBrands', JSON.stringify(allBrands));
                FillBrands();
                FillModels();
            }          
        };
    };

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { requestType: 'updateBrands' }, function(response) {
            CustomAlert(response.message);
            if(response.status) {
                if(response.brands?.length > 0) {
                    allBrands = response.brands.map((x) => ({ name: x, checked: selectedBrands?.includes(x) == true }));
                    localStorage.setItem('allBrands', JSON.stringify(allBrands));
                    FillBrands();
                }                   
            }
        });
    });

    $(document).on('click', '#addModel', function(e) {
        const text = $('#tbModel').val()?.trim();
        if(!(text?.length > 0)) {
            return;
        }

        const check = models.find(x=> x.toLowerCase().trim() == text.toLowerCase());
        if(check) {
            $('#tbModel').val('');
            return;
        }
      
        $("#slModels").append('<option value="'+ text +'">'+ text +'</option>');
        models.push(text);
        localStorage.setItem('models', JSON.stringify(models));
        $('#tbModel').val('');
    }); 
    $(document).on('click', '#removeModel', function(e){
        const selectedVal = $("#slModels").val();
        if(selectedVal == 0) {
            return;
        }
        
        $('#slModels option[value="'+selectedVal+'"]').remove();
        models = models.filter(x=> x != selectedVal);
        localStorage.setItem('models', JSON.stringify(models));

        $('#slModels option:eq(1)').attr('selected', 'selected');
    });

    $(document).on('click', '#btBackup', function(e) {
        // selectedBrands
        // allBrands
        // models
        const backUpObj = {
            date: Date.now(),
            selectedBrands: selectedBrands,
            allBrands: allBrands,
            models: models
        };

        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backUpObj));
        var dlAnchorElem = document.getElementById('downloadAnchorElem');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "sf_backup_" + backUpObj.date + ".json");
        dlAnchorElem.click();
    });

    $(document).on('click', '#btRestore', function(e) {
        input.click();
    });

    $(document).on('click', '#btFilter', function(e) {
        selectedBrands = $.map($("[name='cbBrand']:checked"), function(n, i) {
            return $(n).val();
        });
        localStorage.setItem('selectedBrands', JSON.stringify(selectedBrands));

        allBrands.forEach(function(item, index, arr) {
            item.checked = selectedBrands.includes(item.name);
        });
        localStorage.setItem('allBrands', JSON.stringify(allBrands));

        const filterType = $('input[name="list_type"]:checked').val();
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { requestType: 'filter', type: filterType, brands: selectedBrands, models: models }, function(response) {
                console.log('response: ', response);
                CustomAlert(response.message);
                if(response.status) {
                     
                }
            });
        });
    });

    $(document).on('change', '#cbSelectAllBrands', function(e) {
        if(this.checked) {
            $('input[name="cbBrand"]').prop('checked', 'checked');
        } 
        else {
            $('input[name="cbBrand"]').prop('checked', false);
        }
    })
});

function CustomAlert(message, time=2, color='black') {
    $("#spAlert").html(message);
    setTimeout(function(){
        $("#spAlert").html('');
    }, time * 1000);
}

function FillBrands() {
    let brandsHtml = '';
    for(let i = 0; i < allBrands?.length; i++) {
        brandsHtml += `<div class="brandRow">
                        <input ${allBrands[i].checked == true ? "checked" : ""} type="checkbox" 
                            id="cbBrand_${allBrands[i].name}" name="cbBrand" value="${allBrands[i].name}">
                        <label for="cbBrand_${allBrands[i].name}">${allBrands[i].name}</label>
                    </div>`;
    }
    $('#divBrands').html(brandsHtml);
}

function FillModels() {
    $("#slModels").html('<option value="0">Seçiniz...</option>');
    for(let i= 0; i < models?.length; i++) {
        $("#slModels").append('<option value="'+ models[i] +'">'+ models[i] +'</option>');
    }
}

function TryParseObj(objString) {
    try {
        return JSON.parse(objString);
    } 
    catch(ex) {
        return false;
    }
}
