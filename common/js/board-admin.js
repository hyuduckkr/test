(function () {
    var button = document.querySelector('.protected-write-button');
    if (!button) return;

    function updateWriteButton() {
        var loggedIn = false;
        try { loggedIn = localStorage.getItem('kmei-admin-login') === 'true'; }
        catch (error) {}
        button.style.display = loggedIn ? 'inline-flex' : 'none';
    }
    updateWriteButton();
    window.addEventListener('kmei-login-changed', updateWriteButton);
    return;

    var dialog = document.createElement('dialog');
    dialog.className = 'admin-login-dialog';
    dialog.innerHTML =
        '<form class="admin-login-form">' +
            '<h3>관리자 확인</h3>' +
            '<p>글쓰기를 위해 관리자 ID와 비밀번호를 입력해 주세요.</p>' +
            '<label class="admin-login-field"><span>ID</span><input class="admin-login-id" type="text" autocomplete="username" required></label>' +
            '<label class="admin-login-field"><span>PW</span><input class="admin-login-password" type="password" autocomplete="current-password" required></label>' +
            '<p class="admin-login-error" aria-live="polite"></p>' +
            '<div class="admin-login-actions"><button class="admin-login-cancel" type="button">취소</button><button class="admin-login-submit" type="submit">확인</button></div>' +
        '</form>';
    document.body.appendChild(dialog);

    var form = dialog.querySelector('form');
    var idInput = dialog.querySelector('.admin-login-id');
    var passwordInput = dialog.querySelector('.admin-login-password');
    var error = dialog.querySelector('.admin-login-error');

    button.addEventListener('click', function (event) {
        event.preventDefault();
        form.reset();
        error.textContent = '';
        dialog.showModal();
        idInput.focus();
    });
    dialog.querySelector('.admin-login-cancel').addEventListener('click', function () { dialog.close(); });
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (idInput.value === 'admin' && passwordInput.value === '1234') {
            location.href = button.href;
            return;
        }
        error.textContent = 'ID 또는 비밀번호가 올바르지 않습니다.';
        passwordInput.value = '';
        passwordInput.focus();
    });
}());
