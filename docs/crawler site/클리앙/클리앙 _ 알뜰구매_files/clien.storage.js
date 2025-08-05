function STORAGE() {

	const _this = this;
	const saveUserId = typeof sessionUserId !== 'undefined' ? sessionUserId : '';

	// 서버 요청 및 업데이트 함수
	_this.updateBookmark = function(data, shortcut, tooltipId) {
		$.ajax({
			url: `${API_HOST}/myBookMarkPreference`,
			type: 'POST',
			data: { param: JSON.stringify(data) },
			success: function() {
				storage.storageUpdateBookmaker(data);
				$(tooltipId).css('visibility', 'visible');
				if (shortcut !== null) $('#bookmarkShortCut').text(shortcut);
				setTimeout(function() {
					location.reload();
				}, 700);
			},
			error: function(error) {
				console.error("BookMark ERROR:", error);
			}
		});
	}

	// 페이지 로딩시 로컬 스토리지 메모 정보 확인 및 저장
	_this.storageSave = function() {
		const memoList = localStorage.getItem('MY_MEMO_LIST');
		const memo_view_yn = localStorage.getItem('MEMO_LIST_VIEW_YN') || true;
		const localStorage_userID = localStorage.getItem('MY_MEMO_LIST_ID');

		// 스토리지에 메모 리스트가 없거나, 사용자 ID가 일치하지 않는 경우 서버에서 데이터 로드
		if (!memoList || localStorage_userID !== saveUserId) {
			_this.syncMemoList(saveUserId, false);
		}

		// 메모 리스트 뷰 표시 여부 설정 (기본값은 true)
		if (!memo_view_yn || localStorage_userID !== saveUserId) {
			localStorage.setItem('MEMO_LIST_VIEW_YN', true);
		}
	};

	// 로컬스토리지 메모 및 키워드 DB동기화
	_this.storageUpdate = function() {
		// 메모 리스트 동기화 요청
		this.syncMemoList(saveUserId, false);
		// 키워드 데이터 동기화 요청
		this.syncKeywordData(saveUserId);
	};

	// 로컬스토리지 메모 관련 업데이트
	_this.storageUpdatePopup = function(userId, isAsync = true) {
		this.syncMemoList(userId, false);
	};

	// 메모 리스트 동기화 및 로컬 스토리지 저장 함수
	_this.syncMemoList = function(userId, isAsync) {
		$.ajax({
			url: `${API_HOST}/mypage/memo/list`,
			type: 'GET',
			async: isAsync,
			dataType: 'json',
			success: function(memoList) {
				localStorage.setItem('MY_MEMO_LIST', JSON.stringify(memoList));
				localStorage.setItem('MY_MEMO_LIST_ID', userId);
			},
			error: function(error) {
				console.log("Memo List Sync Error:", error);
			}
		});
	}

	// 키워드 동기화 및 로컬 스토리지 저장 함수
	_this.syncKeywordData = function() {
		$.ajax({
			url: `${API_HOST}/mypage/keyword`,
			type: 'GET',
			async: true,
			success: function(data) {
				const params = {
					keywordYn: data.keywordYn,
					blockKeyWord: data.blockKeyword,
					highlightKeyWord: data.highlightKeyword
				};
				localStorage.setItem('KEYWORD', JSON.stringify(params));
			},
			error: function(error) {
				console.log("Keyword Sync Error:", error);
			}
		});
	}

	// 로컬스토리지 메모 뷰 설정 토글
	_this.updateMemoViewSetting = function() {
		const currentViewSetting = localStorage.getItem('MEMO_LIST_VIEW_YN') === "true";
		localStorage.setItem('MEMO_LIST_VIEW_YN', !currentViewSetting);
	}

	// 로컬스토리지 개인 메뉴 설정 저장 (java MenuInterceptor 와 설정 맞추기위해 escape사용)
	_this.storageUpdateBookmaker = function(data) {
		clienCookie.set('BOOKMAKER', data, 365, '/', COOKIE_DOMAIN);
	};

	// 로컬스토리지에서 개인 메뉴 설정 가져오기
	_this.storageGetBookmaker = function() {
		return clienCookie.get('BOOKMAKER');
	};

	// 내 기기 저장
	_this.saveMyDevice = function(data) {
		clienCookie.set('CL_DEVICE_' + data.userId, data, 1000, '/', COOKIE_DOMAIN);
	};

	// 페이지 설정 저장
	_this.saveMyPage = function(data) {
		clienCookie.set('PAGESETTING', data, 1000, '/', COOKIE_DOMAIN);
	};


	// 로컬스토리지 키워드 저장하기
	_this.storageUpdateKeyword = function(data) {
		localStorage.setItem('KEYWORD', JSON.stringify(data));
	}

	// 로컬스토리지 메뉴 고정 설정 토글
	_this.updateMenuFixedSetting = function() {
		const menuFixed = localStorage.getItem('CLIEN_MEMU_FIXED') === "true";
		localStorage.setItem('CLIEN_MEMU_FIXED', !menuFixed);
	}

	// 모든 메모 삭제 및 로컬 스토리지 동기화.
	_this.deleteAllMemo = function() {
		// 사용자에게 확인 메시지 표시
		if (confirm("삭제된 메모는 차단설정이 모두 해지 되며, 목록은 복구되지 않습니다.\n모든 메모를 정말로 삭제하겠습니까?")) {
			// 사용자가 '확인'을 클릭한 경우에만 AJAX 요청 실행
			$.ajax({
				url: `${API_HOST}/mypage/memo/delete`,
				type: 'POST',
				async: true,
				dataType: 'json',
				success: function(memoList) {
					localStorage.removeItem('MY_MEMO_LIST');
					localStorage.removeItem('MY_MEMO_LIST_ID');
				},
				error: function(error) {
					console.log("Memo List Delete Error:", error);
				}
			});
		}
		// 사용자가 '취소'를 클릭한 경우 아무 작업도 수행하지 않음
	}


	/**
	 * 초기화 함수
	 */
	_this.init = function() {
		if (IS_LOGIN) {
			_this.storageSave();
		}
	};

	// 초기화 함수 호출
	_this.init();
}

const storage = new STORAGE();