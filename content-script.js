console.log = function() { };

const filterTypes = {
    Blur: 'Blur',
    Hide: 'Hide',
};
const params = {
    brands: [],
    models: [],
    type: 2,
    sortAfter: false,
};

const STORAGE_EXTENSION_ENABLED = 'sarisiteExtensionEnabled';
const STORAGE_FILTER_TYPE = 'sarisiteFilterType';
const STORAGE_FILTER_PROFILES = 'sarisiteFilterProfiles';
const STORAGE_SHOW_HIDDEN_MODELS = 'sarisiteShowHiddenModels';
const STORAGE_LAST_SELECTED_PROFILE_ID = 'sarisiteLastSelectedProfileId';
const DEFAULT_PROFILE_ID = 'default-profile';
const STYLE_ID = 'sarisite-filter-inline-style';

var storageObj = {};
storageObj[STORAGE_EXTENSION_ENABLED] = true;
storageObj[STORAGE_FILTER_TYPE] = filterTypes.Hide;
storageObj[STORAGE_FILTER_PROFILES] = [];
storageObj[STORAGE_SHOW_HIDDEN_MODELS] = true;
storageObj[STORAGE_LAST_SELECTED_PROFILE_ID] = DEFAULT_PROFILE_ID;

var editingProfileId = DEFAULT_PROFILE_ID;
var viewing = false;

var domInterval = null;
//var refreshDom = true;

function injectBaseStyles() {
    if (document.getElementById(STYLE_ID)) {
        return;
    }

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
        '#searchCategoryContainer ul li[data-categorybreadcrumbid],',
        '#searchCategoryContainer ul li.cl3 { margin-left: 0!important; position: relative; padding-left: 22px !important; min-height: 18px; }',
        '.sarisite-model-toggle {',
        '  position: absolute; left: 2px; top: 50%; transform: translateY(-50%);',
        '  width: 16px; height: 16px; line-height: 16px; text-align: center;',
        '  font-size: 12px; font-weight: bold; cursor: pointer; user-select: none;',
        '  border-radius: 2px; flex-shrink: 0;',
        '}',
        '.sarisite-model-toggle[data-enabled="true"] { color: #1b5e20; background: #e8f5e9; }',
        '.sarisite-model-toggle[data-enabled="false"] { color: #b71c1c; background: #ffebee; }',
        '.sarisite-master-bar {',
        '  font-size: 11px; padding: 4px 6px; margin-bottom: 4px;',
        '  background: #e8f4fd; border: 1px solid #90caf9; border-radius: 2px;',
        '}',
        '.sarisite-master-bar label { cursor: pointer; user-select: none; }',
        '.sarisite-hidden-models-bar {',
        '  font-size: 11px; padding: 4px 6px; margin-bottom: 4px;',
        '  background: #fff8e1; border: 1px solid #ffe082; border-radius: 2px;',
        '}',
        '.sarisite-hidden-models-bar label { cursor: pointer; user-select: none; }',
        '#searchCategoryContainer .jspContainer { height: auto !important; max-height: none !important; overflow: visible !important; }',
        '#searchCategoryContainer .jspPane { position: relative !important; top: 0 !important; left: 0 !important; width: 100% !important; height: auto !important; }',
        '#searchCategoryContainer .jspVerticalBar { display: none !important; }',
        '#searchCategoryContainer .jspPane > ul { padding-bottom: 20px !important; }',
        '#searchCategoryContainer.jspScrollable,',
        '#searchCategoryContainer.scroll-pane,',
        '#searchCategoryContainer.lazy-scroll { max-height: 260px; overflow-y: auto !important; overflow-x: hidden !important; }',
        '#searchCategoryContainer li[data-categorybreadcrumbid].sarisite-row-hidden,',
        '#searchCategoryContainer li.cl3.sarisite-row-hidden { display: none !important; }',
        '.sarisite-profiles-wrap { margin-bottom: 10px; padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }',
        '.sarisite-profiles-row { align-items: flex-start; gap: 8px; flex-wrap: wrap; }',
        '.sarisite-profiles-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; flex-shrink: 0; padding-top: 4px; }',
        '.sarisite-profiles-chips { margin-top:5px; display: flex; flex-wrap: wrap; gap: 6px; flex: 1; min-width: 0; }',
        '.sarisite-profile-chip { display: inline-flex; align-items: center; gap: 2px; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 2px 4px 2px 6px; font-size: 11px; }',
        '.sarisite-profile-chip button { border: none; background: transparent; cursor: pointer; padding: 2px 4px; border-radius: 4px; font-size: 11px; line-height: 1.2; }',
         
        '.sarisite-inlinemodels-row { margin-top:10px; align-items: flex-start; gap: 8px; flex-wrap: wrap; }',
        '.sarisite-inlinemodels-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; flex-shrink: 0; padding-top: 4px; }',
        '.sarisite-inlinemodels-chips { margin-top:5px; display: flex; flex-wrap: wrap; gap: 6px; flex: 1; min-width: 0; }',
        '.sarisite-inlinemodels-chip { display: inline-flex; align-items: center; gap: 2px; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 2px 4px 2px 6px; font-size: 11px; }',
        '.sarisite-inlinemodels-chip button { border: none; background: transparent; cursor: pointer; padding: 2px 4px; border-radius: 4px; font-size: 11px; line-height: 1.2; }',

        '.active { border: 2px solid #0d9488;}',
        '.sarisite-profile-load { color: #0f172a; font-weight: 600; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }',
        '.sarisite-profile-edit:hover { background: #e0f2fe; }',
        '.sarisite-profile-delete:hover, .sarisite-inlinemodels-delete:hover { background: #fee2e2; color: #b91c1c; }',
        '.sarisite-profiles-actions { margin-top: 8px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }',
        '.sarisite-profile-name-input { flex: 1; min-width: 100px; padding: 4px 8px; font-size: 12px; border: 1px solid #cbd5e1; border-radius: 4px; }',
        '.sarisite-profile-btn-new, .sarisite-profile-btn-commit, .sarisite-profile-btn-cancel { padding: 4px 10px; font-size: 11px; border-radius: 4px; cursor: pointer; border: 1px solid #94a3b8; background: #fff; }',
        '.sarisite-profile-btn-new, .sarisite-profile-btn-commit { background: #0d9488; color: #fff; border-color: #0d9488; }',
        '.sarisite-profile-edit-banner { margin-top: 6px; padding: 6px 8px; background: #ecfdf5; border: 1px solid #99f6e4; border-radius: 6px; font-size: 11px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }',
        '.sarisite-profile-import, .sarisite-profile-export { margin-left: 6px; cursor: pointer; border: none; background: transparent; font-size: 14px; }',
        '.sarisite-row-blurred { opacity: 0.3 !important; filter: blur(2px) !important; transition: all 0.2s; }',
        '.sarisite-row-blurred:hover { opacity: 0.5 !important; filter: blur(0px) !important; }',
        '.sarisite-inline-toggle {',
        '  display: inline-block; width: 14px; height: 14px; line-height: 14px; text-align: center;',
        '  font-size: 10px; font-weight: bold; cursor: pointer; user-select: none;',
        '  border-radius: 2px; margin-left: 5px; vertical-align: middle;',
        '}',
        '.sarisite-inline-toggle[data-enabled="true"] { color: #1b5e20; background: #e8f5e9; }',
        '.sarisite-inline-toggle[data-enabled="false"] { color: #b71c1c; background: #ffebee; }',
    ].join('\n');
    document.documentElement.appendChild(style);
}

