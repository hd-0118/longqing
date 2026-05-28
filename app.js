// ==================== 全局变量和数据存储 ====================
let announcements = JSON.parse(localStorage.getItem('announcements')) || [];
let developerData = JSON.parse(localStorage.getItem('developerData')) || [];

// ==================== 页面切换功能 ====================
function showSection(sectionId, e) {
    // 阻止事件冒泡
    if (e) e.stopPropagation();
    
    // 隐藏所有section
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // 移除所有导航按钮的active状态
    const buttons = document.querySelectorAll('.uiverse-nav-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
    });

    // 显示选中的section
    document.getElementById(sectionId).classList.add('active');

    // 添加active状态到对应的按钮
    const clickedButton = e ? e.currentTarget : document.querySelector(`.uiverse-nav-btn[onclick*="'${sectionId}'"]`);
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    
    // 如果切换到公告页面，隐藏红点
    if (sectionId === 'announcements') {
        hideNotificationDot();
    }
}

// ==================== 公告功能 ====================

// 检查是否有新公告（红点提示）
function checkNewAnnouncements() {
    console.log('=== 开始检查公告 ===');
    console.log('LocalStorage announcements:', localStorage.getItem('announcements'));
    console.log('announcements数组:', announcements);
    console.log('公告数量:', announcements.length);
    
    const dot = document.getElementById('announcement-dot');
    console.log('红点元素:', dot);
    
    // 获取用户上次查看公告的时间
    const lastViewedTime = localStorage.getItem('lastViewedAnnouncementTime');
    console.log('上次查看时间:', lastViewedTime);
    
    if (announcements.length > 0) {
        // 有公告
        const latestAnnouncement = announcements[0];
        const latestAnnouncementTime = latestAnnouncement.date || latestAnnouncement.time;
        
        console.log('最新公告时间:', latestAnnouncementTime);
        
        if (!lastViewedTime) {
            // 用户从未查看过公告，显示红点
            console.log('用户从未查看过公告，显示红点');
            if (dot) {
                dot.style.display = 'block';
            }
        } else {
            // 用户查看过，比较时间
            try {
                const lastViewed = new Date(lastViewedTime).getTime();
                const latestTime = new Date(latestAnnouncementTime).getTime();
                
                console.log('时间戳比较:', { lastViewed, latestTime, isNew: latestTime > lastViewed });
                
                if (latestTime > lastViewed) {
                    console.log('有新公告，显示红点');
                    if (dot) {
                        dot.style.display = 'block';
                    }
                } else {
                    console.log('没有新公告，隐藏红点');
                    if (dot) {
                        dot.style.display = 'none';
                    }
                }
            } catch (e) {
                console.error('时间比较出错:', e);
                // 出错时保守处理：显示红点
                if (dot) {
                    dot.style.display = 'block';
                }
            }
        }
    } else {
        console.log('没有公告，隐藏红点');
        if (dot) {
            dot.style.display = 'none';
        }
    }
    console.log('=== 检查结束 ===');
}

// 显示红点
function showNotificationDot() {
    console.log('尝试显示红点...');
    const dot = document.getElementById('announcement-dot');
    console.log('红点元素:', dot);
    if (dot) {
        dot.style.display = 'block';
        dot.style.visibility = 'visible';
        dot.style.opacity = '1';
        console.log('红点已显示');
    } else {
        console.error('找不到红点元素！');
    }
}

// 隐藏红点
function hideNotificationDot() {
    const dot = document.getElementById('announcement-dot');
    if (dot) {
        dot.style.display = 'none';
    }
    // 记录查看时间
    localStorage.setItem('lastViewedAnnouncementTime', new Date().toISOString());
}
function addAnnouncement() {
    const title = document.getElementById('announcement-title').value.trim();
    const content = document.getElementById('announcement-content').value.trim();
    const priority = document.getElementById('announcement-priority').value;

    if (!title || !content) {
        alert('请填写公告标题和内容！');
        return;
    }

    const announcement = {
        id: Date.now(),
        title: title,
        content: content,
        priority: priority,
        time: new Date().toLocaleString('zh-CN')
    };

    announcements.unshift(announcement);
    saveAnnouncements();
    renderAnnouncements();

    // 清空表单
    document.getElementById('announcement-title').value = '';
    document.getElementById('announcement-content').value = '';
    document.getElementById('announcement-priority').value = 'normal';

    alert('公告发布成功！');
}

function deleteAnnouncement(id) {
    if (confirm('确定要删除这条公告吗？')) {
        // 从数组中删除
        announcements = announcements.filter(a => a.id !== id);
        
        // 保存到 Firebase
        firebaseService.saveAnnouncements(announcements)
            .then(() => {
                renderAnnouncements();
                console.log('公告删除成功');
            })
            .catch(error => {
                console.error('删除公告失败:', error);
                // 降级到 localStorage
                localStorage.setItem('announcements', JSON.stringify(announcements));
                renderAnnouncements();
            });
    }
}

function saveAnnouncements() {
    // 使用 Firebase 服务保存数据
    firebaseService.saveAnnouncements(announcements).catch(error => {
        console.error('保存公告失败:', error);
        // 降级到 localStorage
        localStorage.setItem('announcements', JSON.stringify(announcements));
    });
}

