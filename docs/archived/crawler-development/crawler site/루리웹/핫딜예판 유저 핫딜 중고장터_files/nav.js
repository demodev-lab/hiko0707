

const nav = () => {
    if (!document.querySelector('#nav')) return;
    
    const is_extension = () => {
        const elm = document.querySelector('#nav');

        if (elm.querySelectorAll('.is_extension').length > 0) {
            // elm.querySelectorAll('.is_extension .nav_name').forEach(navName => {
            //     let is_open = 'false';
            //     if (navName.dataset.fid !== undefined) {
            //         is_open = window.localStorage.getItem(navName.dataset.fid);
            //         if (is_open === 'true') {
            //             navName.closest('.is_extension').classList.add('active');
            //         }
            //         if (is_open === 'false') {
            //             navName.closest('.is_extension').classList.remove('active');
            //         }
            //     }
            // });

            elm.querySelectorAll('.is_extension .nav_name').forEach(navName => {
                navName.addEventListener('click', e => {
                    if (navName.dataset.ftype === undefined) return;
                    if (navName.dataset.ftype === 'l') return;
                    navName.closest('.is_extension').classList.toggle('active');
                });
            });
        }
    };

    is_extension();

    
    function nav_search_init () {
        function ch2pattern(ch) {
            var offset = 44032; /* '가'의 코드 */
            // 한국어 음절
            if (/[가-힣]/.test(ch)) {
                var chCode = ch.charCodeAt(0) - offset;
                // 종성이 있으면 문자 그대로를 찾는다.
                if (chCode % 28 > 0) {
                    return ch;
                }
                var begin = Math.floor(chCode / 28) * 28 + offset;
                var end = begin + 27;
                return "[\\u" + begin.toString(16) + "-\\u" + end.toString(16) + "]";
            }
            // 한글 자음
            if (/[ㄱ-ㅎ]/.test(ch)) {
                var con2syl = {
                    'ㄱ': '가'.charCodeAt(0),
                    'ㄲ': '까'.charCodeAt(0),
                    'ㄴ': '나'.charCodeAt(0),
                    'ㄷ': '다'.charCodeAt(0),
                    'ㄸ': '따'.charCodeAt(0),
                    'ㄹ': '라'.charCodeAt(0),
                    'ㅁ': '마'.charCodeAt(0),
                    'ㅂ': '바'.charCodeAt(0),
                    'ㅃ': '빠'.charCodeAt(0),
                    'ㅅ': '사'.charCodeAt(0)
                };
                var begin = con2syl[ch] || (ch.charCodeAt(0) - 12613 /* 'ㅅ'의 코드 */) * 588 + con2syl['ㅅ'];
                var end = begin + 587;
                return "[" + ch + "\\u" + begin.toString(16) + "-\\u" + end.toString(16) + "]";;
            }
            return ch;
        }

        if ($('body').hasClass('mobile')) {
            $('#nav .nav_list').before('<div class="row"><div id="nav_search_input_wrapper"><i class="icon-large icon-search col col_1 line_h_40"></i><input id="nav_search" class="col col_11 inline_block padding_none line_h_40" type="text" value="" placeholder="게시판찾기" autocomplete="off" /></div><ul id="nav_search_result" class="nav_list col col_12""></ul></div>');
        }

        var input = document.getElementById("nav_search");
        var result = document.getElementById("nav_search_result");
        var t = 0;

        input.addEventListener("keyup", function (event) {
            if (event.keyCode === '40' || event.keyCode === '38' || event.keyCode === '13') {
                $(result).removeClass('active');
                return false;
            }
            var input_ = document.querySelector("#nav_search");
            var search_key = input_.value;

            if (search_key === undefined || search_key === null || search_key === '') {
                $('#nav .nav_wrapper > .nav_list > .menu').show();
                result.innerHTML = '';
                $(result).removeClass('active');
                $(document).trigger('nav_open');
                return false;
            }
            if(search_key.length < 2) {
                $('#nav .nav_wrapper > .nav_list > .menu').show();
                result.innerHTML = '';
                $(result).removeClass('active');
                $(document).trigger('nav_open');
                return false;
            }
            $('#nav .nav_wrapper > .nav_list > .menu').hide();

            var post = {};
            post.search_key = search_key;
            post.time = new Date().getTime();

            $.ajax({
                url: util_getUrl('url_api_ssl') + '/procAsyncSearchBoard',
                type: 'get',
                data: post,
                success: function (res) {
                    if (t > res.t) {
                        return false;
                    }
                    if (res.html != undefined) {
                        if (res.html.length > 0) {
                            $(result).addClass('active');
                            result.innerHTML = res.html;
                            t = res.t;
                        }
                    }
                },
                error: function (xhr, status, error) {
                }
            });
        });
    }

    if($('.subtop_community').length > 0 || $('.subtop_allbbs').length > 0 || $('#userboard').length > 0|| $('#best_list').length > 0) {
        nav_search_init();
    }

};

document.addEventListener('DOMContentLoaded', nav);