function getDisabledModels() {    
    return currentProfile()?.disabledModels ?? [];   
}

function setDisabledModels(list) {
    var ctx = getPageCategoryContext();
    if (!ctx.categoryId) {
        window.alert('Kategori bilgisi bulunamadı. Önce marka/model sayfasında olun.');
        return;
    }

    var profile = currentProfile();     
    console.log('[sarisite] setDisabledModels: ', profile, editingProfileId, DEFAULT_PROFILE_ID);
    if(!profile && editingProfileId == DEFAULT_PROFILE_ID) {
        profile = {
            id: DEFAULT_PROFILE_ID,
            name: 'Default Profile',
            categoryId: ctx.categoryId,
            categoryName: ctx.categoryName,
            disabledModels: list,
            showHiddenModels: storageObj[STORAGE_SHOW_HIDDEN_MODELS],
        };
        storageObj[STORAGE_FILTER_PROFILES].push(profile);         
    }
    else {
        profile.disabledModels = list;
    }
}

function setFilterStateAndRefresh(disabledModels, showHidden, callback) {
    storageObj[STORAGE_SHOW_HIDDEN_MODELS] = showHidden;
    storageObj[STORAGE_LAST_SELECTED_PROFILE_ID] = editingProfileId ? editingProfileId : DEFAULT_PROFILE_ID; 
    setDisabledModels(disabledModels);

    var request = {};
    //request[STORAGE_FILTER_PROFILES] = storageObj[STORAGE_FILTER_PROFILES];
    //request[STORAGE_SHOW_HIDDEN_MODELS] = storageObj[STORAGE_SHOW_HIDDEN_MODELS];
    request[STORAGE_LAST_SELECTED_PROFILE_ID] = storageObj[STORAGE_LAST_SELECTED_PROFILE_ID];
    saveStorage(request, function () {
        if (typeof callback === 'function') {
            callback();
        }
    });
}

function getPageCategoryContext() {
    var cat = document.querySelector('#search_cats input[name="category"]');
    var catName = document.querySelector('#categoryName');
    return {
        categoryId: cat ? String(cat.value) : '',
        categoryName: catName ? String(catName.value || '') : '',
    };
}

function captureCurrentFilterState() {
    var disabledList = getDisabledModels();
    var ctx = getPageCategoryContext();
    return {
        disabledModels: disabledList,
        showHidden: storageObj[STORAGE_SHOW_HIDDEN_MODELS],
        categoryId: ctx.categoryId,
        categoryName: ctx.categoryName,
    };
}

function getStorage(callback) {
    chrome.storage.local.get([STORAGE_EXTENSION_ENABLED, STORAGE_FILTER_TYPE, STORAGE_FILTER_PROFILES, STORAGE_SHOW_HIDDEN_MODELS, STORAGE_LAST_SELECTED_PROFILE_ID], function (data) {
        var isExtensionEnabled = data[STORAGE_EXTENSION_ENABLED];
        if (isExtensionEnabled === undefined) {
            isExtensionEnabled = false;
        }
        storageObj[STORAGE_EXTENSION_ENABLED] = isExtensionEnabled;

        var filterType = data[STORAGE_FILTER_TYPE];
        if (filterType === undefined) {
            filterType = filterTypes.Hide;
        }
        storageObj[STORAGE_FILTER_TYPE] = filterType;

        var list = data[STORAGE_FILTER_PROFILES];
        if (!Array.isArray(list)) {
            list = [];
        }
        storageObj[STORAGE_FILTER_PROFILES] = list;

        var showHidden = data[STORAGE_SHOW_HIDDEN_MODELS];
        if (showHidden === undefined) {
            showHidden = true;
        }
        storageObj[STORAGE_SHOW_HIDDEN_MODELS] = showHidden;

        var lastSelectedProfileId = data[STORAGE_LAST_SELECTED_PROFILE_ID];
        if (lastSelectedProfileId) {
            if(currentProfile(lastSelectedProfileId)) {
                editingProfileId = lastSelectedProfileId;
            }
            viewing = true;
        }
        storageObj[STORAGE_LAST_SELECTED_PROFILE_ID] = editingProfileId;

        console.log('[sarisite] getStorage: ', storageObj[STORAGE_EXTENSION_ENABLED] 
                        , '|', storageObj[STORAGE_FILTER_TYPE]
                        , '|', storageObj[STORAGE_FILTER_PROFILES]
                        , '|', storageObj[STORAGE_SHOW_HIDDEN_MODELS]
                        , '|', storageObj[STORAGE_LAST_SELECTED_PROFILE_ID]
                    );

        callback();
    });
}

