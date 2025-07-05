// index.js (TSV対応版)

document.addEventListener('DOMContentLoaded', async () => {
    // ★★★ 読み込むファイルを .tsv に変更 ★★★
    const TSV_FILE_PATH = 'math_problems.tsv';
    const container = document.getElementById('tag-buttons-container');

    if (!container) return;

    try {
        const response = await fetch(TSV_FILE_PATH);
        if (!response.ok) throw new Error('TSVファイルが見つかりません。');
        
        const text = await response.text();
        const lines = text.trim().split('\n');
        
        // ★★★ ヘッダーをタブで分割するように修正 ★★★
        const header = lines.shift().split('\t');
        const tagsColumnIndex = header.findIndex(h => h.trim() === 'tags');

        if (tagsColumnIndex === -1) throw new Error('TSVに "tags" 列がありません。');

        const allTags = lines.flatMap(line => {
            // ★★★ 各行をタブで分割するように修正 ★★★
            const columns = line.split('\t');
            // タグは半角スペース区切りと想定
            return columns[tagsColumnIndex] ? columns[tagsColumnIndex].trim().split(' ') : [];
        });

        const uniqueTags = [...new Set(allTags)].filter(tag => tag).sort();

        container.innerHTML = '';
        uniqueTags.forEach(tag => {
            const button = document.createElement('a');
            // ★★★ problem.html に渡すファイル名も .tsv を想定した形に ★★★
            // （ただし、problem.js側で固定ファイル名を読んでいるので、このURLは今のところタグ情報だけが重要）
            button.href = `problem.html?tag=${encodeURIComponent(tag)}`;
            button.className = 'tag-button';
            button.textContent = tag;
            container.appendChild(button);
        });

    } catch (error) {
        console.error('タグの読み込みに失敗しました:', error);
        container.innerHTML = `<p style="color: red;">単元リストの読み込みに失敗しました。ファイル名や形式を確認してください。（${error.message}）</p>`;
    }
});