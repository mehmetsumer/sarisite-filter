var brandsList = [];
var willBeRemoved = [];
/** Popup veya varsayılan kullanıcı ayarları; her filtrelemede depodaki devre dışı modellerle birleştirilir. */
var userParams = {
    brands: [],
    models: [],
    type: 2,
};
/** Geçerli çalışma kopyası (userParams + kara listedeki model başlıkları). */
var params = {
    brands: [],
    models: [],
    type: 2,
};

const STORAGE_FILTER_PROFILES = 'sarisiteFilterProfiles';
const STORAGE_SHOW_HIDDEN_MODELS = 'sarisiteShowHiddenModels';
const STORAGE_LAST_SELECTED_PROFILE_ID = 'sarisiteLastSelectedProfileId';
const DEFAULT_PROFILE_ID = 'default-profile';

var storageObj = {};
storageObj[STORAGE_FILTER_PROFILES] = [];
storageObj[STORAGE_SHOW_HIDDEN_MODELS] = true;
storageObj[STORAGE_LAST_SELECTED_PROFILE_ID] = DEFAULT_PROFILE_ID;

var editingProfileId = DEFAULT_PROFILE_ID;
var viewing = false;

var STYLE_ID = 'sarisite-filter-inline-style';
/** Aynı DOM düğümü için tekrar MutationObserver bağlanmasını önler. */
var observedCategoryRoots = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
var categorySidebarRefreshTimer = null;
var documentCategoryRefreshObserver = null;

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
        '.active { border: 2px solid #0d9488;}',
        '.sarisite-profile-load { color: #0f172a; font-weight: 600; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }',
        '.sarisite-profile-edit:hover { background: #e0f2fe; }',
        '.sarisite-profile-delete:hover { background: #fee2e2; color: #b91c1c; }',
        '.sarisite-profiles-actions { margin-top: 8px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }',
        '.sarisite-profile-name-input { flex: 1; min-width: 100px; padding: 4px 8px; font-size: 12px; border: 1px solid #cbd5e1; border-radius: 4px; }',
        '.sarisite-profile-btn-new, .sarisite-profile-btn-commit, .sarisite-profile-btn-cancel { padding: 4px 10px; font-size: 11px; border-radius: 4px; cursor: pointer; border: 1px solid #94a3b8; background: #fff; }',
        '.sarisite-profile-btn-new, .sarisite-profile-btn-commit { background: #0d9488; color: #fff; border-color: #0d9488; }',
        '.sarisite-profile-edit-banner { margin-top: 6px; padding: 6px 8px; background: #ecfdf5; border: 1px solid #99f6e4; border-radius: 6px; font-size: 11px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }',
        '.sarisite-profile-import, .sarisite-profile-export { margin-left: 6px; cursor: pointer; border: none; background: transparent; font-size: 14px; }',
    ].join('\n');
    document.documentElement.appendChild(style);
}

function getDisabledModels() {
    var ctx = getPageCategoryContext();
    if (!ctx.categoryId) {
        return [];
    }

    var categoryProfiles = profilesForCurrentCategory(ctx.categoryId);
    var profile = categoryProfiles.find(function (x) { return x.id === editingProfileId; });     
    return profile?.disabledModels ?? [];   
}

function setDisabledModels(list, callback, saveToStorage = true) {
    var ctx = getPageCategoryContext();
    if (!ctx.categoryId) {
        window.alert('Kategori bilgisi bulunamadı. Önce marka/model sayfasında olun.');
        return;
    }

    var categoryProfiles = profilesForCurrentCategory(ctx.categoryId);
    var profile = categoryProfiles.find(function (x) { return x.id === editingProfileId; });     
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
    
    if(saveToStorage) {
        saveStorage(callback); 
    } 
}