function saveStorage(obj, callback) {
    console.log('[sarisite] saveStorage: ', obj);
    chrome.storage.local.set(obj, callback);
}

function escapeHtml(s) {
    if (s == null || s === '') {
        return '';
    }
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function profilesForCurrentCategory(categoryId = null) {
    var ctx = getPageCategoryContext();
    categoryId ??= ctx.categoryId;
    return storageObj[STORAGE_FILTER_PROFILES].filter(function (p) { return p.categoryId === categoryId; });
}

function currentProfile(profileId = null) {
    profileId ??= editingProfileId;
    var categoryProfiles = profilesForCurrentCategory();
    return categoryProfiles.find(function (x) { return x.id === profileId; });
}

function renderProfilesBarChips(wrap) {
    var chipsEl = wrap.querySelector('.sarisite-profiles-chips');        
    if (!chipsEl) {
        return;
    }

    chipsEl.innerHTML = '';
    var banner = wrap.querySelector('.sarisite-profile-edit-banner');
    var editLabel = wrap.querySelector('.sarisite-edit-label');
    var categoryProfiles = profilesForCurrentCategory();
    categoryProfiles.forEach(function (p) {
        if(p.id == DEFAULT_PROFILE_ID) {
            return;
        }

        var chip = document.createElement('div');
        chip.className = 'sarisite-profile-chip' + (p.id == editingProfileId ? ' active' : '');
        // active varsa active yap.
        chip.setAttribute('data-id', p.id);
        
        var loadBtn = document.createElement('button');
        loadBtn.type = 'button';
        loadBtn.className = 'sarisite-profile-load';
        loadBtn.textContent = p.name || 'Adsız';
        loadBtn.title = 'Yükle: ' + (p.name || '');
        loadBtn.setAttribute('data-id', p.id);

        var editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'sarisite-profile-edit';
        editBtn.innerHTML = '&#9998;';
        editBtn.title = 'Düzenle';
        editBtn.setAttribute('data-id', p.id);

        var delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'sarisite-profile-delete';
        delBtn.textContent = '\u00D7';
        delBtn.title = 'Sil';
        delBtn.setAttribute('data-id', p.id);
        chip.appendChild(loadBtn);
        chip.appendChild(editBtn);
        chip.appendChild(delBtn);
        chipsEl.appendChild(chip);
    });
    if (categoryProfiles?.length > 0 && banner && editLabel && editingProfileId && editingProfileId != DEFAULT_PROFILE_ID) {
        var ep = categoryProfiles.find(function (x) { return x.id === editingProfileId; });
        banner.style.display = 'flex';
        editLabel.innerHTML = (!viewing ? 'Düzenleniyor' : 'Görüntüleniyor' )
                                + ': <strong class="sarisite-edit-name">' + (ep ? ep.name || '' : '') + '</strong>';
    }
    else {
        banner.style.display = 'none';
    }

    console.log('[sarisite] renderProfilesBarChips');
}

function renderDisabledInlineModelChips(wrap) {
    var chipsEl = wrap.querySelector('.sarisite-inlinemodels-chips');        
    if (!chipsEl) {
        return;
    }

    chipsEl.innerHTML = '';

    const rowEl = $('.sarisite-inlinemodels-row');
    if(!rowEl) {
        return;
    }
    
    // console.log('[sarisite] ', rowEl.is(':visible'));

    if(storageObj[STORAGE_FILTER_TYPE] == filterTypes.Blur) {
        if(rowEl.is(':visible')) {
            rowEl.hide();
        }
        return;
    }

    rowEl.show();

    const disabledModels = getDisabledModels().filter(x => x.isInline);
    // todo: isInline filtresi koyulacak.
    // todo: Mod Hide ise burasi olacak.
    disabledModels.forEach(function (x) {

        var chip = document.createElement('div');
        chip.className = 'sarisite-inlinemodels-chip';
        chip.setAttribute('data-id', x.id);

        var loadBtn = document.createElement('button');
        loadBtn.type = 'button';
        loadBtn.className = 'sarisite-inlinemodels-load';
        loadBtn.textContent = x.title;
        loadBtn.title = x.title;
        loadBtn.setAttribute('data-id', x.id);

        var delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'sarisite-inlinemodels-delete';
        delBtn.textContent = '\u00D7';
        delBtn.title = 'Sil';
        delBtn.setAttribute('data-id', x.id);
        delBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (!window.confirm('Bu kelimeyi filtreden kaldırmak istiyor musunuz?')) {
                return;
            }

            const id = e.target.getAttribute('data-id');
            const nextList = getDisabledModels().filter(function (x) { return x.id != id; });

            setDisabledModels(nextList); 
            const container = document.getElementById('searchCategoryContainer');
            decorateCategoryList(container); 
    
            if(editingProfileId == DEFAULT_PROFILE_ID) {
                var request = {};
                request[STORAGE_FILTER_PROFILES] = storageObj[STORAGE_FILTER_PROFILES];
                saveStorage(request);
            }

            console.log('[sarisite] inlinemodels-delete: ', id);
        });

        chip.appendChild(loadBtn);
        chip.appendChild(delBtn);
        chipsEl.appendChild(chip);
    });

    console.log('[sarisite] renderDisabledInlineModelChips: ', disabledModels);
}

