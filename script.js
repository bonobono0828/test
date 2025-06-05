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

    // サイドバーの日記表示エリア（カレンダー選択時）
    const calendarSelectedDiaryDisplay = document.getElementById('calendar-selected-diary-display');

    // メインコンテンツの日記詳細表示エリア
    const singleDiaryView = document.getElementById('single-diary-view');
    const singleDiaryTitle = document.getElementById('single-diary-title');
    const singleDiaryDate = document.getElementById('single-diary-date');
    const singleDiaryContent = document.getElementById('single-diary-content');
    const backToTopBtn = document.getElementById('back-to-top-btn');

    // 日記一覧表示エリア
    const diaryTitlesList = document.getElementById('diary-titles-list');

    // === 検索機能関連要素 ===
    const diarySearchInput = document.getElementById('diary-search-input');
    const diarySearchButton = document.getElementById('diary-search-button');
    const diaryTitlesDatalist = document.getElementById('diary-titles-datalist'); // datalist要素


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
        // 保存した日の日記をサイドバーに表示（カレンダー下）
        displayDiaryInCalendarSidebar(date);
        // 日記一覧も更新
        renderDiaryTitlesList();
        // 予測変換データリストも更新
        updateDatalistOptions();
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
    // 今日の日付をYYYY-MM-DD 形式でフォーマット
    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;


    function renderCalendar(month, year) {
        calendarGrid.innerHTML = ''; // カレンダーをクリア
        calendarSelectedDiaryDisplay.innerHTML = '<p class="no-diary-message">日付を選択すると、日記が表示されます。</p>'; // 日記表示エリアをクリア

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

                displayDiaryInCalendarSidebar(fullDate);
            });
            calendarGrid.appendChild(dayDiv);
        }
    }

    function displayDiaryInCalendarSidebar(date) {
        calendarSelectedDiaryDisplay.innerHTML = '';
        if (diaries[date]) {
            const diaryEntry = diaries[date];
            const titleElement = document.createElement('h4');
            titleElement.textContent = `タイトル：${diaryEntry.title}`;
            const contentElement = document.createElement('p');
            contentElement.textContent = diaryEntry.content; // textareaの改行をpタグで表示

            calendarSelectedDiaryDisplay.appendChild(titleElement);
            calendarSelectedDiaryDisplay.appendChild(contentElement);
        } else {
            calendarSelectedDiaryDisplay.innerHTML = `<p class="no-diary-message">${date}の日記はありません。</p>`;
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
        // 月を変更した際にも、その月の今日の日付がハイライトされるように
        highlightTodayInCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
        // 月を変更した際にも、その月の今日の日付がハイライトされるように
        highlightTodayInCalendar();
    });

    // カレンダーの今日の日付をハイライトする関数
    function highlightTodayInCalendar() {
        // 現在表示されているカレンダーの月に今日の日付が含まれているか確認
        if (currentYear === today.getFullYear() && currentMonth === today.getMonth()) {
            const todayElement = document.querySelector(`.calendar-grid div[data-date="${todayFormatted}"]`);
            if (todayElement) {
                todayElement.classList.add('today');
                // ページロード時に今日の日記をサイドバーに表示したいので、初回のみ選択状態にする
                // 他の月へ移動した後に戻ってきた場合は、今日が選択状態になるようにする
                const previouslySelected = document.querySelector('.calendar-grid .selected-day');
                if (!previouslySelected || previouslySelected.dataset.date !== todayFormatted) {
                    // 古い選択をクリア
                    if (previouslySelected) {
                        previouslySelected.classList.remove('selected-day');
                    }
                    todayElement.classList.add('selected-day');
                    displayDiaryInCalendarSidebar(todayFormatted);
                }
            }
        }
    }

    // === 日記タイトル一覧表示機能 & 検索フィルタリング ===
    function renderDiaryTitlesList(searchTerm = '') { // 検索キーワードを引数に追加
        diaryTitlesList.innerHTML = ''; // 一覧をクリア

        // 日付を降順（新しい順）にソート
        const sortedDates = Object.keys(diaries).sort((a, b) => new Date(b) - new Date(a));

        const filteredDates = sortedDates.filter(date => {
            const diary = diaries[date];
            // 検索キーワードが空なら全て表示、そうでなければタイトルを小文字にして検索
            return searchTerm === '' || diary.title.toLowerCase().includes(searchTerm.toLowerCase());
        });


        if (filteredDates.length === 0) {
            diaryTitlesList.innerHTML = '<p class="no-diary-message">日記が見つかりません。</p>';
            if (searchTerm === '') { // 検索して何も見つからない場合と、元々日記がない場合でメッセージを分ける
                diaryTitlesList.innerHTML = '<p class="no-diary-message">まだ日記はありません。</p>';
            }
            return;
        }

        filteredDates.forEach(date => {
            const diary = diaries[date];
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = "#"; // リンクなので#を指定
            link.dataset.date = date; // 日付をデータ属性に保存
            link.textContent = `${date} - ${diary.title}`;

            link.addEventListener('click', (e) => {
                e.preventDefault();
                displaySingleDiary(date); // メインコンテンツに表示
                showSection('single-diary-view'); // 日記詳細セクションを表示
            });
            listItem.appendChild(link);
            diaryTitlesList.appendChild(listItem);
        });
    }

    // メインコンテンツに単一の日記を表示する関数
    function displaySingleDiary(date) {
        if (diaries[date]) {
            const diary = diaries[date];
            singleDiaryTitle.textContent = diary.title;
            singleDiaryDate.textContent = date;
            singleDiaryContent.textContent = diary.content;
        } else {
            singleDiaryTitle.textContent = '日記が見つかりません';
            singleDiaryDate.textContent = '';
            singleDiaryContent.textContent = '';
        }
    }

    // 「トップに戻る」ボタンのイベントリスナー
    backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('about'); // 自己紹介セクションに戻る
    });

    // === 検索機能（予測変換と実行） ===

    // datalistのオプションを更新する関数
    function updateDatalistOptions() {
        diaryTitlesDatalist.innerHTML = ''; // datalistをクリア
        // 日付を降順（新しい順）にソート
        const sortedDates = Object.keys(diaries).sort((a, b) => new Date(b) - new Date(a));

        sortedDates.forEach(date => {
            const diary = diaries[date];
            const option = document.createElement('option');
            option.value = diary.title; // タイトルを予測変換候補にする
            option.dataset.date = date; // 日付もデータ属性に持たせる（後で使うかも）
            diaryTitlesDatalist.appendChild(option);
        });
    }

    // 検索ボタンクリック時の処理
    diarySearchButton.addEventListener('click', () => {
        const searchTerm = diarySearchInput.value;
        renderDiaryTitlesList(searchTerm); // 検索キーワードを渡してサイドバーの日記一覧を再描画
        // もし予測変換で選択されたタイトルと完全に一致する日記があれば、直接表示
        const matchingDate = Object.keys(diaries).find(date => diaries[date].title === searchTerm);
        if (matchingDate) {
            displaySingleDiary(matchingDate);
            showSection('single-diary-view');
        } else {
             // 検索結果がない、または完全に一致しない場合は、一旦aboutセクションに戻すか、検索結果画面をデフォルトにする
             // ここでは、検索結果がサイドバーに表示されるので、メインコンテンツは変更しないでおきます。
             // 必要であれば showSection('about'); などを追加してください。
        }
    });

    // Enterキーでも検索できるようにする
    diarySearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = diarySearchInput.value;
            renderDiaryTitlesList(searchTerm); // 検索キーワードを渡してサイドバーの日記一覧を再描画
            // 予測変換で選択されたタイトルと完全に一致する日記があれば、直接表示
            const matchingDate = Object.keys(diaries).find(date => diaries[date].title === searchTerm);
            if (matchingDate) {
                displaySingleDiary(matchingDate);
                showSection('single-diary-view');
            }
        }
    });


    // 初期表示処理
    renderCalendar(currentMonth, currentYear); // カレンダー初期表示
    highlightTodayInCalendar(); // 今日の日付をハイライト

    // ページロード時に今日の日記をサイドバーのカレンダー下に表示（もしあれば）
    displayDiaryInCalendarSidebar(todayFormatted);

    renderDiaryTitlesList(); // 日記タイトル一覧の初期表示 (検索なし)
    updateDatalistOptions(); // 予測変換データリストの初期生成
});
