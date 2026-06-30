// 共用工具
function toggleSection(contentId, arrowId) {
    const content = document.getElementById(contentId);
    const arrow = document.getElementById(arrowId);
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        arrow.style.transform = 'rotate(180deg)';
    } else {
        content.classList.add('hidden');
        arrow.style.transform = 'rotate(0deg)';
    }
}

// Google Sheets JSON API 通用抓取
async function fetchCloudData(sheetName) {
    const SPREADSHEET_ID = "1iRFTcgHfn75kGTYMPlIihpUg-wzNoIuKJUQUEM8AwK4";
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}&headers=0`;
    const res = await fetch(url);
    const text = await res.text();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) {
        throw new Error(`無法解析分頁 [${sheetName}]，請確認試算表已發布該頁籤！`);
    }
    return JSON.parse(text.substring(start, end + 1));
}

// 常數
const MEMBER_STYLES = [
    "無選款", "岩本💛", "深澤💜", "ラウ🤍", "渡辺💙", "向井🧡", "阿部💚", "目黒🖤", "宮舘❤️", "佐久間 🩷"
];
