var brandsList = [];
var willBeRemoved = [];
var params = {
    brands: [],
    models: [],
    type: 2,
};

function FilterItems() {
    willBeRemoved = [];
    let baslikIndex = $("#searchResultsTable thead tr td:contains('İlan Başlığı')").index();
    let markaIndex = $("#searchResultsTable thead tr td:contains('Marka')").index();
    let seriIndex = $("#searchResultsTable thead tr td:contains('Seri')").index();
    let modelIndex = $("#searchResultsTable thead tr td:contains('Model')").index();
    let marka = null;
    let baslik = null;
    let seri = null;
    let model = null;
    $('.searchResultsRowClass .searchResultsItem').each(function(index) {
        let checkBaslik = null;
        let checkMarka = null;
        let checkModel = null;
        if(baslikIndex > -1) {	
            baslik = $(this).find('td:eq('+baslikIndex+') .classifiedTitle')?.html()?.toLocaleLowerCase("tr")?.trim();
        }
        if(markaIndex > -1) {	
            marka = $(this).find('td:eq('+markaIndex+')')?.html()?.toLocaleLowerCase("tr")?.trim();
        }
        if(seriIndex > -1) {	
            seri = $(this).find('td:eq('+seriIndex+')')?.html()?.toLocaleLowerCase("tr")?.trim();
        }
        model = $(this).find('td:eq('+modelIndex+')')?.html()?.toLocaleLowerCase("tr")?.trim();
        
        if(marka) {
            checkMarka = params.brands?.find(x=> marka == x.toLocaleLowerCase("tr"));
        } 
        if(seri || model || baslik) {
            checkModel = params.models?.find(x=> seri?.includes(x.toLocaleLowerCase("tr")) == true 
                                                || model?.includes(x.toLocaleLowerCase("tr")) == true
                                                || baslik?.includes(x.toLocaleLowerCase("tr")) == true);    
        } 
        
        if(params.type == 1) {
            if(checkMarka == null && checkModel == null) {
                willBeRemoved.push($(this));    
            }
        }
        else if(params.type == 2) {
            if(checkMarka != null || checkModel != null) {
                willBeRemoved.push($(this));
            }
        }    
    });
    
    $('.searchResultsRowClass .searchResultsItem').show();
    for(let i = 0; i < willBeRemoved.length; i++) {
        willBeRemoved[i].hide();
    }
    
    return { status: true, message: 'Filtreleme işlemi başarılı.' };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    RegisterHandlers();
    if(request.requestType == 'filter') {
        params = request;
        var response = FilterItems();
        sendResponse(response);
    }  
    else if(request.requestType == 'updateBrands') {
        sendResponse({ status: true, message:'Markalar güncellendi.', brands: brandsList });
    }
});

$(document).ready(function() {
    brandsList = $.map($('#searchCategoryContainer ul li a'), function(n, i) {
        return $(n).attr('title');
    }); 

    RegisterHandlers();
});

function RegisterHandlers() {
    console.log('click handlers are registered.');
    $(document).off('click', ".pageNaviButtons li");
    $(document).on('click', ".pageNaviButtons li", function () {
        setTimeout(FilterItems, 2000);
    });

    $(document).off('click', ".paging-size");
    $(document).on('click', ".paging-size", function () {
        setTimeout(FilterItems, 2000);
    });
}