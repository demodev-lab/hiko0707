function Observe() {
	const _this = this;

	// ENV
	_this.env = {};
	_this.env.obBoardSn = $('#boardSn').val();
	_this.env.nowCommentCount = $('#nowCommentCount');
	_this.env.obserList = [];

	// 주시하기 목록 호출 및 변수 할당
	_this.getObserveList = function() {
		const observeList = localStorage.getItem('OBSERVELIST_'+sessionUserId);

		if(observeList != null){
			_this.env.obserList = JSON.parse(observeList);
			_this.observeAllListRefresh();
		}
		_this.checkPage();
	};

	// 본문 및 리스트 체크 후 실행 함수
	_this.checkPage = function() {
		if(_this.env.obBoardSn !== undefined && _this.env.obBoardSn > 0) {
			// 본문일 경우
			let isVaild = false;
			for(let i in _this.env.obserList) {
				if(_this.env.obserList[i].boardSn === _this.env.obBoardSn) {
					isVaild = true;
				}
			}
			_this.changeObserveButton(isVaild);
		}
	};

	// 주시하기 버튼 교체 (View.vm)
	_this.changeObserveButton = function(isVaild) {
		var button = '';
		if(isVaild) {
			button = '<button class="button_stare active" onclick="observe.removeObserve();"><i class="fa fa-eye"></i><span class="text">주시중</span></button>';
		} else {
			button = '<button class="button_stare" onclick="observe.addObserve();"><i class="fa fa-eye"></i><span class="text">주시하기</span></button>';
		}
		$('#observe_div').html(button);
		$('#observe_menu_div').html(button);
	};
	
	// 주시하기 목록 전체 TTL체크 및 REFRESH
	_this.observeAllListRefresh = function() {
		var nowDate = new Date();
		var nowDateTtl = new Date().getTime();

		var ttlCheckList = new Array();
		if(_this.env.obserList != null){
			for(var i in _this.env.obserList) {
				var ttl = _this.env.obserList[i].ttl;
				// 여기서 시간 체크
				if(ttl > nowDateTtl) {
					ttlCheckList.push(_this.env.obserList[i]);
				}
			}
			// 로컬스토리지 업데이트
			localStorage.setItem('OBSERVELIST_'+sessionUserId, JSON.stringify(ttlCheckList));
		}
	};

	// 주시하기 업데이트
	_this.updateObserve = function() {
		var updateIsVaild = false;
		if(_this.env.obserList.length > 0){
			for(var i in _this.env.obserList) {
				var obBoardSn = _this.env.obserList[i].boardSn;
				var obCmCount = _this.env.obserList[i].cmCount;
				if(obBoardSn == _this.env.obBoardSn && obCmCount != _this.env.nowCommentCount.val()){
					_this.env.obserList[i].cmCount = _this.env.nowCommentCount.val();
					var nowDate = new Date();
					_this.env.obserList[i].ttl = new Date(Date.parse(nowDate) + 1 * 1000 * 60 * 60 * 24).getTime();
					updateIsVaild = true;
				}
			}
		}
		if(updateIsVaild) {
			localStorage.setItem('OBSERVELIST_'+sessionUserId, JSON.stringify(_this.env.obserList));
		}
	};

	// 주시하기 추가
	_this.addObserve = function() {

		if(_this.env.obserList.length >= 100){
			alert("주시하기는 100개까지 할 수 있습니다.");
			return false;
		}

		for(var i in _this.env.obserList) {
			var obBoardSn = _this.env.obserList[i].boardSn;
			if(obBoardSn == _this.env.obBoardSn){
				return false;
			}
		}

		$.ajax({
			url: API_HOST + '/observe/add',
			type: 'POST',
			data: {
				boardCd: app.env.boardCd,
				boardSn: _this.env.obBoardSn,
				targetUserId : app.env.writer
			},
			success: function(result) {
				var nowDate = new Date();
				var param = {
						boardSn : _this.env.obBoardSn,
						cmCount : _this.env.nowCommentCount.val(),
						ttl : new Date(Date.parse(nowDate) + 1 * 1000 * 60 * 60 * 24).getTime()
				}
				_this.env.obserList.push(param);

				// 추가 후 TTL 체크 및 업데이트
				_this.observeAllListRefresh();

				_this.changeObserveButton(true);
			},
			error: function(result) {
				console.log(result);
			}
		});
	};

	// 주시하기 삭제
	_this.removeObserve = function() {
		const idx = _this.env.obserList.findIndex(function(item) {
			return item.boardSn === app.env.boardSn
		}); // findIndex = find + indexOf
		if (idx > -1) _this.env.obserList.splice(idx, 1);

		// 삭제 후 TTL 체크 및 업데이트
		_this.observeAllListRefresh();

		_this.changeObserveButton(false);
	};

	/**
	 * Init
	 */
	_this.init = function() {
		if (IS_LOGIN) {
			_this.getObserveList();
		}
	};

	_this.init();
}

const observe = new Observe();