function renderAnnouncements() {
    const container = document.querySelector('.announcements-list');
    
    // 如果容器不存在，直接返回
    if (!container) {
        return;
    }

    // 如果没有公告数据，保留原有的HTML内容
    if (!announcements || announcements.length === 0) {
        return;
    }

    container.innerHTML = announcements.map(announcement => `
        <div class="announcement-item ${announcement.priority}">
            <div class="announcement-header">
                <div class="announcement-title">${escapeHtml(announcement.title)}</div>
                <div class="announcement-time">${announcement.time || '未知时间'}</div>
            </div>
            ${announcement.image ? `<div class="announcement-image"><img src="${announcement.image}" alt="公告图片" class="clickable-image" onclick="showImagePreview(this.src)" title="点击放大查看"><div class="image-zoom-hint">🔍 点击放大</div></div>` : ''}
            <div class="announcement-content">${escapeHtml(announcement.content)}</div>
            <span class="priority-badge ${announcement.priority}">
                ${getPriorityText(announcement.priority)}
            </span>
        </div>
    `).join('');
}

// 显示图片预览模态框
function showImagePreview(imageSrc) {
    // 如果已经存在模态框，先移除
    const existingModal = document.querySelector('.image-preview-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'image-preview-modal';
    modal.onclick = function(e) {
        if (e.target === modal) {
            hideImagePreview();
        }
    };
    
    modal.innerHTML = `
        <div class="image-preview-content">
            <span class="image-preview-close">&times;</span>
            <img src="${imageSrc}" alt="预览图片">
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 点击关闭按钮关闭模态框
    const closeBtn = modal.querySelector('.image-preview-close');
    closeBtn.onclick = function() {
        hideImagePreview();
    };
    
    // 按ESC键关闭模态框
    const escHandler = function(e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            hideImagePreview();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// 隐藏图片预览模态框
function hideImagePreview() {
    const modal = document.querySelector('.image-preview-modal');
    if (modal) {
        modal.remove();
    }
}

function getPriorityText(priority) {
    const map = {
        'normal': '普通',
        'important': '重要',
        'urgent': '紧急'
    };
    return map[priority] || '普通';
}

// ==================== 计算器功能 ====================
let calcExpression = '';

function showCalcTab(tabName) {
    // 隐藏所有计算面板
    document.querySelectorAll('.calc-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    // 移除所有标签的active状态
    document.querySelectorAll('.calc-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // 显示选中的面板
    document.getElementById(tabName + '-calc').classList.add('active');

    // 添加active状态到对应的标签
    event.target.classList.add('active');

    // 如果是单位转换器，初始化选项
    if (tabName === 'converter') {
        updateConverter();
    }
}

function appendCalc(value) {
    calcExpression += value;
    document.getElementById('calc-display').value = calcExpression;
}

function clearCalc() {
    calcExpression = '';
    document.getElementById('calc-display').value = '';
}

function calculate() {
    try {
        const result = eval(calcExpression);
        document.getElementById('calc-display').value = result;
        calcExpression = result.toString();
    } catch (error) {
        document.getElementById('calc-display').value = '错误';
        calcExpression = '';
    }
}

// ==================== 统计分析功能 ====================
function calculateStats() {
    const dataStr = document.getElementById('stats-data').value.trim();

    if (!dataStr) {
        alert('请输入数据！');
        return;
    }

    // 解析数据（支持逗号和换行分隔）
    const data = dataStr.split(/[,，\n]/)
        .map(item => parseFloat(item.trim()))
        .filter(item => !isNaN(item));

    if (data.length === 0) {
        alert('没有有效的数字数据！');
        return;
    }

    // 计算统计值
    const count = data.length;
    const sum = data.reduce((a, b) => a + b, 0);
    const mean = sum / count;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;

    // 计算中位数
    const sorted = [...data].sort((a, b) => a - b);
    const median = count % 2 === 0
        ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
        : sorted[Math.floor(count / 2)];

    // 计算方差和标准差
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    // 显示结果
    const resultsDiv = document.getElementById('stats-results');
    resultsDiv.innerHTML = `
        <h3 style="margin-bottom: 15px; color: #667eea;">统计结果</h3>
        <div class="stat-item">
            <span class="stat-label">数据个数</span>
            <span class="stat-value">${count}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">总和</span>
            <span class="stat-value">${sum.toFixed(2)}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">平均值</span>
            <span class="stat-value">${mean.toFixed(2)}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">中位数</span>
            <span class="stat-value">${median.toFixed(2)}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">最小值</span>
            <span class="stat-value">${min.toFixed(2)}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">最大值</span>
            <span class="stat-value">${max.toFixed(2)}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">极差</span>
            <span class="stat-value">${range.toFixed(2)}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">标准差</span>
            <span class="stat-value">${stdDev.toFixed(2)}</span>
        </div>
    `;
}

// ==================== 单位转换功能 ====================
const conversionUnits = {
    length: {
        units: ['米', '千米', '厘米', '毫米', '英里', '码', '英尺', '英寸'],
        toBase: [1, 1000, 0.01, 0.001, 1609.344, 0.9144, 0.3048, 0.0254]
    },
    weight: {
        units: ['千克', '克', '毫克', '吨', '磅', '盎司'],
        toBase: [1, 0.001, 0.000001, 1000, 0.453592, 0.0283495]
    },
    temperature: {
        units: ['摄氏度', '华氏度', '开尔文'],
        special: true
    }
};

function updateConverter() {
    const typeElement = document.getElementById('convert-type');
    const fromSelect = document.getElementById('convert-from');
    const toSelect = document.getElementById('convert-to');

    // 如果页面上没有转换器元素，直接返回
    if (!typeElement || !fromSelect || !toSelect) {
        return;
    }

    const type = typeElement.value;

    const units = conversionUnits[type].units;

    fromSelect.innerHTML = units.map((unit, i) =>
        `<option value="${i}">${unit}</option>`
    ).join('');

    toSelect.innerHTML = units.map((unit, i) =>
        `<option value="${i}" ${i === 1 ? 'selected' : ''}>${unit}</option>`
    ).join('');
}

function convert() {
    const type = document.getElementById('convert-type').value;
    const value = parseFloat(document.getElementById('convert-value').value);
    const fromIndex = parseInt(document.getElementById('convert-from').value);
    const toIndex = parseInt(document.getElementById('convert-to').value);

    if (isNaN(value)) {
        alert('请输入有效的数值！');
        return;
    }

    let result;

    if (type === 'temperature') {
        result = convertTemperature(value, fromIndex, toIndex);
    } else {
        const config = conversionUnits[type];
        // 转换为基准单位，再转换为目标单位
        const baseValue = value * config.toBase[fromIndex];
        result = baseValue / config.toBase[toIndex];
    }

    document.getElementById('convert-result').value = result.toFixed(4);
}

function convertTemperature(value, from, to) {
    // 先转换为摄氏度
    let celsius;
    if (from === 0) { // 摄氏度
        celsius = value;
    } else if (from === 1) { // 华氏度
        celsius = (value - 32) * 5 / 9;
    } else { // 开尔文
        celsius = value - 273.15;
    }

    // 从摄氏度转换为目标单位
    if (to === 0) { // 摄氏度
        return celsius;
    } else if (to === 1) { // 华氏度
        return celsius * 9 / 5 + 32;
    } else { // 开尔文
        return celsius + 273.15;
    }
}

// ==================== 开发者数据功能 ====================
function addDeveloperData() {
    const name = document.getElementById('data-name').value.trim();
    const category = document.getElementById('data-category').value.trim();
    const type = document.getElementById('data-type').value;
    const value = document.getElementById('data-value').value.trim();
    const description = document.getElementById('data-description').value.trim();

    if (!name || !category || !value) {
        alert('请填写数据名称、分类和值！');
        return;
    }

    const data = {
        id: Date.now(),
        name: name,
        category: category,
        type: type,
        value: value,
        description: description,
        time: new Date().toLocaleString('zh-CN')
    };

    developerData.unshift(data);
    saveDeveloperData();
    renderDeveloperData();
    updateCategoryFilter();

    // 清空表单
    document.getElementById('data-name').value = '';
    document.getElementById('data-category').value = '';
    document.getElementById('data-type').value = 'text';
    document.getElementById('data-value').value = '';
    document.getElementById('data-description').value = '';

    alert('数据添加成功！');
}

function deleteDeveloperData(id) {
    if (confirm('确定要删除这条数据吗？')) {
        developerData = developerData.filter(d => d.id !== id);
        saveDeveloperData();
        renderDeveloperData();
        updateCategoryFilter();
    }
}

function saveDeveloperData() {
    // 使用 Firebase 服务保存数据
    firebaseService.saveDeveloperData(developerData).catch(error => {
        console.error('保存开发者数据失败:', error);
        // 降级到 localStorage
        localStorage.setItem('developerData', JSON.stringify(developerData));
    });
}

function renderDeveloperData(dataToRender = null) {
    const container = document.getElementById('data-container');
    
    // 如果容器不存在，直接返回（比如在 admin.html 页面）
    if (!container) {
        return;
    }
    
    const data = dataToRender || developerData;

    if (data.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px; grid-column: 1/-1;">暂无数据</p>';
        return;
    }

    container.innerHTML = data.map(item => `
        <div class="data-card">
            <div class="data-card-header">
                <div>
                    <div class="data-name">${escapeHtml(item.name)}</div>
                    <span class="data-category">${escapeHtml(item.category)}</span>
                    <span class="data-type">${getTypeText(item.type)}</span>
                </div>
            </div>
            <div class="data-value">
                ${formatDataValue(item)}
            </div>
            ${item.description ? `<div class="data-description">${escapeHtml(item.description)}</div>` : ''}
            <div class="data-time">${item.time}</div>
        </div>
    `).join('');
}

function formatDataValue(item) {
    if (item.type === 'link') {
        return `<a href="${escapeHtml(item.value)}" target="_blank">${escapeHtml(item.value)}</a>`;
    }
    return escapeHtml(item.value);
}

function getTypeText(type) {
    const map = {
        'text': '文本',
        'number': '数字',
        'link': '链接'
    };
    return map[type] || '文本';
}

function updateCategoryFilter() {
    const filterSelect = document.getElementById('filter-category');
    if (!filterSelect) {
        return;
    }
    
    const categories = [...new Set(developerData.map(d => d.category))];

    filterSelect.innerHTML = '<option value="">全部分类</option>' +
        categories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('');
}

function filterData() {
    const searchTerm = document.getElementById('search-data').value.toLowerCase();
    const categoryFilter = document.getElementById('filter-category').value;
    const typeFilter = document.getElementById('filter-type').value;

    let filtered = developerData;

    if (searchTerm) {
        filtered = filtered.filter(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm) ||
            item.value.toLowerCase().includes(searchTerm) ||
            (item.description && item.description.toLowerCase().includes(searchTerm))
        );
    }

    if (categoryFilter) {
        filtered = filtered.filter(item => item.category === categoryFilter);
    }

    if (typeFilter) {
        filtered = filtered.filter(item => item.type === typeFilter);
    }

    renderDeveloperData(filtered);
}

// ==================== 工具函数 ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化...');
    
    // 先加载公告数据
    renderAnnouncements();
    
    // 然后检查是否有新公告
    setTimeout(() => {
        console.log('延迟检查公告...');
        checkNewAnnouncements();
    }, 100);
    
    renderDeveloperData();
    updateCategoryFilter();
    updateConverter();
    loadMarketData();
    
    // 获取金杯兑换灵石最低价、金杯最低价和宠物最低价
    fetchGoldCupExchangeMinPrice();
    fetchGoldCupMinPrice();
    fetchPetMinPrice();
    
    // 每 3 小时（10800000 毫秒）更新一次
    setInterval(fetchGoldCupExchangeMinPrice, 3 * 60 * 60 * 1000);
    setInterval(fetchGoldCupMinPrice, 3 * 60 * 60 * 1000);
    setInterval(fetchPetMinPrice, 3 * 60 * 60 * 1000);
});

// ==================== 宠物收益率计算功能 ====================

// 计算宠物收益率（同时计算三个模式）
function calculatePetYield() {
    // 获取基础数据
    const petPrice = parseFloat(document.getElementById('pet-price').value);
    const goldCupExchange = parseFloat(document.getElementById('gold-cup-exchange').value);
    const goldCupPrice = parseFloat(document.getElementById('gold-cup-price').value);

    // 验证基础数据
    if (!petPrice || !goldCupExchange || !goldCupPrice) {
        alert('请填写宠物价格、金杯兑换灵石数量和金杯单价！');
        return;
    }

    if (petPrice <= 0 || goldCupExchange <= 0 || goldCupPrice <= 0) {
        alert('所有数值必须大于0！');
        return;
    }

    // 计算出租模式
    const rentalIncome = parseFloat(document.getElementById('rental-income').value);
    if (rentalIncome && rentalIncome > 0) {
        const yieldRate = (rentalIncome / goldCupExchange * goldCupPrice) / petPrice;
        const formula = `出租收益灵石数量 ÷ 1金杯可兑换灵石数量 × 金杯价格 ÷ 宠物本体价格<br>${rentalIncome} ÷ ${goldCupExchange} × ${goldCupPrice} ÷ ${petPrice}`;
        const paybackDays = 1 / yieldRate;
        displayModeResult('rental', yieldRate, formula, paybackDays);
    } else {
        document.getElementById('rental-result').style.display = 'none';
    }

    // 计算发车模式
    const convoyIncome = parseFloat(document.getElementById('convoy-income').value);
    if (convoyIncome && convoyIncome > 0) {
        const yieldRate = (convoyIncome / goldCupExchange * goldCupPrice) / petPrice;
        const formula = `每只宠物预计一天发车灵石收益 ÷ 1金杯可兑换灵石数量 × 金杯价格 ÷ 宠物本体价格<br>${convoyIncome} ÷ ${goldCupExchange} × ${goldCupPrice} ÷ ${petPrice}`;
        const paybackDays = 1 / yieldRate;
        displayModeResult('convoy', yieldRate, formula, paybackDays);
    } else {
        document.getElementById('convoy-result').style.display = 'none';
    }

    // 计算PVP模式
    const pvpCups = parseFloat(document.getElementById('pvp-cups').value);
    if (pvpCups !== null && !isNaN(pvpCups) && pvpCups >= 0) {
        const yieldRate = (pvpCups * goldCupPrice) / petPrice;
        const formula = `每日获取金杯数 × 金杯价格 ÷ 成本<br>${pvpCups} × ${goldCupPrice} ÷ ${petPrice}`;
        const paybackDays = yieldRate > 0 ? 1 / yieldRate : Infinity;
        displayModeResult('pvp', yieldRate, formula, paybackDays);
    } else {
        document.getElementById('pvp-result').style.display = 'none';
    }

    // 计算矿机成本模式（自动计算，无需用户输入）
    if (goldCupExchange && goldCupExchange > 0) {
        // 获取出租模式的收益数据，如果未填写则使用默认值45
        const rentalIncome = parseFloat(document.getElementById('rental-income').value) || 45;
        // 自动计算矿机成本：25 + (1750 + 2*rentalIncome*7) / 金杯兑换灵石数量
        const slaveCost = 25 + (1750 + 2 * rentalIncome * 7) / goldCupExchange;
        // 计算合适的矿机价格：矿机成本 ÷ 2 × 金杯最低价
        const suitableSlavePrice = (slaveCost / 2) * goldCupPrice;
        displaySlaveResult(slaveCost, suitableSlavePrice, goldCupPrice, goldCupExchange);
    } else {
        document.getElementById('slave-result').style.display = 'none';
    }

    // 滚动到第一个结果区域
    const rentalResult = document.getElementById('rental-result');
    if (rentalResult && rentalResult.style.display === 'block') {
        rentalResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// 显示单个模式的结果
function displayModeResult(mode, yieldRate, formula, paybackDays) {
    const resultDiv = document.getElementById(mode + '-result');
    const percentageElement = document.getElementById(mode + '-percentage');
    const formulaTextElement = document.getElementById(mode + '-formula-text');
    const formulaNumbersElement = document.getElementById(mode + '-formula-numbers');
    const paybackDaysElement = document.getElementById(mode + '-payback');
    const badgeElement = document.getElementById(mode + '-badge');

    // 转换为百分比
    const percentage = (yieldRate * 100).toFixed(2);

    // 设置收益率显示
    percentageElement.textContent = percentage + '%';

    // 解析公式为文字和数字两部分
    const formulaParts = formula.split('<br>');
    if (formulaParts.length === 2) {
        formulaTextElement.textContent = formulaParts[0];
        formulaNumbersElement.textContent = formulaParts[1];
    } else {
        formulaTextElement.textContent = formula;
        formulaNumbersElement.textContent = '';
    }

    // 设置回本天数
    if (paybackDays === Infinity || paybackDays <= 0) {
        paybackDaysElement.textContent = '无法回本';
    } else {
        paybackDaysElement.textContent = paybackDays.toFixed(1) + ' 天';
    }

    // 设置评级徽章
    let badgeText = '';
    let badgeClass = '';

    if (yieldRate > 0.02) {
        badgeText = '优秀';
        badgeClass = 'excellent';
    } else if (yieldRate >= 0.015) {
        badgeText = '良好';
        badgeClass = 'good';
    } else {
        badgeText = '一般';
        badgeClass = 'normal';
    }

    badgeElement.textContent = badgeText;
    badgeElement.className = 'result-badge ' + badgeClass;

    // 显示结果区域
    resultDiv.style.display = 'block';
}

// 显示矿机成本结果
function displaySlaveResult(slaveCost, suitableSlavePrice, goldCupPrice, goldCupExchange) {
    const resultDiv = document.getElementById('slave-result');
    const costDisplayElement = document.getElementById('slave-cost-display');
    const suitablePriceElement = document.getElementById('slave-suitable-price');
    const step1TextElement = document.getElementById('slave-step1-text');
    const step1NumbersElement = document.getElementById('slave-step1-numbers');
    const step2TextElement = document.getElementById('slave-step2-text');
    const step2NumbersElement = document.getElementById('slave-step2-numbers');
    const step3TextElement = document.getElementById('slave-step3-text');
    const step3NumbersElement = document.getElementById('slave-step3-numbers');

    // 获取出租收益和市场数据
    const rentalIncome = parseFloat(document.getElementById('rental-income').value) || 45;
    const eggCost = rentalIncome * 2 * 7; // 630灵石
    const totalSpirit = 1750 + eggCost; // 2380灵石
    const spiritToGoldCup = (totalSpirit / goldCupExchange).toFixed(2); // 28.5金杯
    const totalGoldCups = (parseFloat(spiritToGoldCup) + 25).toFixed(2); // 53.5金杯
    const costPerMachine = (parseFloat(totalGoldCups) / 2).toFixed(2); // 26.75金杯

    // 设置矿机生产成本显示（单个矿机成本 = 总金杯数 ÷ 2）
    costDisplayElement.textContent = costPerMachine + '金杯';

    // 设置合适的矿机价格显示（含税价格 = 不含税价格 ÷ 0.94）
    const suitableSlavePriceWithTax = suitableSlavePrice / 0.94;
    suitablePriceElement.textContent = suitableSlavePriceWithTax.toFixed(2) + '元';

    // 第一行：2只0次宠物繁育2次的说明
    step1TextElement.textContent = '2只0次宠物繁育2次消耗1750灵石+25个金杯+7天时间，变为2个0次宠物+2个矿机';
    step1NumbersElement.textContent = '';

    // 第二行：蛋的成本计算
    step2TextElement.textContent = `2个蛋7天时间成本：${rentalIncome}灵石*2只*7天=${eggCost}灵石`;
    step2NumbersElement.textContent = `(1750+${eggCost})÷${goldCupExchange}=${spiritToGoldCup}金杯；${spiritToGoldCup}金杯+25金杯=2个矿机`;

    // 第三行：最终价格计算（公式区域显示不含税价格）
    step3TextElement.textContent = '矿机成本=总金杯数÷2×金杯最低价';
    step3NumbersElement.textContent = `(${spiritToGoldCup}+25)÷2=${costPerMachine}金杯*${goldCupPrice}元=${suitableSlavePrice.toFixed(2)}元`;

    // 显示结果区域
    resultDiv.style.display = 'block';
}

// 显示收益率结果（旧函数，保留兼容）
function displayYieldResult(yieldRate, formula, paybackDays, mode) {
    const resultDiv = document.getElementById('yield-result');
    const percentageElement = document.getElementById('yield-percentage');
    const formulaElement = document.getElementById('yield-formula');
    const paybackDaysElement = document.getElementById('payback-days');
    const badgeElement = document.getElementById('yield-badge');

    // 转换为百分比
    const percentage = (yieldRate * 100).toFixed(2);

    // 设置收益率显示
    percentageElement.textContent = percentage + '%';

    // 设置公式显示
    formulaElement.innerHTML = formula;

    // 设置回本天数
    if (paybackDays === Infinity || paybackDays <= 0) {
        paybackDaysElement.textContent = '无法回本';
    } else {
        paybackDaysElement.textContent = paybackDays.toFixed(1) + ' 天';
    }

    // 设置评级徽章
    let badgeText = '';
    let badgeClass = '';

    if (yieldRate > 0.02) {
        badgeText = '优秀';
        badgeClass = 'excellent';
    } else if (yieldRate >= 0.015) {
        badgeText = '良好';
        badgeClass = 'good';
    } else {
        badgeText = '一般';
        badgeClass = 'normal';
    }

    badgeElement.textContent = badgeText;
    badgeElement.className = 'result-badge ' + badgeClass;

    // 显示结果区域
    resultDiv.style.display = 'block';

    // 滚动到结果区域
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 清空所有输入数据
function clearAllInputs() {
    // 设置标志，阻止自动填充
    window.userCleared = true;
    
    // 清空基础输入字段
    document.getElementById('pet-price').value = '';
    document.getElementById('pet-price').placeholder = '';
    document.getElementById('gold-cup-exchange').value = '';
    document.getElementById('gold-cup-exchange').placeholder = '';
    document.getElementById('gold-cup-price').value = '';
    document.getElementById('gold-cup-price').placeholder = '';

    // 清空模式特定输入字段
    document.getElementById('rental-income').value = '';
    document.getElementById('rental-income').placeholder = '';
    document.getElementById('convoy-income').value = '';
    document.getElementById('convoy-income').placeholder = '';
    document.getElementById('pvp-cups').value = '';
    document.getElementById('pvp-cups').placeholder = '';
    document.getElementById('slave-cost').value = '';
    document.getElementById('slave-cost').placeholder = '';

    // 隐藏所有结果区域
    document.getElementById('rental-result').style.display = 'none';
    document.getElementById('convoy-result').style.display = 'none';
    document.getElementById('pvp-result').style.display = 'none';
    document.getElementById('slave-result').style.display = 'none';
}

// ==================== 市场数据管理功能 ====================

// 加载市场数据
function loadMarketData() {
    const marketData = JSON.parse(localStorage.getItem('marketData')) || {};

    const goldCupPrice = marketData.goldCupPrice || '--';
    const petPrice = marketData.petPrice || '--';
    const goldCupExchange = marketData.goldCupExchange || '--';

    // 更新显示区域
    document.getElementById('display-gold-cup-price').textContent = goldCupPrice;
    document.getElementById('display-pet-price').textContent = petPrice;
    document.getElementById('display-gold-cup-exchange').textContent = goldCupExchange;
    
    // 自动填充市场最低价到输入框（作为默认值）
    // 如果用户已手动清空，则不再自动填充
    if (!window.userCleared) {
        if (goldCupPrice && goldCupPrice !== '--') {
            document.getElementById('gold-cup-price').value = goldCupPrice;
            document.getElementById('gold-cup-price').placeholder = goldCupPrice;
        }
        if (petPrice && petPrice !== '--') {
            document.getElementById('pet-price').value = petPrice;
            document.getElementById('pet-price').placeholder = petPrice;
        }
        if (goldCupExchange && goldCupExchange !== '--') {
            document.getElementById('gold-cup-exchange').value = goldCupExchange;
            document.getElementById('gold-cup-exchange').placeholder = goldCupExchange;
            
            // 自动计算矿机成本：25 + (1750 + 2*630) / 金杯兑换灵石数量
            const slaveCost = 25 + (1750 + 2 * 630) / parseFloat(goldCupExchange);
            document.getElementById('slave-cost').value = slaveCost.toFixed(2);
            document.getElementById('slave-cost').placeholder = slaveCost.toFixed(2);
        }
    }
}

// 切换编辑模式
function toggleMarketDataEdit() {
    const displayDiv = document.getElementById('market-data-display');
    const editDiv = document.getElementById('market-data-edit');

    if (editDiv.style.display === 'none') {
        // 显示编辑表单
        displayDiv.style.display = 'none';
        editDiv.style.display = 'block';

        // 填充当前数据
        const marketData = JSON.parse(localStorage.getItem('marketData')) || {};
        document.getElementById('market-gold-cup-price').value = marketData.goldCupPrice || '';
        document.getElementById('market-pet-price').value = marketData.petPrice || '';
        document.getElementById('market-gold-cup-exchange').value = marketData.goldCupExchange || '';
    } else {
        // 隐藏编辑表单
        displayDiv.style.display = 'grid';
        editDiv.style.display = 'none';
    }
}

// 保存市场数据
function saveMarketData() {
    const goldCupPrice = document.getElementById('market-gold-cup-price').value.trim();
    const petPrice = document.getElementById('market-pet-price').value.trim();
    const goldCupExchange = document.getElementById('market-gold-cup-exchange').value.trim();

    if (!goldCupPrice || !petPrice || !goldCupExchange) {
        alert('请填写所有市场数据！');
        return;
    }

    const marketData = {
        goldCupPrice: parseFloat(goldCupPrice),
        petPrice: parseFloat(petPrice),
        goldCupExchange: parseInt(goldCupExchange),
        updateTime: new Date().toLocaleString('zh-CN')
    };

    localStorage.setItem('marketData', JSON.stringify(marketData));

    // 更新显示
    loadMarketData();

    // 隐藏编辑表单
    toggleMarketDataEdit();

    alert('市场数据保存成功！');
}

// ==================== 宠物最低价自动获取 ====================

// 获取金杯兑换灵石最低价格
async function fetchGoldCupExchangeMinPrice() {
    const goldCupExchangeElement = document.getElementById('display-gold-cup-exchange');
    
    console.log('开始获取金杯兑换灵石最低价...');
    
    try {
        goldCupExchangeElement.textContent = '加载中...';
        
        const response = await fetch('https://qinyou.art/prod-api/client/market/prop/propList?pageNum=1&pageSize=18&collectionId=1&propId=1&orderByColumn=sell_num&isAsc=', {
            method: 'GET',
            headers: {
                'Clientid': '428a8310cd442757ae699df5d894f051',
                'Sa-Token-Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOiJhcHBfdXNlcjo2MDcwNCIsInJuU3RyIjoiTjNBVWNLemw5cEFId1E1QWFNRkJBVXZHdDN1TmdqZTYiLCJjbGllbnRpZCI6IjQyOGE4MzEwY2Q0NDI3NTdhZTY5OWRmNWQ4OTRmMDUxIiwidGVuYW50SWQiOiIwMDAwMDAiLCJjIjo2MDcwNCwidXNlck5hbWUiOiIxNTU1MzMyMDM1MSIsImRlcHRJZCI6MTEwLCJkZXB0TmFtZSI6Iua4uOaIj-mDqOmXqCIsImRlcHRDYXRlZ29yeSI6IkFBQSJ9.4LfpkHoxag9SNW7_l-7vRRcgj1QldXqF8FPP3ru0azA',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('金杯兑换灵石接口响应状态:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('金杯兑换灵石接口返回数据:', data);
        
        if (data.rows && data.rows.length > 0) {
            // 找到 unitPrice 最低的那条数据
            let minPrice = parseFloat(data.rows[0].unitPrice);
            for (let i = 1; i < data.rows.length; i++) {
                const price = parseFloat(data.rows[i].unitPrice);
                if (price < minPrice) {
                    minPrice = price;
                }
            }
            console.log('获取到金杯兑换灵石最低价格:', minPrice);
            goldCupExchangeElement.textContent = minPrice;
            
            // 自动填充到输入框（作为默认值）
            // 如果用户已手动清空，则不再自动填充
            if (!window.userCleared) {
                const goldCupExchangeInput = document.getElementById('gold-cup-exchange');
                if (goldCupExchangeInput) {
                    goldCupExchangeInput.value = minPrice;
                    goldCupExchangeInput.placeholder = minPrice;
                    
                    // 自动计算矿机成本：25 + (1750 + 2*630) / 金杯兑换灵石数量
                    const slaveCost = 25 + (1750 + 2 * 630) / minPrice;
                    const slaveCostInput = document.getElementById('slave-cost');
                    if (slaveCostInput) {
                        slaveCostInput.value = slaveCost.toFixed(2);
                        slaveCostInput.placeholder = slaveCost.toFixed(2);
                    }
                }
            }
            
            // 保存缓存
            localStorage.setItem('goldCupExchangeMinPrice', minPrice);
            localStorage.setItem('goldCupExchangeMinPriceTime', new Date().toISOString());
        } else {
            console.log('没有金杯兑换灵石数据');
            goldCupExchangeElement.textContent = '--';
        }
    } catch (error) {
        console.error('获取金杯兑换灵石最低价失败:', error);
        
        // 尝试读取缓存
        const cachedPrice = localStorage.getItem('goldCupExchangeMinPrice');
        if (cachedPrice) {
            console.log('使用金杯兑换灵石缓存价格:', cachedPrice);
            goldCupExchangeElement.textContent = `${cachedPrice}`;
        } else {
            console.log('没有金杯兑换灵石缓存数据');
            goldCupExchangeElement.textContent = '--';
        }
    }
}

// 获取金杯最低价格
async function fetchGoldCupMinPrice() {
    const goldCupPriceElement = document.getElementById('display-gold-cup-price');
    
    console.log('开始获取金杯最低价...');
    
    try {
        goldCupPriceElement.textContent = '加载中...';
        
        const response = await fetch('https://qinyou.art/prod-api/client/market/prop/mainPropMarketList?pageNum=1&pageSize=18&orderByColumn=unitPrice&propId=1&isAsc=asc', {
            method: 'GET',
            headers: {
                'Clientid': '428a8310cd442757ae699df5d894f051',
                'Sa-Token-Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOiJhcHBfdXNlcjo2MDcwNCIsInJuU3RyIjoiTjNBVWNLemw5cEFId1E1QWFNRkJBVXZHdDN1TmdqZTYiLCJjbGllbnRpZCI6IjQyOGE4MzEwY2Q0NDI3NTdhZTY5OWRmNWQ4OTRmMDUxIiwidGVuYW50SWQiOiIwMDAwMDAiLCJjIjo2MDcwNCwidXNlck5hbWUiOiIxNTU1MzMyMDM1MSIsImRlcHRJZCI6MTEwLCJkZXB0TmFtZSI6Iua4uOaIj-mDqOmXqCIsImRlcHRDYXRlZ29yeSI6IkFBQSJ9.4LfpkHoxag9SNW7_l-7vRRcgj1QldXqF8FPP3ru0azA',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('金杯接口响应状态:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('金杯接口返回数据:', data);
        
        if (data.rows && data.rows.length > 0) {
            // 取第一个（已经按 unitPrice 升序排列）
            const minPrice = data.rows[0].unitPrice;
            console.log('获取到金杯最低价格:', minPrice);
            goldCupPriceElement.textContent = minPrice;
            
            // 自动填充到输入框（作为默认值）
            // 如果用户已手动清空，则不再自动填充
            if (!window.userCleared) {
                const goldCupPriceInput = document.getElementById('gold-cup-price');
                if (goldCupPriceInput) {
                    goldCupPriceInput.value = minPrice;
                    goldCupPriceInput.placeholder = minPrice;
                }
            }
            
            // 保存缓存
            localStorage.setItem('goldCupMinPrice', minPrice);
            localStorage.setItem('goldCupMinPriceTime', new Date().toISOString());
        } else {
            console.log('没有金杯数据');
            goldCupPriceElement.textContent = '--';
        }
    } catch (error) {
        console.error('获取金杯最低价失败:', error);
        
        // 尝试读取缓存
        const cachedPrice = localStorage.getItem('goldCupMinPrice');
        if (cachedPrice) {
            console.log('使用金杯缓存价格:', cachedPrice);
            goldCupPriceElement.textContent = `${cachedPrice}`;
        } else {
            console.log('没有金杯缓存数据');
            goldCupPriceElement.textContent = '--';
        }
    }
}

// 获取宠物最低价格
async function fetchPetMinPrice() {
    const petPriceElement = document.getElementById('display-pet-price');
    
    console.log('开始获取宠物最低价...');
    
    try {
        petPriceElement.textContent = '加载中...';
        
        const response = await fetch('https://qinyou.art/prod-api/client/market/whaleSpirit/list?pageNum=1&pageSize=50&orderByColumn=unitPrice&isAsc=asc', {
            method: 'GET',
            headers: {
                'Clientid': '428a8310cd442757ae699df5d894f051',
                'Sa-Token-Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOiJhcHBfdXNlcjo2MDcwNCIsInJuU3RyIjoiTjNBVWNLemw5cEFId1E1QWFNRkJBVXZHdDN1TmdqZTYiLCJjbGllbnRpZCI6IjQyOGE4MzEwY2Q0NDI3NTdhZTY5OWRmNWQ4OTRmMDUxIiwidGVuYW50SWQiOiIwMDAwMDAiLCJjIjo2MDcwNCwidXNlck5hbWUiOiIxNTU1MzMyMDM1MSIsImRlcHRJZCI6MTEwLCJkZXB0TmFtZSI6Iua4uOaIj-mDqOmXqCIsImRlcHRDYXRlZ29yeSI6IkFBQSJ9.4LfpkHoxag9SNW7_l-7vRRcgj1QldXqF8FPP3ru0azA',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('接口响应状态:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('接口返回数据:', data);
        
        if (data.rows && data.rows.length > 0) {
            // 取第一个（已经按 unitPrice 升序排列）
            const minPrice = data.rows[0].unitPrice;
            console.log('获取到最低价格:', minPrice);
            petPriceElement.textContent = minPrice;
            
            // 自动填充到输入框（作为默认值）
            // 如果用户已手动清空，则不再自动填充
            if (!window.userCleared) {
                const petPriceInput = document.getElementById('pet-price');
                if (petPriceInput) {
                    petPriceInput.value = minPrice;
                    petPriceInput.placeholder = minPrice;
                }
            }
            
            // 保存缓存
            localStorage.setItem('petMinPrice', minPrice);
            localStorage.setItem('petMinPriceTime', new Date().toISOString());
        } else {
            console.log('没有数据');
            petPriceElement.textContent = '--';
        }
    } catch (error) {
        console.error('获取宠物最低价失败:', error);
        
        // 尝试读取缓存
        const cachedPrice = localStorage.getItem('petMinPrice');
        if (cachedPrice) {
            console.log('使用缓存价格:', cachedPrice);
            petPriceElement.textContent = `${cachedPrice}`;
        } else {
            console.log('没有缓存数据');
            petPriceElement.textContent = '--';
        }
    }
}
