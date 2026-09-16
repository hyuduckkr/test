(function () {
    var page = document.body.dataset;
    var form = document.getElementById('board-write-form');
    var saveButton = document.getElementById('board-save-button');
    var parameters = new URLSearchParams(location.search);
    var editingFileName = parameters.get('mode') === 'edit' ? parameters.get('file') : '';
    var existingFiles = [];
    var originalRecordId = 0;
    document.getElementById('write-date').value = new Date().toISOString().slice(0, 10);

    if (editingFileName) {
        fetch(page.boardDir + '/' + encodeURIComponent(editingFileName) + '?t=' + Date.now(), { cache: 'no-store' })
            .then(function (response) { if (!response.ok) throw new Error('수정할 게시물을 찾을 수 없습니다.'); return response.json(); })
            .then(function (data) {
                document.querySelector('.law-heading h3').textContent = '게시물 수정';
                document.getElementById('write-title').value = data.title || editingFileName.replace(/\.txt$/i, '');
                document.getElementById('write-date').value = data.date || new Date().toISOString().slice(0, 10);
                document.getElementById('write-content').value = (data.content || []).map(function (section) { return section.text || ''; }).join('\n\n');
                existingFiles = Array.isArray(data.files) ? data.files.slice() : [];
                originalRecordId = Number(data.id) || 0;
                saveButton.textContent = '수정 저장';
            })
            .catch(function (error) { window.alert(error.message); window.location.href = page.listPage; });
    }

    function safeName(value, fallback) {
        return String(value || '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').replace(/[. ]+$/g, '').trim() || fallback;
    }
    function sizeText(bytes) {
        if (bytes < 1024) return bytes + ' Bytes';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }
    function openDb() {
        return new Promise(function (resolve, reject) {
            var request = indexedDB.open('kmei-board-storage', 1);
            request.onupgradeneeded = function () { if (!request.result.objectStoreNames.contains('handles')) request.result.createObjectStore('handles'); };
            request.onsuccess = function () { resolve(request.result); };
            request.onerror = function () { reject(request.error); };
        });
    }
    async function rootHandle() {
        var db = await openDb();
        var saved = await new Promise(function (resolve, reject) {
            var tx = db.transaction('handles', 'readonly');
            var request = tx.objectStore('handles').get('kmei-root');
            request.onsuccess = function () { resolve(request.result || null); };
            request.onerror = function () { reject(request.error); };
        });
        db.close();
        if (saved && await saved.requestPermission({ mode: 'readwrite' }) === 'granted') return saved;
        var selected = await showDirectoryPicker({ id: 'kmei-board-root', mode: 'readwrite' });
        db = await openDb();
        await new Promise(function (resolve, reject) {
            var tx = db.transaction('handles', 'readwrite');
            tx.objectStore('handles').put(selected, 'kmei-root');
            tx.oncomplete = resolve;
            tx.onerror = function () { reject(tx.error); };
        });
        db.close();
        return selected;
    }
    async function exists(directory, name) { try { await directory.getFileHandle(name); return true; } catch (error) { if (error.name === 'NotFoundError') return false; throw error; } }
    async function write(directory, name, data) {
        var handle = await directory.getFileHandle(name, { create: true });
        var stream = await handle.createWritable();
        await stream.write(data);
        stream.close().catch(function (error) {
            console.warn('파일 닫기 완료 신호를 기다리지 않습니다.', error);
        });
    }
    async function unique(directory, name) { var dot=name.lastIndexOf('.'), base=dot>0?name.slice(0,dot):name, ext=dot>0?name.slice(dot):'', result=name, i=1; while(await exists(directory,result)){result=base+'-'+i+ext;i+=1;}return result; }
    function wait(milliseconds) { return new Promise(function (resolve) { window.setTimeout(resolve, milliseconds); }); }
    async function updateManifest(directory, textName) {
        var names = [];
        try {
            var handle = await directory.getFileHandle('file-list.txt');
            var file = await handle.getFile();
            names = (await file.text()).split(/\r?\n/).map(function (name) { return name.trim(); }).filter(Boolean);
        } catch (error) {
            if (error.name !== 'NotFoundError') console.warn('기존 목록을 읽지 못했습니다.', error);
        }
        names = names.filter(function (name) { return name !== textName; });
        names.unshift(textName);
        await Promise.race([
            write(directory, 'file-list.txt', names.join('\n') + '\n').catch(function (error) { console.warn('목록 파일 닫기 신호를 건너뜁니다.', error); }),
            wait(1500)
        ]);
    }
    function showCompletionPopup() {
        return new Promise(function (resolve) {
            var overlay = document.createElement('div');
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(16,31,43,.58)';
            overlay.innerHTML = '<div style="width:min(360px,100%);padding:32px 26px;text-align:center;border-radius:18px;background:#fff;box-shadow:0 24px 70px rgba(0,0,0,.28)"><h3 style="margin:0 0 12px;color:#163d52;font-size:22px">작성 완료</h3><p style="margin:0 0 24px;color:#526773">작성이 완료 되었습니다.</p><button type="button" style="min-width:90px;height:42px;border:0;border-radius:9px;color:#fff;background:#0870b6;font-weight:800">확인</button></div>';
            document.body.appendChild(overlay);
            var confirmButton = overlay.querySelector('button');
            confirmButton.addEventListener('click', function () { overlay.remove(); resolve(); });
            confirmButton.focus();
        });
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        saveButton.disabled = true;
        saveButton.textContent = '저장 중...';
        try {
            if (!window.showDirectoryPicker) throw new Error('Chrome 또는 Edge 브라우저에서 이용해 주세요.');
            var root = await rootHandle();
            var board = await root.getDirectoryHandle(page.boardDir, { create: true });
            var fileDir = await root.getDirectoryHandle('file', { create: true });
            var title = safeName(document.getElementById('write-title').value, '제목 없음');
            var textName = title + '.txt';
            if (textName !== editingFileName && await exists(board, textName)) throw new Error('같은 제목의 게시물이 이미 존재합니다.');
            var files = existingFiles.slice(), pendingFiles = [], selected = Array.from(document.getElementById('write-file').files);
            for (var i=0;i<selected.length;i+=1) {
                var original=safeName(selected[i].name,'attachment.bin');
                var stored=await unique(fileDir,original);
                pendingFiles.push({ file: selected[i], storedName: stored });
                files.push({name:original,path:stored,size:sizeText(selected[i].size)});
            }
            var record={id:originalRecordId||Date.now(),title:title,date:document.getElementById('write-date').value,content:[{heading:page.sectionTitle,text:document.getElementById('write-content').value.trim(),items:[]}],files:files};
            try {
                var recentKey = 'kmei-board-recent-' + page.boardDir;
                var recent = JSON.parse(localStorage.getItem(recentKey) || '[]');
                recent = recent.filter(function (item) { return item.fileName !== textName; });
                recent.unshift({ fileName: textName, title: title, date: record.date, id: record.id });
                localStorage.setItem(recentKey, JSON.stringify(recent));
            } catch (storageError) {
                console.warn('최근 작성 목록 저장을 건너뜁니다.', storageError);
            }
            await showCompletionPopup();

            for (var fileIndex = 0; fileIndex < pendingFiles.length; fileIndex += 1) {
                write(fileDir, pendingFiles[fileIndex].storedName, pendingFiles[fileIndex].file).catch(function (error) {
                    console.warn('첨부파일 저장 완료 신호를 기다리지 않습니다.', error);
                });
            }
            await Promise.race([
                write(board,textName,JSON.stringify(record)+'\n').catch(function (error) { console.warn('본문 파일 닫기 신호를 건너뜁니다.', error); }),
                wait(1500)
            ]);
            updateManifest(board, textName).catch(function (error) {
                console.warn('목록 갱신 완료 신호를 기다리지 않습니다.', error);
            });
            window.location.replace(page.listPage + '?saved=' + encodeURIComponent(textName) + '&t=' + Date.now());
        } catch (error) {
            if(error.name!=='AbortError') alert(error.message||'저장 중 오류가 발생했습니다.');
        }
        finally { saveButton.disabled=false; saveButton.textContent='저장'; }
    });
}());
