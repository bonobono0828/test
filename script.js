document.addEventListener('DOMContentLoaded', () => {
    // === サイドバーのセクション切り替え ===
    const navLinks = document.querySelectorAll('.sidebar nav ul li a');
    const pageSections = document.querySelectorAll('.page-section');

    function showSection(sectionId) {
        pageSections.forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');

        navLinks.forEach(link => {
            link.classList.remove('active-link');
        });
        const currentLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (currentLink) { // リンクが存在する場合のみアクティブにする
            currentLink.classList.add('active-link');
        }
    }

    // 初期表示で「自己紹介」セクションをアクティブにする
    showSection('about');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // デフォルトのリンク挙動を停止
            const sectionId = e.target.dataset.section;
            showSection(sectionId);
        });
    });

    // === 日記機能 ===

    // ローカルストレージから日記データをロード
    const diaries = JSON.parse(localStorage.getItem('myDiaries')) || {};

    const diaryDateInput = document.getElementById('diary-date');
    const diaryTitleInput = document.getElementById('diary-title');
    const diaryContentInput = document.getElementById('diary-content');
    const saveDiaryBtn = document.getElementById('save-diary');
    const saveMessage = document.getElementById('save-message');
    const sidebarDiaryDisplay = document.getElementById('sidebar-diary-display'); // サイドバーの日記表示エリア

    // 保存ボタンクリック時の処理
    saveDiaryBtn.addEventListener('click', () => {
        const date = diaryDateInput.value;
        const title = diaryTitleInput.value.trim();
        const content = diaryContentInput.value.trim();

        if (!date) {
            saveMessage.textContent = '日付を選択してください。';
            saveMessage.style.color = 'red';
            return;
        }
        if (!title && !content) {
            saveMessage.textContent = 'タイトルか内容のどちらかを入力してください。';
            saveMessage.style.color = 'red';
            return;
        }

        diaries[date] = {
            title: title || '無題', // タイトルが空なら「無題」
            content: content || '内容なし' // 内容が空なら「内容なし」
        };
        localStorage.setItem('myDiaries', JSON.stringify(diaries));

        saveMessage.textContent = `${date}の日記を保存しました！`;
        saveMessage.style.color = '#27ae60'; // 保存成功の色
        diaryTitleInput.value = ''; // 入力欄をクリア
        diaryContentInput.value = '';
        diaryDateInput.value = ''; // 日付もクリア

        // 保存したらカレンダーを再描画して、日記が追加されたことを反映
        renderCalendar(currentMonth, currentYear);
        // 保存した日の日記をサイドバーに表示
        displayDiaryInSidebar(date);
    });

    // 日付入力欄で日付が選択されたら、その日の日記を読み込む
    diaryDateInput.addEventListener('change', () => {
        const selectedDate = diaryDateInput.value;
        if (diaries[selectedDate]) {
            diaryTitleInput.value = diaries[selectedDate].title;
            diaryContentInput.value = diaries[selectedDate].content;
        } else {
            diaryTitleInput.value = '';
            diaryContentInput.value = '';
        }
        saveMessage.textContent = ''; // メッセージをクリア
    });


    // === カレンダー機能 ===
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    const today = new Date(); // 今日の日付
    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;


    function renderCalendar(month, year) {
        calendarGrid.innerHTML = ''; // カレンダーをクリア
        sidebarDiaryDisplay.innerHTML = '<p class="no-diary-message">日付を選択すると、日記が表示されます。</p>'; // 日記表示エリアをクリア

        const firstDayOfMonth = new Date(year, month, 1).getDay(); // その月の1日の曜日 (0=日, 1=月...)
        const daysInMonth = new Date(year, month + 1, 0).getDate(); // その月の日数

        currentMonthYear.textContent = `${year}年 ${month + 1}月`;

        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        dayNames.forEach(dayName => {
            const dayNameDiv = document.createElement('div');
            dayNameDiv.classList.add('day-name');
            dayNameDiv.textContent = dayName;
            calendarGrid.appendChild(dayNameDiv);
        });

        // 1日までの空白セルを追加
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.classList.add('empty');
            calendarGrid.appendChild(emptyDiv);
        }

        // 日付セルを追加
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.textContent = day;
            const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayDiv.dataset.date = fullDate; // データ属性に日付を保存

            // 今日かどうかをチェックしてクラスを追加
            if (fullDate === todayFormatted) {
                dayDiv.classList.add('today');
            }

            if (diaries[fullDate]) {
                dayDiv.classList.add('has-diary'); // 日記がある日にクラスを追加
            }

            dayDiv.addEventListener('click', () => {
                // 選択されている日付のスタイルをリセット
                const previouslySelected = document.querySelector('.calendar-grid .selected-day');
                if (previouslySelected) {
                    previouslySelected.classList.remove('selected-day');
                }

                dayDiv.classList.add('selected-day'); // 選択された日付にスタイルを適用

                displayDiaryInSidebar(fullDate);
            });
            calendarGrid.appendChild(dayDiv);
        }
    }

    function displayDiaryInSidebar(date) {
        sidebarDiaryDisplay.innerHTML = '';
        if (diaries[date]) {
            const diaryEntry = diaries[date];
            const titleElement = document.createElement('h4'); // h4に変更
            titleElement.textContent = `タイトル：${diaryEntry.title}`;
            const contentElement = document.createElement('p');
            contentElement.textContent = diaryEntry.content; // textareaの改行をpタグで表示

            sidebarDiaryDisplay.appendChild(titleElement);
            sidebarDiaryDisplay.appendChild(contentElement);
        } else {
            sidebarDiaryDisplay.innerHTML = `<p class="no-diary-message">${date}の日記はありません。</p>`;
        }
    }

    // 月の移動ボタン
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    });

    // 初期カレンダー表示と今日の表示
    renderCalendar(currentMonth, currentYear);
    // ページロード時に今日の日記をサイドバーに表示（もしあれば）
    displayDiaryInSidebar(todayFormatted);

    // 最初に今日のブログが青で囲まれるように、該当する日にselected-dayクラスも追加
    const todayElement = document.querySelector(`.calendar-grid div[data-date="${todayFormatted}"]`);
    if (todayElement) {
        todayElement.classList.add('selected-day');
    }
});
