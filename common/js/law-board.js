(function () {
    var boardFiles = [];
    var listData = [];

    function loadLayout() {
        $.ajax({method:'GET',url:'header.html',async:false,dataType:'html'}).done(function(html){$('#header').append(html);});
        $.ajax({method:'GET',url:'footer.html',async:false,dataType:'html'}).done(function(html){$('#footer').append(html);new Swiper('.related-sites-swiper',{slidesPerView:5,slidesPerGroup:1,loop:true,speed:700,autoplay:{delay:2500,disableOnInteraction:false,pauseOnMouseEnter:true},observer:true,observeParents:true});});
    }

    function titleFromFile(fileName) {
        return fileName.replace(/\.txt$/i, '');
    }

    function loadFileNames() {
        return fetch('board/file-list.txt',{cache:'no-store'}).then(function(response){
            if(!response.ok) throw new Error('파일 목록을 읽을 수 없습니다.');
            return response.text();
        }).then(function(text){
            boardFiles=text.split(/\r?\n/).map(function(name){return name.trim();}).filter(function(name){return name && name.toLowerCase().endsWith('.txt');});
            var saved=new URLSearchParams(location.search).get('saved');
            if(saved&&saved.toLowerCase().endsWith('.txt')&&boardFiles.indexOf(saved)<0)boardFiles.unshift(saved);
            return boardFiles;
        });
    }

    function renderList(filter) {
        var target=document.getElementById('law-list'); if(!target)return;
        var word=(filter||'').trim().toLowerCase();
        var rows=listData.filter(function(item){return item.title.toLowerCase().indexOf(word)>-1;});
        document.getElementById('law-count').textContent=rows.length;
        target.innerHTML=rows.map(function(item,index){
            return '<tr><td>'+(rows.length-index)+'</td><td class="title"><span class="law-badge">법령</span> <a href="board-view.html?file='+encodeURIComponent(item.fileName)+'">'+item.title+'</a></td><td>'+item.date+'</td></tr>';
        }).join('')||'<tr><td colspan="3">검색 결과가 없습니다.</td></tr>';
    }

    function loadList() {
        if(!document.getElementById('law-list'))return;
        loadFileNames().then(function(files){
            return Promise.all(files.map(function(fileName){
                return fetch('board/'+encodeURIComponent(fileName),{cache:'no-store'}).then(function(response){if(!response.ok)throw new Error();return response.json();}).then(function(data){return {fileName:fileName,title:titleFromFile(fileName),date:data.date,id:Number(data.id)||0};});
            }));
        }).then(function(items){
            var recent=[];
            try{recent=JSON.parse(localStorage.getItem('kmei-board-recent-board')||'[]');}catch(ignore){recent=[];}
            recent.slice().reverse().forEach(function(item){if(!items.some(function(current){return current.fileName===item.fileName;}))items.unshift(item);});
            items.sort(function(a,b){return(Number(b.id)||0)-(Number(a.id)||0);});listData=items;renderList('');
        }).catch(function(){document.getElementById('law-list').innerHTML='<tr><td colspan="3">목록 파일을 불러오지 못했습니다. 웹서버에서 실행해 주세요.</td></tr>';});
    }

    function renderView(item) {
        document.title=titleFromFile(item.fileName)+' | 경남경영경제연구원';
        document.getElementById('view-title').textContent=titleFromFile(item.fileName);
        document.getElementById('view-date').textContent=item.date;
        document.getElementById('view-body').innerHTML=item.content.map(function(section){var items=section.items&&section.items.length?'<ul>'+section.items.map(function(text){return '<li>'+text+'</li>';}).join('')+'</ul>':'';return '<h4>'+section.heading+'</h4><p>'+section.text+'</p>'+items;}).join('');
        document.getElementById('law-files').innerHTML=item.files.map(function(file){return '<a href="file/'+encodeURIComponent(file.path)+'" download="'+file.name+'">'+file.name+' <small>('+file.size+')</small></a>';}).join('');
    }

    function loadView() {
        if(!document.getElementById('law-view'))return;
        var requested=new URLSearchParams(location.search).get('file');
        loadFileNames().then(function(files){
            var fileName=files.indexOf(requested)>-1?requested:files[0];
            if(!fileName)throw new Error();
            return fetch('board/'+encodeURIComponent(fileName),{cache:'no-store'}).then(function(response){if(!response.ok)throw new Error();return response.json();}).then(function(data){data.fileName=fileName;return data;});
        }).then(renderView).catch(function(){document.getElementById('law-view').innerHTML='<div style="padding:40px;text-align:center">게시물 내용을 불러오지 못했습니다.</div>';});
    }

    document.addEventListener('DOMContentLoaded',function(){loadLayout();loadList();loadView();var form=document.getElementById('law-search');if(form)form.addEventListener('submit',function(event){event.preventDefault();renderList(document.getElementById('law-keyword').value);});});
})();