function ensureProfilesBar() {
    injectBaseStyles();

    var left = document.querySelector('.search-left.standard-mode') || document.querySelector('.search-left');
    if (!left) {
        return;
    }

    var wrap = left.querySelector('.sarisite-profiles-wrap');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'sarisite-profiles-wrap';
        wrap.innerHTML =    '<div class="sarisite-profiles-row">' +
                                '<span class="sarisite-profiles-label">Profiller ' +
                                    '<button type="button" class="sarisite-profile-import" title="Import"> ⬇ </button>' +
                                    '<button type="button" class="sarisite-profile-export" title="Export"> ⬆ </button>' +
                                '</span>' +
                                '<div class="sarisite-profiles-chips"></div>' +
                            '</div>' +
                            '<div class="sarisite-profiles-actions">' +
                                '<input type="text" name="profile-name" class="sarisite-profile-name-input" placeholder="Profil adı" maxlength="80" />' +
                                '<button type="button" class="sarisite-profile-btn-new">Yeni kaydet</button>' +
                            '</div>' +
                            '<div class="sarisite-profile-edit-banner" style="display:none">' +
                                '<span class="sarisite-edit-label" style="display:block;width:100%;"></span>' +
                                '<button type="button" class="sarisite-profile-btn-commit">Kaydet</button>' +
                                '<button type="button" class="sarisite-profile-btn-cancel">İptal</button>' +
                            '</div>' +
                            '<div class="sarisite-inlinemodels-row">' +
                                '<span class="sarisite-inlinemodels-label">Kelime Filtreleri</span>' +
                                '<div class="sarisite-inlinemodels-chips"></div>' +
                            '</div>';
        left.insertBefore(wrap, left.firstChild);
        
        wrap.addEventListener('click', function (e) {
            var t = e.target;
            if (!t || !t.closest) {
                return;
            }

            var loadBtn = t.closest('.sarisite-profile-load');
            var editBtn = t.closest('.sarisite-profile-edit');
            var delBtn = t.closest('.sarisite-profile-delete');
            var nameInput = wrap.querySelector('.sarisite-profile-name-input');
            var id = (loadBtn || editBtn || delBtn) && (loadBtn || editBtn || delBtn).getAttribute('data-id');
            if (loadBtn && id) {
                e.preventDefault();
                editingProfileId = id;
                viewing = true;
    
                var p = storageObj[STORAGE_FILTER_PROFILES].find(function (x) { return x.id === id; });
                if (!p) {
                    return;
                }
    
                var dm = p.disabledModels || [];
                var sh = p.showHiddenModels !== false;
                setFilterStateAndRefresh(dm, sh, function () {
                    if (nameInput) {
                        nameInput.value = '';
                    }
                    RefreshDom();
                });
                return;
            }
            if (editBtn && id) {
                e.preventDefault();
                var p = storageObj[STORAGE_FILTER_PROFILES].find(function (x) { return x.id === id; });
                if (!p) {
                    return;
                }
    
                editingProfileId = id;
                viewing = false;
                var newButton = wrap.querySelector('.sarisite-profile-btn-new');
                if(newButton) {
                    newButton.style.display = 'none';
                } 
                if (nameInput) {
                    nameInput.value = p.name || '';
                    nameInput.focus();
                }

                var dm = p.disabledModels || [];
                var sh = p.showHiddenModels !== false;
                setFilterStateAndRefresh(dm, sh, function () {
                    RefreshDom();
                });
                return;
            }
            if (delBtn && id) {
                e.preventDefault();
                if (!window.confirm('Bu profili silmek istiyor musunuz?')) {
                    return;
                }
                storageObj[STORAGE_FILTER_PROFILES] = storageObj[STORAGE_FILTER_PROFILES].filter(function (x) { return x.id !== id; });
                if (editingProfileId === id) {
                    editingProfileId = DEFAULT_PROFILE_ID;
                }
                storageObj[STORAGE_LAST_SELECTED_PROFILE_ID] = editingProfileId;
                viewing = false;
    
                var request = {};
                request[STORAGE_FILTER_PROFILES] = storageObj[STORAGE_FILTER_PROFILES];
                request[STORAGE_LAST_SELECTED_PROFILE_ID] = storageObj[STORAGE_LAST_SELECTED_PROFILE_ID];
                saveStorage(request, function () {
                    RefreshDom();
                });
            }
        });
        wrap.querySelector('.sarisite-profile-btn-new').addEventListener('click', function () {
            var input = wrap.querySelector('.sarisite-profile-name-input');
            if (input) {
                input.focus();
            }
            var name = (input && input.value.trim()) || '';
            if (!name) {
                window.alert('Profil adı girin.');
                return;
            }
    
            var state = captureCurrentFilterState();
            if (!state.categoryId) {
                window.alert('Kategori bilgisi bulunamadı. Önce marka/model sayfasında olun.');
                return;
            }
    
            const check = storageObj[STORAGE_FILTER_PROFILES].find(x => x.name == name);
            if(check != null) {
                window.alert('Profil ismi zaten mevcut.');
                return;
            }
            storageObj[STORAGE_FILTER_PROFILES].push({
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 9),
                name: name,
                categoryId: state.categoryId,
                categoryName: state.categoryName,
                disabledModels: state.disabledModels,
                showHiddenModels: state.showHidden,
            });
            var request = {};
            request[STORAGE_FILTER_PROFILES] = storageObj[STORAGE_FILTER_PROFILES];
            saveStorage(request, function () {
                if (input) {
                    input.value = '';
                }
                ensureProfilesBar();
            });
        });
        wrap.querySelector('.sarisite-profile-btn-commit').addEventListener('click', function () {
            if (!editingProfileId) {
                return;
            }
            var nameInput = wrap.querySelector('.sarisite-profile-name-input');        
            if (nameInput) {
                nameInput.focus();
            }
            var newName = (nameInput && nameInput.value.trim()) || '';
            
            var p = storageObj[STORAGE_FILTER_PROFILES].find(function (x) { return x.id === editingProfileId; });
            if (!p) {
                editingProfileId = DEFAULT_PROFILE_ID;
                ensureProfilesBar();
                return;
            }
    
            if(newName) {
                const check = storageObj[STORAGE_FILTER_PROFILES].find(x => x.id != p.id && x.name == newName);
                if(check != null) {
                    window.alert('Profil ismi zaten mevcut.');
                    return;
                }
                p.name = newName;
            }
    
            var state = captureCurrentFilterState();
            p.disabledModels = state.disabledModels;
            p.showHiddenModels = state.showHidden;
            p.categoryId = state.categoryId;
            p.categoryName = state.categoryName;
    
            var request = {};
            request[STORAGE_FILTER_PROFILES] = storageObj[STORAGE_FILTER_PROFILES];
            saveStorage(request, function () {
                if(!viewing) {
                    editingProfileId = DEFAULT_PROFILE_ID;
                    if (nameInput) {
                        nameInput.value = '';
                    }
                    var newButton = wrap.querySelector('.sarisite-profile-btn-new');
                    if(newButton) {
                        newButton.style.display = 'block';
                    }
                }
    
                ensureProfilesBar();
            });
        });
        wrap.querySelector('.sarisite-profile-btn-cancel').addEventListener('click', function () {
            editingProfileId = DEFAULT_PROFILE_ID;
            var nameInput = wrap.querySelector('.sarisite-profile-name-input');
            if (nameInput) {
                nameInput.value = '';
                nameInput.focus();
            }
    
            var newButton = wrap.querySelector('.sarisite-profile-btn-new');
            if(newButton) {
                newButton.style.display = 'block';
            }
            storageObj[STORAGE_LAST_SELECTED_PROFILE_ID] = editingProfileId;
            
            var request = {};
            request[STORAGE_LAST_SELECTED_PROFILE_ID] = storageObj[STORAGE_LAST_SELECTED_PROFILE_ID];
            saveStorage(request, function () {
                RefreshDom();
            });
        });
    
        wrap.querySelector('.sarisite-profile-export').addEventListener('click', function () {
            if (!(storageObj[STORAGE_FILTER_PROFILES]?.length > 0)) {
                window.alert('Export edilecek profil yok.');
                return;
            }
    
            const dataStr = JSON.stringify(storageObj, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
    
            const now = new Date();
            const fileName = `sarisite_${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${
                now.getFullYear()}_${String(now.getHours()).padStart(2, '0')}-${
                    String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.json`;
    
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
    
            URL.revokeObjectURL(url);
        });
        wrap.querySelector('.sarisite-profile-import').addEventListener('click', function () {
            const inputFile = document.createElement('input');
            inputFile.type = 'file';
            inputFile.accept = 'application/json';
        
            inputFile.addEventListener('change', function (e) {
                const file = e.target.files[0];
                if (!file) return;
        
                const reader = new FileReader();
                reader.onload = function (evt) {
                    try {
                        storageObj = JSON.parse(evt.target.result);
                        if (!Array.isArray(storageObj[STORAGE_FILTER_PROFILES])) {
                            window.alert('Geçersiz dosya formatı.');
                            return;
                        }
    
                        saveStorage(storageObj, function () {
                            window.alert('İçe aktarıldı.');
                            RefreshDom();
                        });
                    } catch (err) {
                        window.alert('Dosya okunamadı.');
                    }
                };
        
                reader.readAsText(file);
            });
        
            inputFile.click();
        });
    
        console.log('[sarisite] [ensureProfilesBar] wrap ', wrap);
    }

    renderProfilesBarChips(wrap);
    renderDisabledInlineModelChips(wrap);
}

