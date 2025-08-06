function Paging() {
	const _this = this;

	// 리스트 페이지
	_this.getBoard = function(type, pageNo) {
		
		if(app.env.groupCd === undefined && app.env.boardCd === undefined) {
			return false;
		}

		let pageUrl = '';

		if (typeof app.env.isBoardGroupPage == 'boolean' && app.env.isBoardGroupPage) {
			pageUrl += BASE_URL + '/group/' + app.env.groupCd + '?';
		} else {
			pageUrl += BASE_URL + '/board/' + app.env.boardCd + '?';
			
			if (app.env.categorySn !== undefined) {
				pageUrl += 'categorySn=' + app.env.categorySn;
			}
		}

		let params = {};
		params.od = $('*[name=od]').val();

		if(params.od === undefined){
			params.od = $('#od').val();
		}

		if($('#voCategory').val() !== ""){
			params.category = $('#voCategory').val();
		}

		if (type === 'first') { // 처음
			params.po = Number(0);
		} else if (type === 'direct') { // 페이지 번호 클릭시 이동
			params.po = Number(pageNo);
		} else if (type === 'period') {
			params.po = Number(0);
		} else if (type === 'side_minus') {
			params.po = (Number(app.env.po) - 1);
		} else if (type === 'side_plus') {
			params.po = (Number(app.env.po) + 1);
		} else if(type === 'goList') {
			params.po = Number($('#po').val());
		}

		$.each(params, function(k, v) {
			pageUrl += '&' + k + '=' + v;
		});

		$('.board-pagination .board-page-text').hide();

		location.href = pageUrl;
	};

	// 검색 페이지
	_this.getSearchBoard = function(type, pageNo) {

		if(app.env.groupCd === undefined && app.env.boardCd === undefined) {
			return false;
		}

		let pageUrl = '';

		if (typeof app.env.isBoardGroupPage == 'boolean' && app.env.isBoardGroupPage) {
			pageUrl += BASE_URL + '/search/group/' + app.env.groupCd + '?';
		} else {
			pageUrl += BASE_URL + '/search/board/' + app.env.boardCd + '?';
		}

		let params = {};

		params.sk = $('#sk').val();
		params.sv = encodeURI($('#sv').val(), "UTF-8");
		params.pt = $('#pt').val();

		if (type === 'first') { // 처음
			params.po = Number(0);
		} else if (type === 'direct') { // 페이지 번호 클릭시 이동
			params.po = Number(pageNo);
		} else if (type === 'period') {
			params.po = Number(0);
		} else if (type === 'side_minus') {
			params.po = (Number(app.env.po) - 1);
		} else if (type === 'side_plus') {
			params.po = (Number(app.env.po) + 1);
		} else if(type === 'goList') {
			params.po = Number($('#po').val());
		} else if(type === 'prevPt') {
			params.pt = (Number(pageNo) - 1);
		} else if(type === 'nextPt') {
			params.pt = (Number(pageNo) + 1);
		}

		$.each(params, function(k, v) {
			pageUrl += '&' + k + '=' + v;
		});

		$('.board-pagination .board-page-text').hide();

		location.href = pageUrl;
	};

	// 마이페이지 | 공감글, 공감댓글
	_this.getMypage = function(type, pageNo) {
		let pageUrl = BASE_URL + '/mypage/' + app.env.pageName + '?';
		
		let params = {};
		if( app.env.pageName !== 'singo'){
			let vType = $('*[name=type]').val();

			if(vType === undefined) {
				vType = "";
			}

			vType = encodeURIComponent(vType);
			params.type = vType;
		}
		
		if( app.env.pageName === 'scrap' && $('#sv').val() !== '' && $('#sv').val() !== undefined){
			params.sv = encodeURI($('#sv').val(), "UTF-8");
		}

		if( app.env.pageName === 'memo' && $('#sv').val() !== '' && $('#sv').val() !== undefined){
			params.sv = encodeURI($('#sv').val(), "UTF-8");
		}

		if (type === 'first') { // 처음
			params.po = Number(0);
		} else if (type === 'direct') { // 직접입력한 만큼 이전
			params.po = pageNo;
		} else if (type === 'odtype') { // ordering 타입 변경
			params.po = Number(0);
			params.type = pageNo;
		} else if (type === 'scrap') { // 스크랩
			params.po = Number(0);
		} else if (type === 'memo') { // 회원메모/차단관리
			params.po = Number(0);
		}

		$.each(params, function(k, v) {
			pageUrl += '&' + k + '=' + v;
		});

		location.href = pageUrl;
	};

	// 나의글, 나의 댓글
	_this.getMyArticle = function(type, pageNo) {
		let pageUrl = BASE_URL + '/mypage/' + app.env.pageName + '?';
		
		let params = {};

		params.type = $('*[name=type]').val();
		params.sk = $('#sk').val();
		params.sv = encodeURI($('#sv').val(), "UTF-8");

		if (type === 'first') { // 처음
			params.po = Number(0);
		} else if (type === 'direct') { // 직접입력한 만큼 이전
			params.po = pageNo;
		} else if (type === 'odtype') { // ordering 타입 변경
			params.po = Number(0);
			params.type = pageNo;
		} else if (type === 'scrap') { // 스크랩
			params.po = Number(0);
		} else if (type === 'memo') { // 회원메모/차단관리
			params.po = Number(0);
		}

		$.each(params, function(k, v) {
			pageUrl += '&' + k + '=' + v;
		});

		location.href = pageUrl;
	};

	
	// 자기소개 팝업
	_this.getUserInfo = function(type, pageNo) {
		let targetUserId = $('#targetUserId').val();
		let params = {};

		if (type === 'first') { // 처음
			params.po = Number(0);
			type = $('#userInfoType').val();
		} else if (type === 'direct') { // 직접입력한 만큼 이전
			params.po = pageNo;
			type = $('#userInfoType').val();
		} else if (type === 'historyAll') {
			type = 'history';
			params.nickCount = pageNo;
		}

		let pageUrl = BASE_URL + '/popup/userInfo/' + type + '/' + targetUserId + '?';
		
		$.each(params, function(k, v) {
			pageUrl += '&' + k + '=' + v;
		});

		location.href = pageUrl;
	};

	// 알람팝업
	_this.getAlarmInfo = function(type, pageNo) {
		let alarmType = $('#alarmType').val();
		let params = {};

		if (type === 'first') { // 처음
			params.po = Number(0);
		} else if (type === 'direct') { // 직접입력한 만큼 이전
			params.po = pageNo;
		}

		params.type = alarmType;

		let pageUrl = BASE_URL + '/alarm/List?';
		
		$.each(params, function(k, v) {
			pageUrl += '&' + k + '=' + v;
		});

		location.href = pageUrl;
	}

	// 메세지 팝업
	_this.getMessage = function(param) {
		let prePageNo = $('#prePageNo').val() === '' ? 0 : Number($('#prePageNo').val());
		let pageBlockSize = 1;
		
		let pageUrl = '';
		
		if (typeof app.env.isBoardGroupPage == 'boolean' && app.env.isBoardGroupPage) {
			pageUrl += BASE_URL + '/group/community?';
		} else {
			pageUrl += BASE_URL + '/board/' + app.env.boardCd + '?categorySn=' + app.env.categorySn + '&listType=L11';
		}
		
		let params = {};
		params.od = $('*[name=od]').val();

		if (param === '-1') { // 직접입력
			return;
		} else if (param === 'first') { // 처음
			params.po = Number(0);
		} else if (param === 'minus') { // 이전
			params.po = (Number(app.env.po) - Number(pageBlockSize));
		} else if (param === 'plus') { // 다음
			params.po = (Number(app.env.po) + Number(pageBlockSize));
		} else if (param === 'direct') { // 직접입력한 만큼 이전
			// param == '-1' 호출 후 입력된 값으로 호출
			// params.po = (Number(app.env.po) + Number(iptPageNo));
		} else if (param === 'odtype') { // ordering 타입 변경
			params.po = Number(0);
		} else { // 10/30/50/100 - 페이지 이전
			params.po = (Number(app.env.po) + Number(prePageNo));
		}

		$.each(params, function(k, v) {
			pageUrl += '&' + k + '=' + v;
		});

		location.href = pageUrl;
	};

}

const paging = new Paging();