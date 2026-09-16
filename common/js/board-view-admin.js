(function () {
    var settings = document.body.dataset;
    var fileName = new URLSearchParams(location.search).get('file');
    var editButton = document.getElementById('board-edit-button');
    var deleteButton = document.getElementById('board-delete-button');
    if (!editButton || !deleteButton) return;
    var manageActions = document.querySelector('.board-manage-actions');
    function updateManageActions() {
        var loggedIn = false;
        try { loggedIn = localStorage.getItem('kmei-admin-login') === 'true'; }
        catch (error) {}
        manageActions.style.display = loggedIn ? 'flex' : 'none';
    }
    updateManageActions();
    window.addEventListener('kmei-login-changed', updateManageActions);
    if (fileName) editButton.href = settings.writePage + '?mode=edit&file=' + encodeURIComponent(fileName);

    function openDatabase() { return new Promise(function(resolve,reject){var request=indexedDB.open('kmei-board-storage',1);request.onupgradeneeded=function(){if(!request.result.objectStoreNames.contains('handles'))request.result.createObjectStore('handles');};request.onsuccess=function(){resolve(request.result);};request.onerror=function(){reject(request.error);};}); }
    async function getRoot() { var db=await openDatabase();var handle=await new Promise(function(resolve,reject){var tx=db.transaction('handles','readonly'),request=tx.objectStore('handles').get('kmei-root');request.onsuccess=function(){resolve(request.result||null);};request.onerror=function(){reject(request.error);};});db.close();if(!handle)throw new Error('저장 폴더 권한이 없습니다.');var permission=await handle.queryPermission({mode:'readwrite'});if(permission!=='granted')permission=await handle.requestPermission({mode:'readwrite'});if(permission!=='granted')throw new Error('폴더 접근 권한이 필요합니다.');return handle; }
    async function rewriteManifest(directory) { try{var handle=await directory.getFileHandle('file-list.txt'),file=await handle.getFile(),names=(await file.text()).split(/\r?\n/).filter(function(name){return name.trim()&&name.trim()!==fileName;}),writable=await handle.createWritable();await writable.write(names.join('\n')+'\n');writable.close().catch(function(){});}catch(error){console.warn(error);} }

    deleteButton.addEventListener('click', async function () {
        if (!window.confirm('삭제하시겠습니까?')) return;
        deleteButton.disabled=true;deleteButton.textContent='삭제 중';
        try {
            var response=await fetch(settings.boardDir+'/'+encodeURIComponent(fileName)+'?t='+Date.now(),{cache:'no-store'});if(!response.ok)throw new Error('삭제할 게시물을 불러오지 못했습니다.');var post=await response.json();
            var root=await getRoot(),board=await root.getDirectoryHandle(settings.boardDir),files=await root.getDirectoryHandle('file');
            await Promise.all((post.files||[]).map(function(file){return files.removeEntry(file.path).catch(function(error){if(error.name!=='NotFoundError')throw error;});}));
            await board.removeEntry(fileName);rewriteManifest(board);
            window.location.replace(settings.listPage+'?t='+Date.now());
        } catch(error) { window.alert(error.message||'삭제 중 오류가 발생했습니다.');deleteButton.disabled=false;deleteButton.textContent='삭제'; }
    });
}());