function disabledSet(list) {
    var set = {};
    for (var i = 0; i < list.length; i++) {
        set[list[i].title] = true;
    }
    return set;
}

function neutralizeJScrollPaneInner(container) {
    if (!container) {
        return;
    }

    var jsp = container.querySelector('.jspContainer');
    if (jsp) {
        jsp.style.setProperty('height', 'auto', 'important');
        jsp.style.setProperty('max-height', 'none', 'important');
        jsp.style.setProperty('overflow', 'visible', 'important');
    }

    var pane = container.querySelector('.jspPane');
    if (pane) {
        pane.style.setProperty('position', 'relative', 'important');
        pane.style.setProperty('top', '0', 'important');
        pane.style.setProperty('left', '0', 'important');
        pane.style.setProperty('height', 'auto', 'important');
        pane.style.setProperty('width', '100%', 'important');
    }

    var vbar = container.querySelector('.jspVerticalBar');
    if (vbar) {
        vbar.style.display = 'none';
    }
}

function getLiModelEntry(li) {
    var id = li.getAttribute('data-categorybreadcrumbid');
    var link = findCategoryLink(li);
    if (id == null || !link) {
        return null;
    }
    var title = (link.getAttribute('title') || '').trim();
    if (!title) {
        var h2 = link.querySelector('h2');
        title = h2 ? h2.textContent.trim() : '';
    }
    return { id: String(id), title: title };
}

function findModelListUl(container) {
    var lis = container.querySelectorAll('li[data-categorybreadcrumbid]');
    if (lis.length) {
        var ul = lis[0].closest('ul');
        if (ul) {
            return ul;
        }
    }
    var pane = container.querySelector('.jspPane') || container;
    return pane.querySelector('ul');
}

