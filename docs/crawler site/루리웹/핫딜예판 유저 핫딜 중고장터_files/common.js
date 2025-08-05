const header = () => {
    const headerElement = document.querySelector('#header');
    if (!headerElement) return;

    setTimeout(() => {
        document.querySelector('.ruliweb_icon').style.visibility = '';
    }, 300);

    const menu = headerElement.querySelector('.menu');
    const family = menu.querySelector('.family');

    const siteMod = document.querySelector('#site_mod');
    if (siteMod && siteMod.value.includes('dev')) {
        document.querySelector('.header_search_wrapper button').style.backgroundColor = '#ffb1ce';
    }

    dark_mode();
    highlight();
    setFamily();
    getFamilyList();
    searchBoardAsync();
    window.app.init_quickmenu2_visit();
    window.app.user_block_init();

    if(document.querySelector('.right_best_title')) {
        document.querySelector('.right_best_title').addEventListener("mouseenter", () => {
            if (document.querySelector('.hit_title')) {
                document.querySelector('.hit_title').classList.remove('active');
            }
            if (document.querySelector('.right_best_title')) {
                document.querySelector('.right_best_title').classList.add('active');
            }
            if (document.querySelector('.hit_list')) {
                document.querySelector('.hit_list').classList.remove('active');
                document.querySelector('.hit_list').style.display = 'none';
            }
            if (document.querySelector('.right_best_list')) {
                document.querySelector('.right_best_list').classList.add('active');
                document.querySelector('.right_best_list').style.display = 'block';
            }
        });
    }

    if(document.querySelector('.hit_title')) {
        document.querySelector('.hit_title').addEventListener("mouseenter", () => {
            if (document.querySelector('.right_best_title')) {
                document.querySelector('.right_best_title').classList.remove('active');
            }
            if (document.querySelector('.hit_title')) {
                document.querySelector('.hit_title').classList.add('active');
            }
            if (document.querySelector('.right_best_list')) {
                document.querySelector('.right_best_list').classList.remove('active');
                document.querySelector('.right_best_list').style.display = 'none';
            }
            if (document.querySelector('.hit_list')) {
                document.querySelector('.hit_list').classList.add('active');
                document.querySelector('.hit_list').style.display = 'block';
            }
        });
    }

    function setFamily() {
        family.querySelector('.family_text').addEventListener('click', () => {
            family.classList.toggle('active');
        });
    }

    function dark_mode() {
        if (document.querySelector('#page_mode_icon') === null) return;
        if (document.querySelector('img.ruliweb_icon') === null) return;
        let current_theme = window.matchMedia('(prefers-color-scheme: light)').matches;
        let current = window.app.get_cookie('page_mode');
        if ((current === '' && (current_theme || (!current_theme && !window.matchMedia('(prefers-color-scheme: dark)').matches))) || current === 'light_mode') {
            document.querySelector('#page_mode_icon').classList.remove('icon-moon');
            document.querySelector('#page_mode_icon').classList.add('icon-sun');
            document.querySelector('img.ruliweb_icon').src = 'https://img.ruliweb.com/img/2016/common/ruliweb_bi.png'
        } else {
            document.querySelector('#page_mode_icon').classList.remove('icon-sun');
            document.querySelector('#page_mode_icon').classList.add('icon-moon');
            document.querySelector('img.ruliweb_icon').src = 'https://img.ruliweb.com/img/2016/common/ruliweb_bi_classic.png'
            if (document.querySelector('.family_menu')) {
                $('.family_menu').addClass('dark');
            }
        }
        document.querySelector('img.ruliweb_icon').addEventListener('load', function (e) {
            e.target.style.display = 'block'
        })
        document.querySelector('#page_mode_icon').style.display = 'inline';

        window.app.toggle_page_mode = function () {
            let current = window.app.get_cookie('page_mode');
            let current_theme = window.matchMedia('(prefers-color-scheme: light)').matches;
            if (current === '') {
                current = current_theme ? 'light_mode' : 'dark_mode';
            }
            if (current === 'light_mode') {
                window.app.set_cookie('page_mode', 'dark_mode', 7);
                document.querySelector('#page_mode_icon').classList.remove('icon-sun');
                document.querySelector('#page_mode_icon').classList.add('icon-moon');
                document.querySelector('img.ruliweb_icon').src = 'https://img.ruliweb.com/img/2016/common/ruliweb_bi_classic.png'
                if (document.querySelector('.family_menu')) {
                    $('.family_menu').addClass('dark');
                }
            } else {
                window.app.set_cookie('page_mode', 'light_mode', 7);
                document.querySelector('#page_mode_icon').classList.remove('icon-moon');
                document.querySelector('#page_mode_icon').classList.add('icon-sun');
                document.querySelector('img.ruliweb_icon').src = 'https://img.ruliweb.com/img/2016/common/ruliweb_bi.png'
                if (document.querySelector('.family_menu')) {
                    $('.family_menu').removeClass('dark');
                }
            }
            document.querySelector('body').classList.remove((current === 'dark_mode') ? 'dark_mode' : 'light_mode');
            document.querySelector('body').classList.add((current === 'dark_mode') ? 'light_mode' : 'dark_mode');
        }

        current = window.app.get_cookie('page_mode') !== '' ? window.app.get_cookie('page_mode') : window.matchMedia('(prefers-color-scheme: light)').matches ? 'light_mode' : 'dark_mode';
        if (current === 'dark_mode') {
            $('.ad_background').append('<div class="darkfix"></div>');
        }
    }

    function applyTheme(mode) {
        const pageModeIcon = document.querySelector('#page_mode_icon');
        const ruliwebIcon = document.querySelector('img.ruliweb_icon');
        const familyMenu = document.querySelector('.family_menu');

        if (mode === 'light_mode') {
            pageModeIcon.classList.replace('icon-moon', 'icon-sun');
            ruliwebIcon.src = 'https://img.ruliweb.com/img/2016/common/ruliweb_bi.png';
            if (familyMenu) familyMenu.classList.remove('dark');
        } else {
            pageModeIcon.classList.replace('icon-sun', 'icon-moon');
            ruliwebIcon.src = 'https://img.ruliweb.com/img/2016/common/ruliweb_bi_classic.png';
            if (familyMenu) familyMenu.classList.add('dark');
        }
    }

    function searchBoardAsync() {
        const searchInput = document.querySelector('#search');
        const searchResult = document.querySelector('#async_search_result');
        let timestamp = 0;

        searchInput.addEventListener('keyup', (event) => {
            if ([40, 38, 13].includes(event.keyCode)) return;

            const searchKey = searchInput.value.trim();
            if (!searchKey) {
                searchResult.style.display = 'none';
                searchResult.innerHTML = '';
                return;
            }

            const post = { search_key: searchKey, time: new Date().getTime() };
        
            $.ajax({
                url: util_getUrl('url_api_ssl') + '/procAsyncSearchBoard',
                data: post,
                success: function (res) {
                    if (timestamp > res.t) return;
                    if (res.html) {
                        searchResult.innerHTML = res.html;
                        searchResult.style.display = 'block';
                        timestamp = res.t;
                    }
                },
                error: function (xhr, status, error) {
                    console.error('Error:', error)
                }
            });
        });

        searchResult.addEventListener('click', (event) => {
            if (event.target.classList.contains('async_search_close')) {
                searchResult.style.display = 'none';
                searchResult.innerHTML = '';
            }
        });
    }

    function getFamilyList() {
        const btn = document.querySelector('.family .family_text');
        const target = document.querySelector('#family_wrapper');

        if (target) {
            target.style.display = 'none';
            btn.addEventListener('click', () => {
                if (!target.innerHTML) {
                    fetch(`${window.util_getUrl('url_api_ssl')}/get_family_list`, {
                        method: 'GET',
                    })
                        .then(response => response.json())
                        .then(res => {
                            target.innerHTML = res.html;
                            target.style.display = 'block';
                        })
                        .catch(error => console.error('Error:', error));
                } else {
                    target.style.display = target.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
    }

    function highlight() {
        const currentPageUrl = window.location.pathname;
        const menuItems = document.querySelectorAll('#gnb_menu_list li.menu_item');

        menuItems.forEach(item => {
            if (!item.classList.contains('gnb_moremore')) {
                const menuItemLink = item.querySelector('a');
                const menuItemUrl = menuItemLink?.href.replace(location.origin, '').split('/').slice(0, 2).join('/');

                if (menuItemLink && currentPageUrl.startsWith(menuItemUrl)) {
                    menuItemLink.classList.add('highlight');
                }
            }
        });
    }
};






const footer = () => {
    if (document.querySelector("#footer") === null) return;

    const cs_popup = window.app.popup();
    window.app.cs_popup = () => {
        cs_popup.title("문의하기");
        cs_popup.content(
            `<p class="text_left">고객의 소리는 <strong>ruli@ruliweb.com</strong>을 통해서 받고 있습니다. 제안사항이나 문의사항은 위 주소로 이메일 보내주시기 바랍니다.</p><br><p class="text_left"><a href="https://bbs.ruliweb.com/etcs/board/10/read/112">불법촬영물 등에 대한 신고·삭제요청 링크</a></p><br><p>감사합니다.</p><br>`
        );
        cs_popup.submit("확인");
        cs_popup.action(() => {
            cs_popup.close();
        });
        cs_popup.show();
    };

    const idle_refresh = () => {
        let is_white = false;
        let excute_count = 0;
        let interval_lock = false;
        const white_list = ["#main_top", ".contents_main", "#mCenter"];

        white_list.forEach(selector => {
            if (document.querySelector(selector) !== null) {
                is_white = true;
            }
        });

        if (!is_white) return;

        setInterval(() => {
            if (!interval_lock) {
                excute_count++;
            }
            if (excute_count >= 5) {
                excute_count = 0;
                location.reload();
            }
        }, 1000 * 60);

        document.addEventListener('mousemove', () => {
            excute_count = 0;
        });

        window.addEventListener('blur', () => {
            interval_lock = false;
        });

        window.addEventListener('focus', () => {
            excute_count = 0;
            interval_lock = true;
        });
    };

    idle_refresh();

    let push_bar = $("#push_bar");
    let notice_bar = $("#notice_bar");
    let push_Interval;
    if (notice_bar.length > 0 || push_bar.length > 0) {
        push_check();
        push_Interval = setInterval(push_check, 60000);
    }

    function push_check() {
        var post = {
            push_id: '',
            s_token: '',
            client_mode: 'd',
        };
        if (app.get_cookie("push_id") !== undefined) {
            post.push_id = app.get_cookie("push_id");
        }
        if (app.get_cookie("s_token") !== undefined) {
            post.s_token = app.get_cookie("s_token");
        }
        if ($('body').hasClass('mobile')) {
            post.client_mode = 'm';
        }
        $.ajax({
            url: util_getUrl("url_api_ssl") + "/getPush",
            type: "POST",
            dataType: "json",
            data: post,
            success: function (res) {
                if (res.success) {
                    push_set(res);
                    // clearInterval(push_Interval);
                }
            },
            error: function (xhr, status, error) {
                // console.log("ajax failure :" + error);
                clearInterval(push_Interval);
            }
        });
    }


    function push_set(res) {
        let notice_bar = $("#notice_bar");
        let push_bar = $("#push_bar");
        let html__ = '';
        push_bar.html("");
        push_bar.removeClass('active');
        push_bar.hide();
        notice_bar.removeClass('include_msg');
        notice_bar.removeClass('active');
        notice_bar.css('background-color', "");
        notice_bar.hide();

        if (notice_bar.length > 0) {
            if (res.type !== undefined) {
                switch (res.type) {
                    case 'ACH':
                        html__ = "<a class='notice_common' href='" + res.link + "'>" + res.message + "</a><i class='icon-remove close_push'></i>";
                        notice_bar.addClass('include_msg');
                        notice_bar.addClass('active');
                        notice_bar.html(html__);
                        notice_bar.show();
                        notice_bar.find(".close_push").on("click", function () {
                            notice_bar.hide();
                            notice_bar.removeClass('include_msg');
                            notice_bar.removeClass('active');
                            notice_bar.css('background-color', "");
                            $.ajax({
                                url: util_getUrl('url_api_ssl') + '/close_push_ach',
                                type: 'GET',
                                dataType: "json",
                                xhrFields: {
                                    withCredentials: true
                                }
                            });
                        });
                        break;
                    case 'C':
                    case 'CC':
                    case 'M':
                    case 'A':
                    case 'UR':
                        html__ = "<a class='notice_common' href='" + res.link + "'>" + res.message + "</a><i class='icon-remove close_push'></i>";
                        notice_bar.addClass('include_msg');
                        notice_bar.addClass('active');
                        notice_bar.html(html__);
                        notice_bar.show();
                        if (res.unread_notify > 0) {
                            $('.btn_inbox').find('.notify_count').html(res.unread_notify);
                            $('.btn_inbox').find('icon-bell-alt').addClass('color-red');
                        } else {
                            $('.btn_inbox').find('.notify_count').html('');
                            $('.btn_inbox').find('icon-bell-alt').removeClass('color-red');
                        }
                        notice_bar.find(".notice_common").on("click", function () {
                            app.click_notify(res.notify_id, res.link);
                        });
                        notice_bar.find(".close_push").on("click", function () {
                            notice_bar.hide();
                            notice_bar.removeClass('include_msg');
                            notice_bar.removeClass('active');
                            notice_bar.css('background-color', "");
                        });
                        break;

                }
            }
            if (res.color !== undefined) {
                notice_bar.css('background-color', res.color);
            }
        }
        if (res.push_id > 0 && push_bar.length > 0) {
            app.set_cookie("push_id", res.push_id, 1, ".ruliweb.com");
            let thumbnail = '<div class="push_thumbnail" style="background-image: url(https://img.ruliweb.com/img/2016/common/ruliweb_thumbnail_empty6.png); background-repeat: no-repeat; background-position: center; background-size: cover; width: 64px; height: 46px;"></div>';

            if (typeof res.thumbnail !== "undefined") {
                if (
                    res.thumbnail !== undefined &&
                    res.thumbnail !== null &&
                    res.thumbnail !== "" &&
                    res.thumbnail !== " "
                ) {
                    thumbnail = '<div class="push_thumbnail" style="background-image: url(' + res.thumbnail + '); background-repeat: no-repeat; background-position: center; background-size: cover; width: 64px; height: 46px;"></div>';
                }
            }
            let push = '';
            push += '<div class="close_push row"><i class="icon-remove pull-right"></i></div>';
            push += "<div class='notice_common'>";
            push += '<div class="thumb_wrapper">';
            push +=
                '<a class="thumb_link" href="' +
                res.link +
                '" title="' +
                res.subject +
                '">' +
                thumbnail +
                "</a>";
            push += "</div>";
            push += '<div class="text_wrapper">';
            push +=
                '<a class="text_link" href="' +
                res.link +
                '" title="' +
                res.subject +
                '">';
            push +=
                '<strong class="push_text text_over">' + res.subject + "</strong>";
            push += "</a>";
            push += '<span class="push_info_text">[알람 메세지입니다.]</span>';
            push += "</div>";
            push += "</div>";
            push_bar.append(push);
            push_bar.fadeIn(500);
            // .delay(10000)
            // .fadeOut(500);
            push_bar.addClass('active');
            push_bar.on("click", ".close_push", function () {
                push_bar.hide();
                push_bar.removeClass('active');
            });
        }
    }
};
const ad = () => {
    function ad_nbp_container(nbp_container, ads) {
        const _pageSizeLimit = ads.length;

        if (ads !== undefined && ads.length > 0) {
            const nbp_apply_url = 'https://ads.naver.com/sa';
            const searchParams = new URLSearchParams(window.location.search);
            const search_key = searchParams.get('search_key');
            const q = searchParams.get('q');

            const header = document.createElement('div');
            header.className = 'nbp_header';
            header.innerHTML = `
                <div class="nbp_icon"></div>
                <div class="nbp_apply"><a href="${nbp_apply_url}" target="_blank">등록하기</a></div>
            `;
            nbp_container.appendChild(header);

            const list = document.createElement('ul');
            list.className = 'nbp_list row';
            nbp_container.appendChild(list);

            for (let i = 0; i < _pageSizeLimit; i++) {
                if (ads[i] === undefined) {
                    break;
                }

                if (search_key) {
                    ads[i].description = ads[i].description.replace(search_key, `<strong>${search_key}</strong>`);
                }
                if (q) {
                    ads[i].description = ads[i].description.replace(q, `<strong>${q}</strong>`);
                }

                let item_clickUrl_icon = '';
                if (ads[i].isTalkTalkIconEnabled) item_clickUrl_icon = '<i class="talktalk" style="margin-left: 5px;">TalkTalk</i>';
                if (ads[i].isNaverLoginIconEnabled) item_clickUrl_icon = '<i class="naverlogin" style="margin-left: 5px;">NaverLogin</i>';
                if (ads[i].naverPayIconType === 1) item_clickUrl_icon = '<i class="npay" style="margin-left: 5px;">NPay</i>';
                if (ads[i].naverPayIconType === 2) item_clickUrl_icon = '<i class="npayplus" style="margin-left: 5px;">NPay Plus</i>';

                const item_num = `<div class="nbp_list_item_num">${i + 1}</div>`;
                const item_domain = `<a class="nbp_list_item_domain" target="_blank" aria-label="ad" href="${ads[i].clickUrl}">${ads[i].displayUrl}</a>${item_clickUrl_icon}`;
                const item_title = `<a class="nbp_list_item_title" target="_blank" aria-label="ad" href="${ads[i].clickUrl}"><strong>${ads[i].headline}</strong></a>`;
                const item_desc = `<br><a class="nbp_list_item_desc" target="_blank" aria-label="ad" href="${ads[i].clickUrl}">${ads[i].description}</a>`;
                let item_thumb = '';

                if (ads[i].imageExtension) {
                    item_thumb = `
                        <a class="nbp_list_item_thumb border_box" target="_blank" aria-label="ad" href="${ads[i].imageExtension.clickUrl}">
                            <div style="background: url(${ads[i].imageExtension.imageUrl}) 0 0 no-repeat; background-size: cover;"></div>
                        </a>
                    `;
                }

                const listItem = document.createElement('li');
                const colClass = ads.length % 2 === 0 ? 'col col_6' : 'col_12';
                listItem.className = `nbp_list_item border_box ${colClass} mcol_12${item_thumb ? ' nbp_is_thumb' : ''}`;
                listItem.innerHTML = `
                    <div class="nbp_list_item_link_wrapper">
                        <div class="col col_8 border_box" style="padding-left: 25px; padding-right: 5px;">
                            ${item_num}
                            ${item_thumb}
                            ${item_title}
                            ${item_desc}
                        </div>
                        <div class="col col_4">
                            ${item_domain}
                        </div>
                    </div>
                `;
                list.appendChild(listItem);
            }

            nbp_container.classList.remove('default', 'screen_out');
        } else {
            nbp_container.remove();
        }
    }
    function ad_nbp_container_2(ad_nbp_container_2, ads) {
        if (!ad_nbp_container_2 || !ads || ads.length < 1) return;
        let adHtml = '';
        ads.forEach(adData => {
            adHtml += `
            <p style="padding-left: 20px;">
                <a  href="${adData.clickUrl}" target="_blank" style="color: #999;font-size: 11px;padding: 1px 0;" aria-label="ad">
                    <strong>${adData.headline}</strong>
                </a>
                <br>
                <a href="${adData.clickUrl}" target="_blank" style="word-wrap: break-word;word-break: break-word;font-size: 13px;line-height: 21px;" aria-label="ad">
                    ${adData.description}
                    <br>
                    ${adData.displayUrl}
                </a>
            </p>
            `;
        });
        ad_nbp_container_2.innerHTML = adHtml;
    }
    function ad_nbp_container_3(nbp_container_3, ads) {
        if (!nbp_container_3 || !ads || ads.length < 1) return;
        let adHtml = '';
        ads.forEach(adData => {
            adHtml += `
            <p style="padding: 15px;">
                <span class="ad_nbp_icon" style="display: inline-block; width: 26px; height: 16px; text-align: center; font-family: Sans-serif; font-size: 10px; font-weight: bold; border: 1px solid #aaa; color: #aaa; border-radius: 4px;">
                광고
                </span>
                <a href="${adData.clickUrl}" target="_blank" style="font-size: 13px; padding: 1px 0;font-family: Sans-serif;" aria-label="ad">
                <strong>${adData.headline}</strong>
                </a>
                <br>
                <a href="${adData.clickUrl}" target="_blank" style="word-wrap: break-word;word-break: break-word;font-size: 13px;line-height: 21px;" aria-label="ad">
                <span>${adData.description}</span>
                <br>
                <span>${adData.displayUrl}</span>
                </a>
            </p>
            `;
        });
        nbp_container_3.innerHTML = adHtml;
    }
    function ad_nbp_container_4(nbp_container_4, ads) {
        if (!nbp_container_4 || !ads || ads.length === 0) return;
        let adHtml = '';
        ads.forEach(adData => {
            adHtml += `
                <p >
                    <span class="nbp_text_1">파워링크</span>
                    <span class="nbp_text_2">광고</span>
                    <a href="${adData.clickUrl}" target="_blank" style="padding: 1px 0;" aria-label="ad">
                    <strong class="nbp_text_3">${adData.headline}</strong>
                    </a>
                    <a href="${adData.clickUrl}" target="_blank" style="word-wrap: break-word;word-break: break-word;" aria-label="ad">
                    <span class="nbp_text_4">${adData.description}</span>
                    </a>
                </p>
            `;
        });
        nbp_container_4.innerHTML = adHtml;
    }

    function loadScript(src) {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    function run (retryCount = 0) {
        if (retryCount > 2) return;

        let total = 0;
        const nbpContainers = document.querySelectorAll('.nbp_common');
        if (nbpContainers.length > 0) {
            nbpContainers.forEach(container => {
                const dataItem = parseInt(container.getAttribute('data-item')) || 0;
                total += dataItem;
            });
        }
        console.log('nbp dataItem Total:', total);
        if(total === 0) return;

        loadScript('https://ssl.pstatic.net/adimg3.search/adpost/js/adpost_show_ads_v2.min.js')
        .then(() => {
            if (typeof window.NAVER_ADPOST_V2 !== 'function') return;
            const naver_ads_data = {
                pageSize: `${total}`,
                channel: "ruliweb.ch1",
                keywordGroup: "루리웹_공통",
                url: window.location.href,
                title: document.querySelector('meta[name="title"]').getAttribute('content') || "Default Title",
                content: (document.querySelector('meta[name="description"]').getAttribute('content') || "Default Title").substring(0, 333).trim().replace(/(\r\n\t|\n|\r\t)/gm, ""),
            };
            if(!naver_ads_data.url.includes('/read/')) {
                delete naver_ads_data.title;
                delete naver_ads_data.content;
            }
            const urlParams = new URLSearchParams(window.location.search);
            const searchKey = urlParams.get('search_key') || urlParams.get('q') || urlParams.get('query');
            if (searchKey && urlParams.get('search_type') !== 'member_srl') {
                naver_ads_data.query = searchKey;
                naver_ads_data.channel = "ruliweb.ch2";
                delete naver_ads_data.keywordGroup;
            }
            console.log('naver_ads_data', naver_ads_data);
            window.NAVER_ADPOST_V2(naver_ads_data);
            window.handle_naver_ads_response = function (response) {
                console.log('response', response);
                if (response && response.ads) {
                    const ads = response.ads;
                    window.ads = ads;
                    // console.log('ads',ads);
                    const nbpContainers = document.querySelectorAll('.nbp_common');
                    if (nbpContainers.length > 0) {
                        nbpContainers.forEach(container => {
                            const dataItem = parseInt(container.getAttribute('data-item')) || 0;
                            const dataType = parseInt(container.getAttribute('data-type')) || 0;
                            if(dataItem === 0) return;
                            if(dataType === 0) return;
                            const extractedAds = ads.splice(0, dataItem);
                            switch (dataType) {
                                case 1:
                                    //pc 기본형
                                    ad_nbp_container(container, extractedAds);
                                    break;
                                case 2:
                                    //pc 댓글
                                    ad_nbp_container_2(container, extractedAds);
                                    break;
                                case 3:
                                    //pc 베스트 우측 상단
                                    ad_nbp_container_3(container, extractedAds);
                                    break;
                                case 4:
                                    //pc 프로필
                                    ad_nbp_container_4(container, extractedAds);
                                    break;
                            }
                        });  
                    }
                } else {
                    setTimeout(() => {
                        run(retryCount + 1);
                    }, 2000);
                }
            }
        });
    }

    run();

};

window.login = function() {
    // 현재 페이지의 URL을 redirect_url 파라미터로 추가
    const url = "https://user.ruliweb.com/member/login?is_iframe=1&redirect_url=" + encodeURIComponent(window.location.href);
    // 기존 모달이 있으면 제거
    $('.custom-url-modal-overlay').remove();

    // 오버레이와 모달 생성
    const overlay = $(`
        <div class="custom-url-modal-overlay" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); z-index: 99999; display: flex; align-items: center; justify-content: center;">
            <div class="custom-url-modal-content" style="
                background: #fff;
                width: 100%;
                height: 100%;
                position: relative;
                box-sizing: border-box;
                ">
                <button class="custom-url-modal-close" style="
                    position: absolute; top: 10px; right: 10px; z-index: 2; font-size: 2em; background: none; border: none; cursor: pointer;">×</button>
                <div class="custom-url-modal-body" style="text-align: center;">
                    <span>불러오는 중...</span>
                </div>
            </div>
        </div>
    `);

    $('body').append(overlay);

    // 닫기 버튼
    overlay.on('click', '.custom-url-modal-close', function() {
        overlay.remove();
    });
    // 오버레이 클릭시 닫기 (모달 바깥 클릭)
    overlay.on('click', function(e) {
        if (e.target === this) overlay.remove();
    });

    // iframe 삽입
    overlay.find('.custom-url-modal-body').html(`
        <iframe id="custom-login-iframe" src="${url}" style="width: 100vw; height: 100vh; border:none;" frameborder="0" allowfullscreen></iframe>
    `);

    // 로그인 완료시 부모창 새로고침을 위한 메시지 리스너
    window.addEventListener('message', function handler(e) {
        // 도메인 체크 (보안)
        if (!e.origin.endsWith('.ruliweb.com')) return;
        // e.data 벨리데이션
        if (
            typeof e.data === 'object' &&
            e.data !== null &&
            e.data.type === "login:success" &&
            typeof e.data.redirect_url === 'string' &&
            e.data.redirect_url.length > 0
        ) {
            overlay.remove();
            location.href = decodeURIComponent(e.data.redirect_url);
        }
    });
};


document.addEventListener('DOMContentLoaded', header);
document.addEventListener('DOMContentLoaded', footer);
document.addEventListener('DOMContentLoaded', ad);
