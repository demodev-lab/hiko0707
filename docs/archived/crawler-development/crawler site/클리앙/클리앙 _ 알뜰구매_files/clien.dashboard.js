"use strict";
class Dashboard {
    constructor() {
        var _a;
        this.boardCd = ((_a = document.getElementById('boardCd')) === null || _a === void 0 ? void 0 : _a.value) || '';
        this.dashboardElement = document.getElementById('dashboard');
        this.dashboardText = document.getElementById('dashboardText');
        this.dashboardClass = document.getElementById('dashboardClass');
        this.init();
    }
    dashboard() {
        if (this.dashboardElement) {
            this.dashboardElement.style.display = this.dashboardElement.style.display === 'none' ? 'block' : 'none';
            const displayState = this.dashboardElement.style.display;
            localStorage.setItem(`DASHBOARD_NAME_${this.boardCd}`, displayState);
            this.updateText();
        }
    }
    loadDashboardSetting() {
        const dashboardSetting = localStorage.getItem(`DASHBOARD_NAME_${this.boardCd}`);
        if (this.dashboardElement) {
            this.dashboardElement.style.display = dashboardSetting || 'block';
        }
        this.updateText();
    }
    updateText() {
        var _a;
        if (((_a = this.dashboardElement) === null || _a === void 0 ? void 0 : _a.style.display) === 'none') {
            if (this.dashboardText)
                this.dashboardText.textContent = '열기';
            if (this.dashboardClass) {
                this.dashboardClass.classList.remove('fa-caret-up');
                this.dashboardClass.classList.add('fa-caret-down');
            }
        }
        else {
            if (this.dashboardText)
                this.dashboardText.textContent = '접기';
            if (this.dashboardClass) {
                this.dashboardClass.classList.remove('fa-caret-down');
                this.dashboardClass.classList.add('fa-caret-up');
            }
        }
    }
    init() {
        const validBoardCds = [
            'cm_bike',
            'cm_golf',
            'cm_lol',
            'cm_surfing',
            'cm_soccer',
            'jirum',
            'cm_bts',
        ];
        if (validBoardCds.indexOf(this.boardCd) !== -1) {
            this.loadDashboardSetting();
        }
    }
}
const dashboard = new Dashboard();