function ensureMasterBar(container) {
    var ul = findModelListUl(container);
    if (!ul) {
        return null;
    }

    var parent = ul.parentNode;
    var existing = parent.querySelector('.sarisite-master-bar');
    if (existing) {
        return existing;
    }

    var bar = document.createElement('div');
    bar.className = 'sarisite-master-bar';
    bar.innerHTML = '<label title="İşaretli: tüm modeller dahil (✓). İşaretsiz: tümü hariç (✕).">' +
                    '<input type="checkbox" class="sarisite-master-all-enabled" checked="checked"/> Hepsini aç / kapat</label>';
    parent.insertBefore(bar, ul);
    var mcb = bar.querySelector('.sarisite-master-all-enabled');
    if (mcb) {
        mcb.checked = true;
    }
    return bar;
}

/** Önce gizli modeller şeridi, hemen altında hepsini aç/kapat (ikisi de ul'dan önce). */
function ensureHiddenModelsBar(container) {
    var ul = findModelListUl(container);
    if (!ul) {
        return null;
    }

    var pane = ul.parentElement || container;
    var existing = pane.querySelector('.sarisite-hidden-models-bar');
    if (existing) {
        return existing;
    }
    var bar = document.createElement('div');
    bar.className = 'sarisite-hidden-models-bar';
    bar.innerHTML = '<label><input type="checkbox" class="sarisite-show-hidden-cb"/> Gizli modelleri göster</label>';
    ul.parentNode.insertBefore(bar, ul);
    return bar;
}

function syncHiddenBarVisibility(container) {
    var bar = container.querySelector('.sarisite-hidden-models-bar');
    if (!bar) {
        return;
    }
    bar.style.display = '';
}

/** Checkbox varsa onu; yoksa depodaki tercih (senkron bilinmiyorsa true). */
function isShowHiddenModelsEnabled(container) {
    var cb = container && container.querySelector('.sarisite-show-hidden-cb');
    if (!cb) {
        return true;
    }
    return cb.checked;
}

function applyRowHiddenState(li, title, disabledSet, showHidden) {
    if (disabledSet[title]) {
        if (showHidden) {
            li.classList.remove('sarisite-row-hidden');
        } else {
            li.classList.add('sarisite-row-hidden');
        }
    } else {
        li.classList.remove('sarisite-row-hidden');
    }
}

function updateToggleVisual(toggle, enabled) {
    toggle.setAttribute('data-enabled', enabled ? 'true' : 'false');
    toggle.textContent = enabled ? '\u2713' : '\u2715';
    toggle.setAttribute('title', enabled ? 'Dahil et (kara listede değil)' : 'Hariç tut (kara listeye al)');
}

function syncMasterCheckbox(container) {
    var masterCb = container.querySelector('.sarisite-master-all-enabled');
    if (!masterCb) {
        return;
    }

    var items = container.querySelectorAll('li[data-categorybreadcrumbid]');
    if (!items.length) {
        return;
    }

    var enabled = 0;
    for (var i = 0; i < items.length; i++) {
        var t = items[i].querySelector('.sarisite-model-toggle');
        if (t && t.getAttribute('data-enabled') === 'true') {
            enabled++;
        }
    }

    masterCb.indeterminate = enabled > 0 && enabled < items.length;
    masterCb.checked = enabled === items.length;
}

function wireMasterToggle(container) {
    var bar = container.querySelector('.sarisite-master-bar');
    if (!bar || bar.dataset.sarisiteMasterBound) {
        return;
    }
    bar.dataset.sarisiteMasterBound = '1';
    var cb = bar.querySelector('.sarisite-master-all-enabled');
    if (!cb) {
        return;
    }
    cb.addEventListener('change', function () {
        var wantAllEnabled = cb.checked;
        var items = container.querySelectorAll('li[data-categorybreadcrumbid]');
        if (!(items.length > 0)) {
            return;
        }

        if (wantAllEnabled) {
            setDisabledModels([]);
        } else {
            var nextList = [];
            items.forEach(function (li) {
                var entry = getLiModelEntry(li);
                if (entry) {
                    nextList.push(entry);
                }
            });
            setDisabledModels(nextList);
        }

        var request = {};
        request[STORAGE_FILTER_PROFILES] = storageObj[STORAGE_FILTER_PROFILES];
        saveStorage(request, function () {
            var container = document.getElementById('searchCategoryContainer');
            decorateCategoryList(container);       
        });
    });
}

function wireHiddenBarCheckbox(container) {
    var bar = ensureHiddenModelsBar(container);
    if (!bar) {
        return;
    }

    var cb = bar.querySelector('.sarisite-show-hidden-cb');
    if (!cb || cb.dataset.sarisiteBound) {
        return;
    }
    cb.dataset.sarisiteBound = '1';
    cb.addEventListener('change', function () {
        var show = cb.checked;
        storageObj[STORAGE_SHOW_HIDDEN_MODELS] = show;     

        var request = {};
        request[STORAGE_SHOW_HIDDEN_MODELS] = storageObj[STORAGE_SHOW_HIDDEN_MODELS];
        saveStorage(request, function () {  
            var list = getDisabledModels();
            var set = disabledSet(list);
            var lis = container.querySelectorAll('ul li[data-categorybreadcrumbid]');
            lis.forEach(function (li) {
                var id = li.getAttribute('data-categorybreadcrumbid');
                if (id == null) {
                    return;
                }
                //applyRowHiddenState(li, title, set, show); // todo: burdaki title nerde hocam.
            });
            RefreshDom();
        });
    });
}