function setFilterStateAndRefresh(disabledModels, showHidden, callback) {
    storageObj[STORAGE_SHOW_HIDDEN_MODELS] = showHidden;
    storageObj[STORAGE_LAST_SELECTED_PROFILE_ID] = viewing && editingProfileId ? editingProfileId : DEFAULT_PROFILE_ID;
    
    setDisabledModels(disabledModels, function () {
        scheduleCategorySidebarRefresh();
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
    chrome.storage.local.get([STORAGE_FILTER_PROFILES, STORAGE_SHOW_HIDDEN_MODELS, STORAGE_LAST_SELECTED_PROFILE_ID], function (data) {
        var list = data[STORAGE_FILTER_PROFILES];
        if (!Array.isArray(list)) {
            list = [];
        }
        var showHidden = data[STORAGE_SHOW_HIDDEN_MODELS];
        if (showHidden === undefined) {
            showHidden = true;
        }
        var lastSelectedProfileId = data[STORAGE_LAST_SELECTED_PROFILE_ID];
        if (lastSelectedProfileId) {
            editingProfileId = lastSelectedProfileId;
            viewing = true;
        }

        storageObj[STORAGE_LAST_SELECTED_PROFILE_ID] = editingProfileId;
        storageObj[STORAGE_SHOW_HIDDEN_MODELS] = showHidden;
        storageObj[STORAGE_FILTER_PROFILES] = list;

        console.log('getStorage:', storageObj);
        callback();
    });
}

function saveStorage(callback) {
    console.log('saveStorage: ', storageObj);
    chrome.storage.local.set(storageObj, callback);
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

function profilesForCurrentCategory(categoryId) {
    var cid = String(categoryId || '');
    return storageObj[STORAGE_FILTER_PROFILES].filter(function (p) { return String(p.categoryId || '') === cid; });
}

function renderProfilesBarChips(wrap) {
    var chipsEl = wrap.querySelector('.sarisite-profiles-chips');        
    if (!chipsEl) {
        return;
    }
    chipsEl.innerHTML = '';
    var banner = wrap.querySelector('.sarisite-profile-edit-banner');
    var editLabel = wrap.querySelector('.sarisite-edit-label');
    var ctx = getPageCategoryContext();
    var categoryProfiles = profilesForCurrentCategory(ctx.categoryId);
    categoryProfiles.forEach(function (p) {
        if(p.id == DEFAULT_PROFILE_ID) {
            return;
        }

        var chip = document.createElement('div');
        chip.className = 'sarisite-profile-chip' + (p.id == editingProfileId ? ' active' : '');
        // active varsa active yap.
        chip.setAttribute('data-profile-id', p.id);
        
        var loadBtn = document.createElement('button');
        loadBtn.type = 'button';
        loadBtn.className = 'sarisite-profile-load';
        loadBtn.textContent = p.name || 'Adsız';
        loadBtn.title = 'Yükle: ' + (p.name || '');
        loadBtn.setAttribute('data-profile-id', p.id);

        var editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'sarisite-profile-edit';
        editBtn.innerHTML = '&#9998;';
        editBtn.title = 'Düzenle';
        editBtn.setAttribute('data-profile-id', p.id);

        var delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'sarisite-profile-delete';
        delBtn.textContent = '\u00D7';
        delBtn.title = 'Sil';
        delBtn.setAttribute('data-profile-id', p.id);
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
}

function wireProfilesBar(wrap) {
    wrap.addEventListener('click', function (e) {
        var t = e.target;
        if (!t || !t.closest) {
            return;
        }
        // var chip = t.closest('.sarisite-profile-chip');
        var loadBtn = t.closest('.sarisite-profile-load');
        var editBtn = t.closest('.sarisite-profile-edit');
        var delBtn = t.closest('.sarisite-profile-delete');
        var nameInput = wrap.querySelector('.sarisite-profile-name-input');
        var id = (loadBtn || editBtn || delBtn) && (loadBtn || editBtn || delBtn).getAttribute('data-profile-id');
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
                ensureProfilesBar();
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
                ensureProfilesBar();
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

            saveStorage(function () {
                ensureProfilesBar();
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
        saveStorage(function () {
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
        saveStorage(function () {
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

        saveStorage(function () {
            ensureProfilesBar();
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
            now.getFullYear()}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.json`;

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

                    saveStorage(function () {
                        window.alert('İçe aktarıldı.');
                        ensureProfilesBar();
                    });
                } catch (err) {
                    window.alert('Dosya okunamadı.');
                }
            };
    
            reader.readAsText(file);
        });
    
        inputFile.click();
    });
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
        wrap.innerHTML = '<div class="sarisite-profiles-row">' +
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
                        '</div>';
        left.insertBefore(wrap, left.firstChild);
        wireProfilesBar(wrap);
    }
    renderProfilesBarChips(wrap);
}

function disabledIdSet(list) {
    var set = {};
    for (var i = 0; i < list.length; i++) {
        set[String(list[i].id)] = true;
    }
    return set;
}

function neutralizeJScrollPaneInner(container) {
    if (!container) {
        return;
    }
    var jsp = container.querySelector('.jspContainer');
    var pane = container.querySelector('.jspPane');
    if (jsp) {
        jsp.style.setProperty('height', 'auto', 'important');
        jsp.style.setProperty('max-height', 'none', 'important');
        jsp.style.setProperty('overflow', 'visible', 'important');
    }
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
    bar.innerHTML =
        '<label title="İşaretli: tüm modeller dahil (✓). İşaretsiz: tümü hariç (✕).">' +
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

function applyRowHiddenState(li, idStr, disabledSet, showHidden) {
    if (disabledSet[idStr]) {
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
        if (!items.length) {
            return;
        }
        if (wantAllEnabled) {
            setDisabledModels([], function () {
                var cat = document.getElementById('searchCategoryContainer');
                if (cat) {
                    decorateCategoryList(cat);
                }
                mergeParamsAndFilter();
            });
        } else {
            var next = [];
            items.forEach(function (li) {
                var entry = getLiModelEntry(li);
                if (entry) {
                    next.push(entry);
                }
            });
            setDisabledModels(next, function () {
                var cat = document.getElementById('searchCategoryContainer');
                if (cat) {
                    decorateCategoryList(cat);
                }
                mergeParamsAndFilter();
            });
        }
    });
}

function wireHiddenBarCheckbox(container, disabledList) {
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
        saveStorage(function () {  
            var list = getDisabledModels();
            var set = disabledIdSet(list);
            var lis = container.querySelectorAll('ul li[data-categorybreadcrumbid]');
            lis.forEach(function (li) {
                var id = li.getAttribute('data-categorybreadcrumbid');
                if (id == null) {
                    return;
                }
                applyRowHiddenState(li, String(id), set, show);
            });
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
        var next;
        if (nextEnabled) {
            next = list.filter(function (x) {
                return String(x.id) !== idStr;
            });
        } else {
            next = list.slice();
            var exists = next.some(function (x) {
                return String(x.id) === idStr;
            });
            if (!exists) {
                next.push({ id: idStr, title: (title || '').trim() });
            }
        }

        setDisabledModels(next, function () {
            updateToggleVisual(toggle, nextEnabled);
            var container = document.getElementById('searchCategoryContainer');
            var set = disabledIdSet(next);
            var showHidden = isShowHiddenModelsEnabled(container);
            applyRowHiddenState(li, idStr, set, showHidden);
            syncHiddenBarVisibility(container);
            if (container) {
                syncMasterCheckbox(container);
            }
            mergeParamsAndFilter();
        }, editingProfileId == DEFAULT_PROFILE_ID);
    });
}

function findCategoryLink(li) {
    return (
        li.querySelector('a[href*="category"]') ||
        li.querySelector('a[href*="Category"]') ||
        li.querySelector('a[href*="flt"]') ||
        li.querySelector('a[href*="arama"]') ||
        li.querySelector('a')
    );
}

function decorateCategoryList(container) {
    injectBaseStyles();
    var items = container.querySelectorAll('li[data-categorybreadcrumbid]');
    if (!(items.length > 0)) {
        return;
    }

    var disabledList = getDisabledModels();
    var set = disabledIdSet(disabledList);
    ensureHiddenModelsBar(container);
    var hcb = container.querySelector('.sarisite-show-hidden-cb');
    if (hcb) {
        hcb.checked = storageObj[STORAGE_SHOW_HIDDEN_MODELS];
    }
    ensureMasterBar(container);
    items.forEach(function (li) {
        if (li.querySelector('.sarisite-model-toggle')) {
            var exToggle = li.querySelector('.sarisite-model-toggle');
            var exId = li.getAttribute('data-categorybreadcrumbid');
            if (exId != null) {
                var exOn = !set[String(exId)];
                updateToggleVisual(exToggle, exOn);
                applyRowHiddenState(li, String(exId), set, storageObj[STORAGE_SHOW_HIDDEN_MODELS]);
            }
            return;
        }

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

        var toggle = document.createElement('span');
        toggle.className = 'sarisite-model-toggle';
        toggle.setAttribute('role', 'button');
        toggle.tabIndex = 0;

        var on = !set[String(id)];
        updateToggleVisual(toggle, on);
        bindToggleClick(toggle, li, id, title);
        toggle.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle.click();
            }
        });

        li.insertBefore(toggle, li.firstChild);
        applyRowHiddenState(li, String(id), set, storageObj[STORAGE_SHOW_HIDDEN_MODELS]);
    });

    syncHiddenBarVisibility(container);
    wireHiddenBarCheckbox(container, disabledList);
    wireMasterToggle(container);
    syncMasterCheckbox(container);
    neutralizeJScrollPaneInner(container);
    setTimeout(function () {
        neutralizeJScrollPaneInner(container);
    }, 0);
    setTimeout(function () {
        neutralizeJScrollPaneInner(container);
    }, 350);
}

function mergeParamsAndFilter(callback) {
    var disabledList = getDisabledModels();
    var extra = disabledList.map(function (x) { return x.title; });
    params = {
        brands: userParams.brands.concat(extra),
        models: userParams.models.concat(extra),
        type: userParams.type,
    };
    //console.log(params);
    var result = FilterItems();
    if (typeof callback === 'function') {
        callback(result);
    }
}

function observeCategoryContainer(container) {
    if (!container) {
        return;
    }
    if (observedCategoryRoots) {
        if (observedCategoryRoots.has(container)) {
            return;
        }
        observedCategoryRoots.add(container);
    } else if (container.dataset.sarisiteObserved) {
        return;
    } else {
        container.dataset.sarisiteObserved = '1';
    }
    var t = null;
    var obs = new MutationObserver(function () {
        if (t) {
            clearTimeout(t);
        }
        t = setTimeout(function () {
            decorateCategoryList(container);
            mergeParamsAndFilter();
        }, 200);
    });
    obs.observe(container, { childList: true, subtree: true });
}

/**
 * Sol model listesi + filtre; sıralama / sayfa boyutu / sayfa değişince DOM yenilenir.
 */
function scheduleCategorySidebarRefresh() {
    if (categorySidebarRefreshTimer) {
        clearTimeout(categorySidebarRefreshTimer);
    }
    categorySidebarRefreshTimer = setTimeout(function () {
        categorySidebarRefreshTimer = null;
        var cat = document.getElementById('searchCategoryContainer');
        if (!cat) {
            return;
        }
        decorateCategoryList(cat);
        observeCategoryContainer(cat);
        mergeParamsAndFilter();
        brandsList = $.map($('#searchCategoryContainer ul li a'), function (n) {
            return $(n).attr('title');
        });
        ensureProfilesBar();
    }, 280);
}

/**
 * Sol filtredeki model listesi çoğu aramada AJAX ile geç gelir; ayrıca sıralama / paging
 * sonrası #searchCategoryContainer yeniden oluştuğunda sürekli yeniden bağlanır.
 */
function bootstrapSearchCategorySidebar() {
    scheduleCategorySidebarRefresh();

    if (!documentCategoryRefreshObserver) {
        documentCategoryRefreshObserver = new MutationObserver(function () {
            scheduleCategorySidebarRefresh();
        });
        documentCategoryRefreshObserver.observe(document.documentElement, { childList: true, subtree: true });
    }

    var tries = 0;
    var poll = setInterval(function () {
        tries += 1;
        if (document.getElementById('searchCategoryContainer') || tries >= 40) {
            scheduleCategorySidebarRefresh();
            clearInterval(poll);
        }
    }, 500);

    window.addEventListener(
        'load',
        function () {
            scheduleCategorySidebarRefresh();
        },
        { once: true }
    );
}

function FilterItems() {
    willBeRemoved = [];
    var baslikIndex = $("#searchResultsTable thead tr td:contains('İlan Başlığı')").index();
    var markaIndex = $("#searchResultsTable thead tr td:contains('Marka')").index();
    var seriIndex = $("#searchResultsTable thead tr td:contains('Seri')").index();
    var modelIndex = $("#searchResultsTable thead tr td:contains('Model')").index();
    var marka = null;
    var baslik = null;
    var seri = null;
    var model = null;
    $('.searchResultsRowClass .searchResultsItem').each(function () {
        var checkBaslik = null;
        var checkMarka = null;
        var checkModel = null;
        if (baslikIndex > -1) {
            baslik = $(this)
                .find('td:eq(' + baslikIndex + ') .classifiedTitle')
                ?.html()
                ?.toLocaleLowerCase('tr')
                ?.trim();
        }
        if (markaIndex > -1) {
            marka = $(this)
                .find('td:eq(' + markaIndex + ')')
                ?.html()
                ?.toLocaleLowerCase('tr')
                ?.trim();
        }
        if (seriIndex > -1) {
            seri = $(this)
                .find('td:eq(' + seriIndex + ')')
                ?.html()
                ?.toLocaleLowerCase('tr')
                ?.trim();
        }
        model = $(this)
            .find('td:eq(' + modelIndex + ')')
            ?.html()
            ?.toLocaleLowerCase('tr')
            ?.trim();

        //console.log(marka, model, params);

        if (marka) {
            checkMarka = params.brands?.find(function (x) {
                return marka == x.toLocaleLowerCase('tr');
            });
        }
        if (seri || model || baslik) {
            checkModel = params.models?.find(function (x) {
                return (
                    seri?.includes(x.toLocaleLowerCase('tr')) == true ||
                    model?.includes(x.toLocaleLowerCase('tr')) == true ||
                    baslik?.includes(x.toLocaleLowerCase('tr')) == true
                );
            });
        }

        if (params.type == 1) {
            if (checkMarka == null && checkModel == null) {
                willBeRemoved.push($(this));
            }
        } else if (params.type == 2) {
            if (checkMarka != null || checkModel != null) {
                willBeRemoved.push($(this));
            }
        }
    });

    $('.searchResultsRowClass .searchResultsItem').show();
    for (var i = 0; i < willBeRemoved.length; i++) {
        willBeRemoved[i].hide();
    }

    return { status: true, message: 'Filtreleme işlemi başarılı.' };
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    RegisterHandlers();
    if (request.requestType == 'filter') {
        userParams = {
            brands: request.brands || [],
            models: request.models || [],
            type: request.type != null ? request.type : 2,
        };
        mergeParamsAndFilter(function (result) {
            sendResponse(result);
        });
        return true;
    } else if (request.requestType == 'updateBrands') {
        sendResponse({ status: true, message: 'Markalar güncellendi.', brands: brandsList });
    }
});

$(document).ready(function () {
    getStorage(function () {     
        bootstrapSearchCategorySidebar();
        mergeParamsAndFilter();
        RegisterHandlers();
    });
});

function RegisterHandlers() {
    $(document).off('click', '.pageNaviButtons li');
    $(document).on('click', '.pageNaviButtons li', function () {
        setTimeout(function () {
            scheduleCategorySidebarRefresh();
        }, 2000);
    });

    $(document).off('click', '.paging-size');
    $(document).on('click', '.paging-size', function () {
        setTimeout(function () {
            scheduleCategorySidebarRefresh();
        }, 2000);
    });

    $(document).off('click', '.faceted-sort-buttons a, .sort-size-menu a');
    $(document).on('click', '.faceted-sort-buttons a, .sort-size-menu a', function () {
        setTimeout(function () {
            scheduleCategorySidebarRefresh();
        }, 2000);
    });

    $(document).off('click', '#searchResultsTable thead a, .searchResultsTable thead a');
    $(document).on('click', '#searchResultsTable thead a, .searchResultsTable thead a', function () {
        setTimeout(function () {
            scheduleCategorySidebarRefresh();
        }, 2000);
    });

    $(window).off('popstate.sarisite');
    $(window).on('popstate.sarisite', function () {
        scheduleCategorySidebarRefresh();
    });
}
