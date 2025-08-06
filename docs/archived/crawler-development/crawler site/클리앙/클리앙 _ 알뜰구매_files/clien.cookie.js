function ClienCookie() {

    const _this = this;

    /**
     * 쿠키 저장 함수
     * @param {string} name - 쿠키 이름
     * @param {any} value - 저장할 데이터 (객체나 문자열)
     * @param {number} days - 쿠키 유효기간 (일 단위, 기본값 365일)
     * @param {string} path - 쿠키 경로 (기본값 '/')
     * @param {string} domain - 쿠키 도메인 (기본값 없음)
     */
    _this.set = function(name, value, days = 365, path = '/', domain = '') {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000) + (9 * 60 * 60 * 1000)); // (KST 9시간 추가)
        const encodedValue = escape(JSON.stringify(value));
        document.cookie = `${name}=${encodedValue}; expires=${expires.toUTCString()}; path=${path};`
            + (domain ? ` domain=${domain};` : ''); // 도메인 옵션 추가
    };


    /**
     * 쿠키 가져오기 함수
     * @param {string} name - 쿠키 이름
     * @returns {any} - 쿠키에 저장된 데이터 (JSON 파싱된 객체나 문자열)
     */
    _this.get = function(name) {
        const nameEQ = name + "=";
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.indexOf(nameEQ) === 0) {
                const decodedValue = unescape(cookie.substring(nameEQ.length));
                try {
                    return JSON.parse(decodedValue); // JSON 파싱된 데이터 반환
                } catch (e) {
                    return decodedValue; // JSON이 아닐 경우 문자열 반환
                }
            }
        }
        return null;
    };

    /**
     * 쿠키 삭제 함수
     * @param {string} name - 쿠키 이름
     * @param {string} path - 쿠키 경로 (기본값 '/')
     * @param {string} domain - 쿠키 도메인 (기본값 없음)
     */
    _this.delete = function(name, path = '/', domain = '') {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`
            + (domain ? ` domain=${domain};` : ''); // 도메인 옵션 추가
    };
}

const clienCookie = new ClienCookie();