function bindToggleClick(toggle, li, categoryId, title) {
    toggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var enabled = toggle.getAttribute('data-enabled') === 'true';
        var nextEnabled = !enabled;
        var list = getDisabledModels();
        var idStr = String(categoryId);
        title = title?.trim() || '';

        var nextList;
        if (nextEnabled) {
            nextList = list.filter(function (x) { return x.title != title; });
        } else {
            nextList = list.slice();
            var exists = nextList.some(function (x) { return x.title === title; });
            if (!exists) {
                nextList.push({ id: idStr, title: title });
            }
        }

        setDisabledModels(nextList);
        updateToggleVisual(toggle, nextEnabled);
        var container = document.getElementById('searchCategoryContainer');
        var set = disabledSet(nextList);
        var showHidden = isShowHiddenModelsEnabled(container);
        applyRowHiddenState(li, title, set, showHidden);
        syncHiddenBarVisibility(container);
        if (container) {
            syncMasterCheckbox(container);
        }
        mergeParamsAndFilter();

        if(editingProfileId == DEFAULT_PROFILE_ID) {
            var request = {};
            request[STORAGE_FILTER_PROFILES] = storageObj[STORAGE_FILTER_PROFILES];
            saveStorage(request);
        }
    });
}

function injectInlineToggle($el, text) {
    if (!$el.length || $el.find('.sarisite-inline-toggle').length) {
        var toggle = $el.find('.sarisite-inline-toggle');
        if (toggle.length) {
            var disabledList = getDisabledModels();
            var isIncluded = !disabledList.some(x => x.title == text);
            updateToggleVisual(toggle[0], isIncluded);
        }
        return;
    }

    var disabledList = getDisabledModels();
    var isIncluded = !disabledList.some(x => x.title == text);

    var toggle = $('<span class="sarisite-inline-toggle"></span>');
    updateToggleVisual(toggle[0], isIncluded);

    toggle.on('click', function(e) {
        console.log('[sarisite] injectInlineToggle: CLICK.');
        e.preventDefault();
        e.stopPropagation();
         
        var nextList = [];

        var currentList = getDisabledModels();
        var alreadyDisabled = currentList.some(x => x.title == text);
        if (alreadyDisabled) {
            nextList = currentList.filter(x => x.title != text);
        } else {
            nextList = currentList.slice();
            nextList.push({ 
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 9), 
                title: text, 
                isInline: true, 
            });
        }
 
        setDisabledModels(nextList); 
        var container = document.getElementById('searchCategoryContainer');
        decorateCategoryList(container); 

        if(editingProfileId == DEFAULT_PROFILE_ID) {
            var request = {};
            request[STORAGE_FILTER_PROFILES] = storageObj[STORAGE_FILTER_PROFILES];
            saveStorage(request);
        }
    });

    $el.append(toggle);
    //console.log('[sarisite] injectInlineToggle');
}

function findCategoryLink(li) {
    return (li.querySelector('a[href*="category"]') 
            || li.querySelector('a[href*="Category"]') 
            || li.querySelector('a[href*="flt"]') 
            || li.querySelector('a[href*="arama"]') 
            || li.querySelector('a')
    );
}

function decorateCategoryList(container) {    
    if (!container) {
        return;
    }

    injectBaseStyles();
    var items = container.querySelectorAll('li[data-categorybreadcrumbid]');
    if (!(items.length > 0)) {
        return;
    }

    var disabledList = getDisabledModels();
    var set = disabledSet(disabledList);
    ensureHiddenModelsBar(container);
    var hcb = container.querySelector('.sarisite-show-hidden-cb');
    if (hcb) {
        hcb.checked = storageObj[STORAGE_SHOW_HIDDEN_MODELS];
    }

    ensureMasterBar(container);
    
    items.forEach(function (li) {
        var id = li.getAttribute('data-categorybreadcrumbid');
        var link = findCategoryLink(li);
        if (id == null || !link) {
            return;
        }

        var title = (link.getAttribute('title') || '').trim();
        if (!title) {
            var h2 = link.querySelector('h2');
            title = h2 ? h2.textContent.trim() : '';
        }

        if (li.querySelector('.sarisite-model-toggle')) {
            var exToggle = li.querySelector('.sarisite-model-toggle');
            if (exToggle && title) {
                updateToggleVisual(exToggle, !set[title]);
                applyRowHiddenState(li, title, set, storageObj[STORAGE_SHOW_HIDDEN_MODELS]);
            }
            return;
        }

        var toggle = document.createElement('span');
        toggle.className = 'sarisite-model-toggle';
        toggle.setAttribute('role', 'button');
        toggle.tabIndex = 0;

        updateToggleVisual(toggle, !set[title]);
        bindToggleClick(toggle, li, id, title);
        toggle.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle.click();
            }
        });

        li.insertBefore(toggle, li.firstChild);
        applyRowHiddenState(li, title, set, storageObj[STORAGE_SHOW_HIDDEN_MODELS]);
    });

    syncHiddenBarVisibility(container);
    wireHiddenBarCheckbox(container);
    wireMasterToggle(container);
    syncMasterCheckbox(container);
    setTimeout(function () {
        neutralizeJScrollPaneInner(container);
    }, 350);
    mergeParamsAndFilter();
}

function mergeParamsAndFilter(callback) {
    var disabledList = getDisabledModels();
    var extra = disabledList.map(function (x) { return x.title; });
    params.brands = extra;
    params.models = extra;
    
    var result = FilterItems();
    if (typeof callback === 'function') {
        callback(result);
    }
}

