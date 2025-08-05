/**
 * 팝업 호출 클래스
 * @returns
 */
function Popup() {
	
	const _this = this;
	
	// 주시하기 팝업
	_this.userStarePopup = function() {
		// 로컬 스토리지에서 주시한 글 목록 가져오기
		const obList = JSON.parse(localStorage.getItem(`OBSERVELIST_${sessionUserId}`));
		// 주시한 글이 없을 경우 경고 후 종료
		if (!obList) {
			alert("주시한 글이 없습니다.");
			return;
		}
		// 주시한 게시물의 boardSn 값 배열로 추출
		const boardSns = obList.map(item => item.boardSn);
		// 팝업 창 열기
		util.openPopup(`${BASE_URL}/popup/observe/list?boardSn=${boardSns}`, 'observeList', 500, 545);
	};

	// 이미지 원본보기 팝업
	_this.imgOriPopup = function(imgWidth, imgHeight, imgUrl, subject) {
		// `subject`를 안전하게 인코딩하고, 템플릿 리터럴을 사용해 URL 생성
		const encodedSubject = encodeURIComponent(subject);
		const url = `${API_HOST}/ori/imgView?imgUrl=${encodeURIComponent(imgUrl)}&subject=${encodedSubject}`;
		// 팝업 열기
		util.openPopup(url, 'likePopup', imgWidth, imgHeight);
	};

	// 공감한 사람들 팝업
	_this.likePopup = function(boardCd, boardSn, commentSn) {
		// URL 생성에 템플릿 리터럴 사용, commentSn이 있으면 쿼리 파라미터로 추가
		const url = `${BASE_URL}/popup/like/${boardCd}/${boardSn}${commentSn ? `?commentSn=${commentSn}` : ''}`;
		// 팝업 열기
		util.openPopup(url, 'likePopup', 414, 400);
	};





	/**
	 * 스크랩 팝업
	 * @param {String} boardCd 		- 게시판ID
	 * @param {Number} boardSn 		- 게시물ID
	 * @param {String} mode 		- 모드(regist/modify)
	 */
	_this.scrapPopup = function(boardCd, boardSn) {
		var url = BASE_URL + '/popup/scrap?boardCd=' + boardCd + '&boardSn=' + boardSn;
		util.openPopup(url, 'scrapPopup',500, 350);
	};

	/**
	 * 스크랩 완료 팝업
	 */
	_this.scrapCompletePopup = function() {
		util.openPopup(BASE_URL + '/popup/scrapComplete', 'scrapCompletePopup', 500, 350);
	};

	/**
	 * 신고하기 팝업
	 * @param {String} boardCd 		- 게시판ID
	 * @param {Number} boardSn 		- 게시물ID
	 * @param {Number} commentSn 	- 댓글ID (필수아님)
	 */
	_this.singoPopup = function(boardCd, boardSn, commentSn) {
		var param = '?boardCd=' + boardCd + '&boardSn=' + boardSn;
		
		if (commentSn != undefined) {
			param += '&commentSn=' + commentSn;
		}		
		util.openPopup(BASE_URL + '/popup/singo' + param, 'singoPopup', 500, 500);
	};

	/**
	 * 사용자 소개 팝업
	 * @param {String} userId 		- 사용자ID
	 */
	_this.userInfoPopup = function(type, userId) {
		util.openPopup(BASE_URL + '/popup/userInfo/'+type+'/' + userId, 'userInfoPopup', 414, 545);
	};

	/**
	 * 사용자 제한 팝업
	 */
	_this.limitPopup = function(destId) {
		util.openPopup(BASE_URL + '/popup/limit/'+destId, 'limitPopup', 500, 490);
	};

	/**
	 * 회원메모 팝업
	 * @param {String} destId 		- 사용자ID
	 */
	_this.memoPopup = function(destId) {
		if(sessionUserId == destId){
			alert("자기 자신에게는 메모/차단 기능을 사용할 수 없습니다.");
			return false;
		}
		util.openPopup(BASE_URL + '/popup/memoInfo/' + destId, 'memoPopup', 500, 350);
	};

	/**
	 * 사이드 바 쪽지 팝업
	 */
	_this.messagesPopup = function() {
		var bellElement = document.querySelector('.fa fa-envelope-open-o.alram');

		// alram 클래스 제거
		if (bellElement) {
			bellElement.classList.remove('alram');
		}

		util.openPopup(BASE_URL + '/message/?type=', 'messagesPopup', 414, 610);
	};

	/**
	 * 보험게시판 팝업
	 */
	_this.insurancePopup = function(type, targetId) {
		util.openPopup(BASE_URL + '/popup/insurance?type='+type+'&targetId='+targetId, 'insurancePopup', 434, 610);
	};

	/**
	 * 리스트 쪽지 팝업
	 */
	_this.messagesPopup_Id = function(targetId) {
		if(sessionUserId === targetId){
			alert("자기 자신에게는 쪽지를 보낼 수 없습니다.");
			return false;
		}
		util.openPopup(BASE_URL + '/messages/new/?targetId='+targetId, targetId, 414, 610);
	};

	/**
	 * 알림 팝업
	 */
	_this.alarmPopup = function() {
		var bellElement = document.querySelector('.fa-bell-o.alram');

		// alram 클래스 제거
		if (bellElement) {
			bellElement.classList.remove('alram');
		}

		/* 알람 목록을 과도하게 호출하는 외부 프로그램으로 인해 이름을 변경합니다. 서비스에 큰 지장이 있으므로 반복될 경우 조치할 예정입니다. */
		util.openPopup(BASE_URL + '/alarm/List', 'alarmPopup', 414, 610);
	};

	/**
	 * 소모임 설정 팝업
	 */
	_this.somoimPopup = function(type, boardCd) {
		var winW = 0;
		var winH = 0;
		var url = '';
		
		if (type == 'myPage') {
			winW = 640;
			winH = 515;
			url = BASE_URL + '/popup/somoimPreference/' + type;
		} else if (type == 'bookmark') {
			winW = 360;
			winH = 485;
			url = BASE_URL + '/popup/somoimPreference/' + type + '?boardCd=' + boardCd;
		}
		
		util.openPopup(url, 'somoimPopup', winW, winH);
	};

	/**
	 * 나의메뉴 설정 팝업
	 */
	_this.myBookmaketPopup = function() {
		util.openPopup(BASE_URL + '/popup/myBookmark', 'mymyBookmarkPopup', 414, 595);
	};

	/**
	 * 휴대폰 인증 팝업
	 */
	_this.kcmPopup = function(type) {
		var url = BASE_URL + '/popup/auth/kmcStep01?type=' + type;
		var jwidth	= "445";
		var jHeight	= "550";
		var UserAgent = navigator.userAgent.toLowerCase();

		if(UserAgent.indexOf("chrome") != -1){
			
		}else if(UserAgent.indexOf("safari") != -1){
			jwidth	= "445";
			jHeight	= "588";
		}

		window.open('', 'popupChk', 'width='+jwidth+', height='+jHeight+', resizable=0, scrollbars=no, status=0, titlebar=0, toolbar=0, left=435, top=250' );
		f = document.reqPopupForm;
		f.action = url;
		f.target = 'popupChk';
		f.certM.value = 'M';
		f.submit();
	}
	
	/**
	 * 소모임 관리 / 카테고리 통합 팝업
	 */
	_this.adminSomoimByCtgCombine = function(boardCd) {
		var url = BASE_URL + '/popup/somoim/manage/combine?boardCd='+boardCd;
		util.openPopup(url, 'combine',414,490);
	}
	
	/**
	 * 소모임 관리 / 카테고리 편집 팝업
	 */
	_this.adminSomoimByCtgEdit = function(categorySn) {
		var url = BASE_URL + '/popup/somoim/manage/edit?categorySn='+categorySn;
		util.openPopup(url, 'edit',414,350);
	}
	
	/**
	 * 소모임 관리 / 카테고리 정렬 팝업
	 */
	_this.adminSomoimByCtgSort = function(boardCd) {
		var url = BASE_URL + '/popup/somoim/manage/sort?boardCd='+boardCd;
		util.openPopup(url, 'sort', 414,490);
	}
}

const popup = new Popup();