function renderGroupTable() {
    const desktopBody = document.getElementById('groupStatusTableDesktop');
    const mobileContainer = document.getElementById('groupStatusTableMobile');

    desktopBody.innerHTML = '';
    mobileContainer.innerHTML = '';

    if (groupDatabase.length === 0) {
        desktopBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">目前暫無團務公告資料。</td></tr>`;
        mobileContainer.innerHTML = `<p class="text-center text-slate-400 text-sm py-4">目前暫無團務公告資料。</p>`;
        return;
    }

    groupDatabase.forEach(g => {
        let statusClass = 'bg-slate-100 text-slate-700';
        const statusStr = g["狀態"]?.trim() || '';
        if (statusStr === '已抵台') statusClass = 'bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/50';
        else if (statusStr === '已下單' || statusStr === 'Focus已下單') statusClass = 'bg-blue-50 text-blue-700 font-medium border border-blue-200/50';
        else if (statusStr === '待下單') statusClass = 'bg-rose-50 text-rose-700 font-medium border border-rose-200/50';

        const groupName = g["團名"] || '未註明';
        const shipTime = g["運回時間"] || '-';
        const backupDesc = g["二補計算"] || g["二補計算說明"] || g["二補"] || '-';

        desktopBody.innerHTML += `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-4 font-semibold text-slate-700">${groupName}</td>
                <td class="p-4 text-slate-500 text-sm whitespace-nowrap">${shipTime}</td>
                <td class="p-4"><span class="px-2.5 py-0.5 rounded-full text-xs ${statusClass}">${statusStr || '未知'}</span></td>
                <td class="p-4 text-slate-500 text-xs max-w-xs md:max-w-none break-words">${backupDesc}</td>
            </tr>
        `;

        mobileContainer.innerHTML += `
            <div class="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2.5 shadow-sm">
                <div class="flex justify-between items-center">
                    <h4 class="font-bold text-slate-800 text-base">${groupName}</h4>
                    <span class="px-2.5 py-0.5 rounded-full text-xs ${statusClass}">${statusStr || '未知'}</span>
                </div>
                <div class="grid grid-cols-3 gap-2 text-xs">
                    <div class="bg-white p-2 rounded-lg border border-slate-100 flex flex-col justify-center items-center">
                        <span class="text-slate-400 block mb-0.5 scale-90">運回時間</span>
                        <span class="font-medium text-slate-700">${shipTime}</span>
                    </div>
                    <div class="bg-white p-2 rounded-lg border border-slate-100 col-span-2 px-3 flex flex-col justify-center">
                        <span class="text-slate-400 block mb-0.5 scale-90">二補計算與說明</span>
                        <span class="font-sans text-slate-600 break-words">${backupDesc}</span>
                    </div>
                </div>
            </div>
        `;
    });
}