function FilterItems() {
    var markaIndex = $("#searchResultsTable thead tr td:contains('Marka')").index();
    var modelIndex = $("#searchResultsTable thead tr td:contains('Model')").index();
    var baslikIndex = $("#searchResultsTable thead tr td:contains('İlan Başlığı')").index();
    var seriIndex = $("#searchResultsTable thead tr td:contains('Seri')").index();
    var marka = null;
    var baslik = null;
    var seri = null;
    var model = null;

    $('.searchResultsRowClass .searchResultsItem').each(function () {
        var checkMarka = null;
        var checkModel = null;
        
        var $row = $(this);
        var $markaCell = $row.find('td:eq(' + markaIndex + ')');
        var $modelCell = $row.find('td:eq(' + modelIndex + ')');
        var $baslikCell = $row.find('td:eq(' + baslikIndex + ')');

        if (baslikIndex > -1) {
            baslik = stripHtml($baslikCell.find('.classifiedTitle'));
        }
        if (markaIndex > -1) {
            marka = stripHtml($markaCell);
        }
        if (seriIndex > -1) {
            seri = stripHtml($row.find('td:eq(' + seriIndex + ')'));
        }
        if (modelIndex > -1) {
            model = stripHtml($modelCell);
        }

        if (marka) {
            checkMarka = params.brands?.find(function (x) { return marka == x; });
        }
        if (seri || model || baslik) {
            checkModel = params.models?.find(function (x) {
                return (seri?.includes(x) == true 
                    || model?.includes(x) == true 
                    || baslik?.includes(x) == true
                );
            });
        }

        var shouldBlur = false;
        if (params.type == 1) {
            if (checkMarka == null && checkModel == null) {
                shouldBlur = true;
            }
        } else if (params.type == 2) {
            if (checkMarka != null || checkModel != null) {
                shouldBlur = true;
            }
        }

        if (shouldBlur) {
            if(storageObj[STORAGE_FILTER_TYPE] == filterTypes.Hide) {
                $row.hide();
            }
            else if(!$row.hasClass('sarisite-row-blurred'))  {
                $row.addClass('sarisite-row-blurred');
            }
        } else {
            if(storageObj[STORAGE_FILTER_TYPE] == filterTypes.Hide) {
                $row.show();
            }
            else if($row.hasClass('sarisite-row-blurred')) {
                $row.removeClass('sarisite-row-blurred');
            }
        }

        // Inject Inline Toggles
        if (markaIndex > -1) injectInlineToggle($markaCell, marka);
        if (modelIndex > -1) injectInlineToggle($modelCell, model);
        if (baslikIndex > -1) injectInlineToggle($baslikCell.find('.classifiedTitle'), baslik);
    });

    console.log('[sarisite] FilterItems');

    if(storageObj[STORAGE_FILTER_TYPE] == filterTypes.Blur && params.sortAfter) 
    {
        sortRowsByBlur();
    }

    //refreshDom = false;

    return { status: true, message: 'Filtreleme işlemi başarılı.' };
}

function sortRowsByBlur() {
    var $tbody = $('#searchResultsTable tbody');
    var $rows = $tbody.children('.searchResultsItem');
  
    var isAlreadySorted = true;
  
    let seenBlur = false;
  
    $rows.each(function () {
      const isBlur = $(this).hasClass('sarisite-row-blurred');
  
      if (isBlur) {
        seenBlur = true;
      }

      if (!isBlur && seenBlur) {
        isAlreadySorted = false;
        return false;
      }
    });
  
    if (isAlreadySorted) {
        return;
    }

    var rows = $rows.get(); 
    rows.sort(function (a, b) {
      var aBlur = $(a).hasClass('sarisite-row-blurred') ? 1 : 0;
      var bBlur = $(b).hasClass('sarisite-row-blurred') ? 1 : 0;
      return aBlur - bBlur;
    });
  
    $tbody.append(rows);

    console.log('[sarisite] sortRowsByBlur');
}

function stripHtml(elem) {
    const td = elem.clone();
    td.find('span').remove();
    return td.text()?.trim();
}

$(document).ready(function () {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log("[sarisite] Message from content script:", request);  
        if (request?.key === "isEnabled") {
            storageObj[STORAGE_EXTENSION_ENABLED] = request.value; 
            if(storageObj[STORAGE_EXTENSION_ENABLED]) {  
                domInterval = null;   
                HandleChanges();
            } else {
                window.location.reload(true);
            }
        }
        else if (request?.key === "filterType") {
            storageObj[STORAGE_FILTER_TYPE] = request.value; 

            $('.searchResultsRowClass .searchResultsItem').show();
            $('.searchResultsRowClass .searchResultsItem').removeClass('sarisite-row-blurred');
            RefreshDom();
        }
        return true;
    });
    getStorage();
    HandleChanges(); // 500 mste bir calisacak UI guncelleyecek.
    //RegisterHandlers();
});

function HandleChanges() {
    if(domInterval) {
        return;
    }

    console.log('[sarisite] HandleChanges');

    domInterval = setInterval(function () {   
        if(!storageObj[STORAGE_EXTENSION_ENABLED]) {
            clearInterval(domInterval);
            return;
        } 

        // console.log('[sarisite] domInterval => refreshDom', refreshDom);
        // if(!refreshDom) {
        //     return;
        // }

        RefreshDom();
    }, 1500);
}

function RefreshDom() {        
    var container = document.getElementById('searchCategoryContainer');
    if (!container) {
        return;
    }

    ensureProfilesBar();
    decorateCategoryList(container);
}

// function RegisterHandlers() {
//     var events = ['.pageNaviButtons li', '.paging-size', '.faceted-sort-buttons a', '.sort-size-menu a', '#searchResultsTable thead a', '.searchResultsTable thead a'];
//     events.forEach(function(selector) {
//         $(document).off('click', selector).on('click', selector, function () {
//            console.log('[sarisite] [RegisterHandlers] CLICKED', selector);
//            setTimeout(() => {
//             refreshDom = true;
//            }, 2000);
//         });
//     });
// }
