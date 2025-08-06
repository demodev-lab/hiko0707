function UI() {
	const _this = this;

	_this.env = {
		shortCutIsValid : false
		, saveBookmarkIsValid : true
	};

	// 게시글 & 댓글 신고 정보
	_this.singoActionReason = function(boardSn, commentSn = '') {
		const url = commentSn
			? `${API_HOST}/board/singo/reason?boardSn=${boardSn || $('#boardSn').val()}&commentSn=${commentSn}`
			: `${API_HOST}/board/singo/reason?boardSn=${boardSn}`;

		$.ajax({
			url: url,
			type: 'GET',
			success: function(result) {
				const aReason = result.adminReason ?? '-';
				const rDate = result.singoResultDate ?? '-';

				const reasonSelector = commentSn ? `#singoReason_${commentSn}` : `#singoReason_${boardSn}`;
				const dateSelector = commentSn ? `#singoDate_${commentSn}` : `#singoDate_${boardSn}`;

				$(reasonSelector).text(aReason);
				$(dateSelector).text(rDate);
			},
			error: function(error) {
				console.error("Error fetching singo reason:");
			}
		});
	};

	// 팁과강좌 이미지 배경칼라 램덤 변경
	_this.noImgBackgroundColor = function() {
		const colors = ['#E26A6A', '#BA68C8', '#5C97BF', '#4A654D', '#0D47A1', '#E47833', '#858E90', '#947CB0', '#B9AF30', '#FFA726', '#006064'];

		$(".box").each(function() {
			$(this).css("background-color", colors[Math.floor(Math.random() * colors.length)]);
		});
	};

	// 목록 공감 컬러 설정 함수
	_this.initSymphathy = function() {
		$('.symph_row').each(function() {
			const listSymph = parseInt($(this).find('.view_symph').text());
			let lSymphColor = "lSymph01";

			if (listSymph >= 99) {
				lSymphColor = "lSymph06";
				$(this).find('.view_symph > span').text('99+');
			} else if (listSymph >= 51) {
				lSymphColor = "lSymph05";
			} else if (listSymph >= 11) {
				lSymphColor = "lSymph04";
			} else if (listSymph >= 2) {
				lSymphColor = "lSymph03";
			} else if (listSymph >= 1) {
				lSymphColor = "lSymph02";
			}

			$(this).find('.view_symph').addClass(lSymphColor);
		});
	};

	/**
	 * 이벤트 바인드
	 */
	_this.eventBind = function() {
		
		// 실명일치확인 이벤트 버블링 막음
		$('.name_same').on('click', function(e) {
			e.stopPropagation();
		});
		// 메모칼라 이벤트 버블링 막음 || 칼라선택 UI 출력
		$('.button_set').on('click', function(e) {
			$('.color_layer').toggleClass('open');
			$('.memo_box').toggleClass('open');
			e.stopPropagation();
		});
		$('.button_color').on('click', function(e) {
			e.stopPropagation();
		});
		// 재검토 요청 내역 닫기
		$("#post_msg").on('click', function(e) {
			$(".admin_report").toggleClass('close');
		});
		$("#post_article").on('click', function(e) {
			$(".post_reexamine_article").toggleClass('close');
		});
		$("#post_comment").on('click', function(e) {
			$(".post_reexamine_comment").toggleClass('close');
		});

		// 게시판 선택영역 외 다른부분 클릭시 창 닫기 버튼
		$('body').on('click', function(e) {
			const $clickable = $('*[data-role=dropdown-write-article]');
			if (!$clickable.is(e.target) && $clickable.has(e.target).length === 0 && $('.open').has(e.target).length === 0) {
				$clickable.removeClass('open');
			}
		});

		// 글쓰기 버튼
		$('*[data-role=dropdown-write-article] a').on('click', function (event) {
			if (typeof app.env.isBoardGroupPage == 'boolean' && app.env.isBoardGroupPage) {
				$(this).parent().toggleClass('open');
			} else {
				location.href = `${BASE_URL}/board/regist?boardCd=${app.env.boardCd}`;
			}
		});

		// LIST MEMO 보이기 옵션 설정
		$('.memo-view').on('click', function() {
			$('.memo-view').toggleClass('active');
			storage.updateMemoViewSetting();
			location.reload();
		});

		// Localstorage 동기화.
		$('.memo-sync').on('click', function() {
			storage.storageUpdate();
			location.reload();
		});

		// 메모 모두 삭제 및 로컬 스토리지 삭제.
		$('.memo-delete').on('click', function() {
			storage.deleteAllMemo();
			location.reload();
		});

		// 키워드 동기화
		$('.keyword-sync').on('click', function() {
			keyWord.updateKeword();
			location.reload();
		});

		// 운영현황 리포트 열기
		$('.button_chart').on('click', function() {
			$('.button_chart').toggleClass('active');
			$('.report_chart').toggleClass('open');
		});

		// 회원가입약관 열기
		$('.form_open').on('click', function() {
			$('.form_terms').toggleClass('open');
			$('.form_open').toggleClass('close');
		});

		// Timestamp | IP, Time 마우스 오버시 상세 정보 출력
		$(document).on('mouseover', '.popover', function() {
			$(this).children('span').show();
		}).on('mouseout', '.popover', function() {
			$(this).children('span').hide();
		});

		// Signature Expansion | 서명창 확장 버튼
		$('.signature .button-expand').on('click', function(){
			$('.signature').toggleClass('expanded');
		});

		// 신고하기 팝업 버튼 클릭시 selected 되도록 하는 기능. -> 신고 팝업 함수로 옴겨야 한다.
		$('.content_reason .button_reason').on('click', function() {
			$(this).addClass('selected').siblings().removeClass('selected');
		});


		// 팝업에서 사용 | Scrap, Memo 글 Input창 입력시, Ui컨트롤 START
		$('.note-region .note-input').on('focus',function(){
			$('.note-region').addClass('open');
			$('.modal-bg').addClass('open');
		});
		$('.modal-bg').on('click', function(){
			$('.modal-bg').removeClass('open');
			$('.note-region').removeClass('open');
		});
		$('.note-region .dropdown-menu li').on('click', function(){
			let prevText = $(this).text();
			$('.note-input').val(prevText);
			$('.note-region').removeClass('open');
			$('.modal-bg').removeClass('open');
		});
		// END

		// 메뉴 소모임 전체보기
		$('#more').on('click', function(){
			$('.menu_somoim').toggleClass('open');
			$('.button_more').toggleClass('open')
		});
        // 메뉴 커뮤니티 전체보기
        $('#com-more').on('click', function(){
            $('.navmenu').toggleClass('open');
        });
        // 나의메뉴 전체보기
        $('#my-more').on('click',function(){
            $('.mymenu').toggleClass('open');
        });
        // 나의메뉴설정 버블링 막음
        $('#mymenu-button').on('click',function(){
            e.stopPropagation();
        });
        // 설정 열기
        $('#set-more').on('click',function(){
            $('.header_setting_area').toggleClass('setting');
        });
		
		// 플로라 에디어 버그 | 에디터 비디오 수정 시 &nbsp; 발생 제거 (플로라 버전 업데이트시 계속 확인 할 것)
		$('p span.fr-video').each(function(){
			$(this).html($(this).html().replace(/&nbsp;/gi,''));
		});


		// hide #back-top first : 액션버튼 맨위로 버튼 동작
		$("#back-top").hide();
		$(function () {// fade in #back-top
			$(window).scroll(function () {
				if ($(this).scrollTop() > 148) {
					$('#back-top').fadeIn();
				} else {
					$('#back-top').fadeOut();
				}
			});
		});
		// END
	};

	// 그룹페이지에서 글쓰기 이동은 최종적으로 이 함수를 통해서 이동
	_this.moveWriteGroupPage = function(boardCd) {
		location.href = `${BASE_URL}/board/regist?boardCd=${boardCd}`;
	};


	// 단축기 관련 함수
	_this.shortCutCheck = function() {
		setTimeout(() => { _this.env.shortCutIsValid = true; }, 700);
	}

	_this.initShortCut = function() {
		if (PAGE_SETTING_SHORT_CUT !== 'on') return;

		const isLegacyBrowser = /MSIE|Trident|Edge\//.test(navigator.userAgent);
		const eventType = isLegacyBrowser ? 'keyup' : 'keydown';

		$(document).on(eventType, function(e) {
			if (eventType === 'keydown' && !e.repeat) {
				_this.moveShortCut(e);
			} else if (eventType === 'keyup') {
				_this.moveShortCut(e);
			}
		});
	};

	_this.moveShortCut = function(e) {
		if (!_this.env.shortCutIsValid) return;

		const tagName = e.target.nodeName;
		const className = e.target.className;
		const po = parseInt($('#po').val(), 10);
		const pageName = $('#pageName').val();
		const preListType = $('#preListType').val();
		const searchIsValid = $('#searchIsVaild').val() === 'true';
		let pressedKey = e.code || (e.originalEvent && e.originalEvent.code);

		if (pressedKey.startsWith('Key')) {
			// 알파벳인 경우: 'KeyC' -> 'c'
			pressedKey = pressedKey.slice(3).toLowerCase();
		} else if (pressedKey.startsWith('Digit')) {
			// 숫자인 경우: 'Digit1' -> '1'
			pressedKey = pressedKey.slice(5);
		} else if (pressedKey === 'Comma') {
			// 쉼표 키: 'Comma' -> ','
			pressedKey = ',';
		} else if (pressedKey === 'Period') {
			// 마침표 키: 'Period' -> '.'
			pressedKey = '.';
		}

		// 입력이 특정 요소가 아닌 경우에만 작동
		if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName) || className.includes('fr-view') || className.includes('comment-textarea')) return;
		if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;

		// 키에 따른 동작 정의
		switch (pressedKey) {
			case 'r': // 새 댓글 확인
				if ($('[data-role=comment-newest]').length) {
					$('[data-role=comment-newest] button').trigger('click');
				}
				break;

			case ',': // 이전 글 링크
				if (preListType === 'recommend' || preListType === 'recent') return false;

				if (pageName === 'boardView') {
					list.neiborArticle('prev');
				} else {
					const prevPo = Math.max(po - 1, 0);
					searchIsValid ? paging.getSearchBoard('direct', prevPo) : paging.getBoard('direct', prevPo);
				}
				break;

			case '.': // 다음 글 링크
				if (preListType === 'recommend' || preListType === 'recent') return false;

				if (pageName === 'boardView') {
					list.neiborArticle('next');
				} else {
					const nextPo = po + 1;
					searchIsValid ? paging.getSearchBoard('direct', nextPo) : paging.getBoard('direct', nextPo);
				}
				break;

			default: // 기타 메뉴 단축키
				if (keyData[pressedKey]) {
					window.location.href = keyData[pressedKey];
				}
				break;
		}
	};

	_this.initSmallShortCut = function() {
		if (PAGE_SETTING_SHORT_CUT !== 'on') return;

		$(document).on('keydown', function(e) {
			if (!_this.env.shortCutIsValid) return;

			const tagName = e.target.nodeName;
			const className = e.target.className;

			// 특정 입력 필드 및 클래스에 속하지 않은 경우만 실행
			if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName) || className.includes('fr-view') || className.includes('comment-textarea')) return;
			if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;

			let pressedKey = e.code || (e.originalEvent && e.originalEvent.code);

			if (pressedKey.startsWith('Key')) {
				// 알파벳인 경우: 'KeyC' -> 'c'
				pressedKey = pressedKey.slice(3).toLowerCase();
			} else if (pressedKey.startsWith('Digit')) {
				// 숫자인 경우: 'Digit1' -> '1'
				pressedKey = pressedKey.slice(5);
			}

			// keyData에 있는 단축키 실행
			if (keyData[pressedKey]) {
				window.location.href = keyData[pressedKey];
			}
		});
	};

	// 로그인 사용자 북마크(별) 체크
	_this.initBookmakerStarDisplay = function() {
		if (!IS_LOGIN) return;

		let boardCd = $('#boardCd').val() || "NoBoardCd";
		let groupCd = $('#groupCd').val() || "NoGroupCd";

		const data = storage.storageGetBookmaker();

		if (Array.isArray(data)) {
			data.forEach(v => {
				if (v.boardCd === boardCd || v.groupCd === groupCd) {
					$('.board-bookmark').addClass('active');
					$('#bookmarkShortcutSup').text(v.shortcut);
				}
			});
		}
	};

	// 줄겨찾기
	_this.saveBookMark = function() {
		if (!_this.env.saveBookmarkIsValid) return;

		_this.env.saveBookmarkIsValid = false;

		const isBookmarked = $('.board-bookmark').hasClass('active');
		const boardCd = $('#boardCd').val();
		const groupCd = $('#groupCd').val();
		const title = $('#boardName').val();
		let data = storage.storageGetBookmaker() || [];

		if (!IS_LOGIN) return;

		if (!isBookmarked) { // 북마크 추가
			let empityNum = [...Array(10).keys()]; // [0,1,2,3,4,5,6,7,8,9]

			// 사용 중인 seq 번호 필터링
			data.forEach(v => empityNum = empityNum.filter(num => num !== v.seq));

			if (data.length >= 10) { // 북마크가 10개일 때
				if (confirm("나의 메뉴는 10개까지 등록 가능 합니다.\n메뉴를 수정 하시겠습니까?")) {
					popup.myBookmaketPopup();
				}
			} else { // 북마크 추가 처리
				const seq = empityNum.shift(); // 사용 가능한 가장 작은 seq 번호를 가져오고, empityNum에서 제거
				const shortcut = seq + 1; // shortcut을 seq에 1을 더한 값으로 설정
				data.push({ seq, title, shortcut, boardCd, groupCd });
				data.sort((a, b) => a.seq - b.seq);

				// 서버 요청 및 업데이트
				storage.updateBookmark(data, shortcut, '#bookmarkSaveTooltip');
			}
		} else { // 북마크 삭제
			data = data.filter(v => v.boardCd !== boardCd);
			storage.updateBookmark(data, null, '#bookmarkDeleteTooltip');
		}
	};

	// 목록 리스트 (최근 댓글수, 차단, 메모, 키워드, 주시)
	_this.initBlockArticle = function() {

		let blockCount = 0;
		let blockList = [];
		let highlightList = [];
		let keywordIsValid = false;

		// MEMO DATA
		const memoListJSON = localStorage.getItem('MY_MEMO_LIST');
		const jsonInfo = JSON.parse(memoListJSON);
		const memoView_yn = localStorage.getItem('MEMO_LIST_VIEW_YN') === "true";

		// KEYWORD DATA
		const keywordJSON = localStorage.getItem('KEYWORD');
		const keyword = JSON.parse(keywordJSON);

		if (keywordJSON && keywordJSON !== '{}') {
			blockList = (keyword.blockKeyWord || "").split(',');
			highlightList = (keyword.highlightKeyWord || "").split(',');
			keywordIsValid = !!keyword.keywordYn;
		}

		// OBSERVE LIST DATA
		const observeListInfo = localStorage.getItem(`OBSERVELIST_${sessionUserId}`);
		const observeList = JSON.parse(observeListInfo) || [];

		// RECENT LIST DATA
		const recentIsValid = localStorage.getItem('MY_VIEW_LIST_ISVAILD') !== 'N';
		const recentList = JSON.parse(localStorage.getItem('MY_VIEW_LIST') || "[]");

		// ARTICLE LIST START
		$('*[data-role=list-row]').each(function() {
			const row = $(this);
			const listBoardSn = Number(row.data('board-sn'));
			const listCommentCount = Number(row.data('comment-count'));
			const authorId = row.data('author-id');

			// 최근글 댓글 변화 보여주기
			if (recentIsValid) {
				recentList.some(recentItem => {
					if (listBoardSn === Number(recentItem.boardSn)) {
						const recentCmCount = Number(recentItem.commentCount);
						if (listCommentCount !== recentCmCount) {
							const difference = listCommentCount - recentCmCount;
							row.find('*[data-role=recentCmCount]').text(`(${difference > 0 ? '+' : ''}${difference})`);
						}
						return true; // break loop if condition met
					}
					return false;
				});
			}

			// 메모 보여주기
			if (IS_LOGIN && jsonInfo && jsonInfo.memoList) {
				jsonInfo.memoList.some(memoItem => {
					if (memoItem.destId === authorId) {
						if (memoItem.blockArticleYn) {
							row.remove();
							blockCount++;
							return true; // break loop if condition met
						}
						if (memoView_yn) {
							const colorCss = `mColor0${memoItem.color || '1'}`;
							row.find('*[data-role=list_memo]')
								.addClass(colorCss)
								.removeClass('none')
								.text(memoItem.note);
							row.addClass('short');
						}
						return true; // break loop if condition met
					}
					return false;
				});
			}

			// 키워드 차단
			if (IS_LOGIN && keywordIsValid && keyword.blockKeyWord) {
				blockList.some(blockWord => {
					if (blockWord && row.find('*[data-role=list-title-text]').text().includes(blockWord)) {
						row.remove();
						blockCount++;
						return true; // break loop if condition met
					}
					return false;
				});
			}

			// 주시된 글 표시
			if (IS_LOGIN) {
				let listButtonActive = false;
				observeList.some(observeItem => {
					if (listBoardSn === Number(observeItem.boardSn)) {
						row.addClass('stare');
						row.find('*[data-role=observeIcon]').show();

						const obsCmCount = Number(observeItem.cmCount);
						if (listCommentCount !== obsCmCount) {
							const difference = listCommentCount - obsCmCount;
							row.find('*[data-role=observeCmCount]').text(`(${difference > 0 ? '+' : ''}${difference})`);
						}
						listButtonActive = true;
						return true; // break loop if condition met
					}
					return false;
				});
				if (listButtonActive) {
					$('#listObserveButton').addClass('active');
				}
			}
		});
		// ARTICLE LIST END

		// 강조 키워드 강조
		if (IS_LOGIN && keywordIsValid && highlightList.length) {
			$('*[data-role=list-title-text]').each(function() {
				const row = $(this);
				highlightList.forEach(highlightWord => {
					if (highlightWord) {
						row.mark(highlightWord);
					}
				});
			});
		}

		// 차단된 게시물 수 표시
		if (blockCount > 0) {
			$('#blockCountSpan').show();
			$('#blockCount').text(blockCount);
		}
	};

	// Init
	_this.init = function() {
		_this.eventBind();
		_this.noImgBackgroundColor();
		_this.shortCutCheck();
	};

	_this.init();
}

const ui = new UI();