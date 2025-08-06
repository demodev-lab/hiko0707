function Util() {
	const _this = this;

	// 로그 출력 (console.log)
	_this.log = function(obj) {
		if (IS_DEBUG) {
			if (window.console !== undefined && window.console.log !== undefined) {
				console.log(obj);
			}
		}
	};

	/**
	 * HTML 태그 제거
	 * @param {String} str - 대상 문자열
	 */
	_this.stripTags = function(str) {
		return str.replace(/(<([^>]+)>)/ig,'');
	};

	/**
	 * HTML 태그 제거 (댓글 등록시)
	 * 댓글 등록 시 `SPAN`, `P`, `H1`, `H2` 태그를 제거합니다.
	 * 여는 태그뿐 아니라, 닫는 태그도 포함하여 제거합니다.
	 * @param {String} str - 대상 문자열
	 */
	_this.stripTagsForComment = function(str) {
		return str.replace(/<(SPAN|P|H1|H2){1}.*>/i,'');
	};

	/**
	 * 특정 HTML 이미지 태그 삭제
	 *
	 * HTML 문자열에서 지정된 형식의 `<img>` 태그만 삭제합니다.
	 * 외부 이미지 URL은 삭제하지 않으며, `class="fr-dib fr-fil"` 속성을 가진 `<img>` 태그만 제거됩니다.
	 *
	 * @param {string} str - 검사할 HTML 문자열
	 * @returns {string} - 수정된 HTML 문자열
	 */
	_this.removeImgTags = function(str) {
		// class 속성에 'fr-dib fr-fil'을 포함한 <img> 태그를 찾기 위한 정규 표현식
		const imgTagPattern = /<img class="fr-dib fr-fil"[^>]*>/gi;

		// 정규 표현식에 매칭되는 <img> 태그를 제거하고 결과 반환
		return str.replace(imgTagPattern, "");
	};

	/**
	 * 금지어 필터링 함수
	 *
	 * 주어진 콘텐츠에서 금지어 목록에 포함된 단어를 찾고, 해당 단어를 '*'로 대체합니다.
	 * 금지어가 포함된 경우 `isValidWord` 값을 `false`로 설정하고,
	 * 필터링된 콘텐츠와 함께 반환합니다.
	 *
	 * @param {string} content - 검사할 콘텐츠 문자열
	 * @param {string} prohibitionWord - 쉼표(,)로 구분된 금지어 목록 문자열
	 * @returns {Object} - { isValidWord: boolean, content: string }
	 *                    `isValidWord`: 금지어가 없으면 true, 있으면 false
	 *                    `content`: 필터링된 콘텐츠 문자열
	 */
	_this.prohibitionWord = function(content, prohibitionWord) {
		let isValidWord = true;
		const prohibitionWordList = prohibitionWord.split(',');

		prohibitionWordList.forEach(word => {
			if (content.includes(word)) {
				content = _this.replaceAll(content, word, '*');
				isValidWord = false;
			}
		});

		return {
			isValidWord: isValidWord,
			content: content
		};
	};


	/**
	 * 이모지 확인 로직
	 */
	_this.checkForEmoji = function(content) {
		// 모든 이모지 범위를 포괄하는 정규 표현식
		var emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
		// 이모지가 감지되면 false, 아니면 true 반환
		return !emojiRegex.test(content);
	};


	// 회원 닉 벨리데이션 확인
	_this.nickVaild = function(nick) {
		const re = /^[a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣_!~@#$%^&*(),.;?\[\]\-+=\'\"]{2,20}$/;
		return re.test(nick);
	};

	/**
	 * Replace All
	 * @param {String} str 			- 대상 문자열
	 * @param {String} searchStr 	- 검색할 문자열
	 * @param {String} replaceStr 	- 변환할 문자열
	 */
	_this.replaceAll = function(str, searchStr, replaceStr) {
		return str.replaceAll(searchStr, replaceStr);
	};

	/**
	 * 팝업 열기
	 * @param {String} url 			- 팝업 URL
	 * @param {String} popupName 	- 팝업 이름
	 * @param {Number} width 		- 팝업 Width
	 * @param {Number} height 		- 팝업 Height
	 */
	_this.openPopup = function(url, popupName, width, height) {
		const posX = (screen.availWidth - width) / 2;
		const posY = (screen.availHeight - height) / 2;
		const options = `width=${width},height=${height},left=${posX},top=${posY},location=no,status=no`;

		// 팝업 창 열기 및 포커스 처리
		let popup = window.open(url, popupName, options);
		if (popup) {
			popup.focus();
		} else {
			popup = window.open(url, popupName, options);
		}
	};


	/**
	 * Ajax 에러처리
	 */
	_this.ajaxError = function(url, parm) {
		const f = document.createElement('form');
		parm._csrf = '$!csrf_token';

		// boardSn, commentSn 값이 숫자가 아닌 경우 0으로 초기화
		['boardSn', 'commentSn'].forEach(key => {
			if (parm[key] !== undefined && isNaN(parm[key])) {
				parm[key] = 0;
			}
		});

		// 폼에 hidden input 요소 추가
		for (const key in parm) {
			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = key;
			input.value = parm[key];
			f.appendChild(input);
		}

		// 폼 설정 및 전송
		f.method = 'GET';
		f.action = url;
		document.body.appendChild(f);
		f.submit();
	};


	/** 
	* string String::cutByte(int len)
	* 글자를 앞에서부터 원하는 바이트만큼 잘라 리턴합니다.
	* 한글의 경우 2바이트로 계산하며, 글자 중간에서 잘리지 않습니다.
	*/
	_this.cutByte = function(str, len) {
		let count = 0;
		let i = 0;

		for (; i < str.length; i++) {
			const code = str.charCodeAt(i);

			if (code === 0x0D) continue; // 줄바꿈 문자는 카운트하지 않음
			count += (code > 127) ? 2 : 1; // 유니코드 127 이상은 2바이트, 이하 1바이트

			if (count > len) {
				if (code === 0x0A) i--; // 개행 문자일 경우 한 글자 줄임
				break;
			}
		}
		return str.substring(0, i);
	};


	// 글자수 제한 체크
	_this.lengthCheck = function(str, num) {
		return str.length > num;
	};
	
	// 문자열의 개시물 byte를 체크.
	_this.byteCheck = function(str, byte) {
		let count = 0;
		for (let i = 0; i < str.length; i++) {
			const code = str.charCodeAt(i);
			count += (code > 127) ? 2 : 1; // 한글, 특수문자는 2바이트, 나머지는 1바이트
			if (count > byte) return false; // 최대 바이트 수 초과 시 즉시 반환
		}
		return true;
	};

	// 문자열 공백 제거
	_this.deleteSpace = function(str) {
		return str.replace(/\s/gi, "");
	}
}
const util = new Util();

/**
 * jQuery maxLength 플러그인
 * 특정 요소에 최대 글자 수 제한을 적용합니다.
 *
 * @param {number} maxLength - 최대 글자 수
 * @returns {jQuery} - jQuery 객체를 반환하여 체이닝이 가능하도록 함
 */
$.fn.maxLength = function(maxLength) {
	return this.each(function() {
		$(this).on('input', function() {
			const text = $(this).val();

			// 최대 길이를 초과하는 경우 초과된 부분을 잘라냄
			if (text.length > maxLength) {
				$(this).val(text.substring(0, maxLength));
			}
		});
	});
};