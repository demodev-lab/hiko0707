"use strict";
class Clien {
    constructor() {
        this.init();
    }
    init() {
        this.displayCurrentYear("nowYear");
    }
    deleteViewCookie() {
        clienCookie.delete("P2M", "/", COOKIE_DOMAIN);
        location.href = document.location.href.replace("www", "m");
    }
    displayCurrentYear(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = new Date().getFullYear().toString();
        }
    }
}
const clien = new Clien();
