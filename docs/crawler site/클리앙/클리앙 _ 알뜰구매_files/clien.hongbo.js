"use strict";
class Hongbo {
    constructor() {
        this.apiUrl = API_HOST;
        this.baseUrl = BASE_URL;
    }
    hongboLists() {
        $.ajax({
            url: `${this.apiUrl}/hongbo/mainList`,
            type: 'GET',
            success: (hongboInfo) => {
                const html = hongboInfo.map(info => this.createListHtml(info)).join('');
                $("#hongboInfoList").html(html);
            },
            error: (result) => {
                console.log(result);
            }
        });
    }
    hongboList() {
        $.ajax({
            url: `${this.baseUrl}/api/hongbo/pop`,
            type: 'GET',
            success: (hongboInfo) => {
                if (hongboInfo.boardSn != null) {
                    const html = this.createSinglePostHtml(hongboInfo);
                    $("#hongboInfoList").html(html).trigger("create");
                }
            },
            error: (result) => {
                console.log(result);
            }
        });
    }
    reWrite() {
        const url = `${this.apiUrl}/hongbo/reArticle`;
        $.ajax({
            url: url,
            type: 'POST',
            data: {
                boardCd: app.env.boardCd,
                boardSn: app.env.boardSn
            },
            dataType: 'json',
            success: (result) => {
                alert("최신글로 등록이 완료 되었습니다.");
                location.href = `${this.baseUrl}/board/${app.env.boardCd}/${result.boardSn}`;
            },
            error: (request) => {
                if (request.status === 400) {
                    const err = JSON.parse(request.responseText);
                    alert(err.message);
                    $('*[data-role=btn-write]').prop('disabled', false);
                }
                else {
                    const errUrl = `${this.apiUrl}/ajax/error`;
                    const param = {
                        params: request.responseText,
                        type: 'Article',
                        location: 'write',
                        boardCd: app.env.boardCd
                    };
                    util.ajaxError(errUrl, param);
                }
            }
        });
    }
    createListHtml(info) {
        return `
            <div class="list_item">
                <div class="list_title">
                    <a class="list_subject" href="${this.baseUrl}/board/${info.boardCd}/${info.boardSn}">
                        <span class="shortname">·</span>
                        <span class="subject">${info.subject}</span>
                    </a>
                </div>
            </div>
        `;
    }
    createSinglePostHtml(hongboInfo) {
        return `
            <div class="list_symph"><span class="label_ad">AD</span></div>
            <div class="list_title">
                <a class="list_subject" href="${this.baseUrl}/board/${hongboInfo.boardCd}/${hongboInfo.boardSn}">
                    ${hongboInfo.subject}
                </a>
            </div>
            <div class="list_author">
                <span class="nickname"><span>${hongboInfo.member.nick}</span></span>
            </div>
            <div class="list_hit">
                <span class="hit">${hongboInfo.hitCount}</span>
            </div>
            <div class="list_time">
                <span class="time popover">${hongboInfo.insertDate.substring(5, 10)}
                    <span class="timestamp">${hongboInfo.insertDate}</span>
                </span>
            </div>
        `;
    }
}
const hongbo = new Hongbo();
