function Auth() {

	const _this = this;

	// ENV
	_this.env = {
		form: $('#loginForm'),
		iptUserId: $('#loginForm').find('*[name=userId]'),
		iptUserPassWord: $('#loginForm').find('*[name=userPassword]'),
		iptTotpCode: $('#totpcode')
	};

	// 로그인 유효성 검사 함수
	_this.loginValidate = function() {
		const fields = [
			{ element: _this.env.iptUserId, message: '아이디를 입력하세요.' },
			{ element: _this.env.iptUserPassWord, message: '비밀번호를 입력하세요.' }
		];

		for (let field of fields) {
			if (field.element.val().trim() === '') {
				alert(field.message);
				field.element.focus();
				return false;
			}
		}
		return true;
	};

	// 로그인
	_this.login = function() {
		if (!_this.loginValidate()) return;

		const userId = _this.env.iptUserId.val().trim();
		const clienDv = clienCookie.get('CL_DEVICE_' + userId);

		if (clienDv) {
			$('#deviceId').val(clienDv.deviceId);
		}
		_this.googleOtp();
	};

	// OTP Check
	_this.googleOtp = function() {
		$.ajax({
			url: `${API_HOST}/auth/google/otp`,
			type: 'GET',
			async: false,
			data: { userId: _this.env.iptUserId.val().trim() },
			success: function(result) {
				if (result) {
					$('#otp').addClass('next');
					setTimeout(() => _this.env.iptTotpCode.focus(), 300);
				} else {
					auth.loginConfirm();
				}
			},
			error: function() {
				console.log("Google Otp Exception");
			}
		});
	};

	// 로그인
	_this.loginConfirm = function() {
		_this.submitForm(BASE_URL + '/login');
	};

	// OTP 로그인
	_this.otpLoginConfirm = function() {
		const totpCode = _this.env.iptTotpCode.val().replace(/\s/g, "");
		_this.env.iptTotpCode.val(totpCode);

		if (totpCode === '') {
			alert('코드를 입력해 주세요.');
			_this.env.iptTotpCode.focus();
			return;
		}
		_this.submitForm(BASE_URL + '/login');
	};

	// 폼 제출
	_this.submitForm = function(action) {
		_this.env.form.attr({ method: 'POST', action }).submit();
	};

	/**
	 * 이벤트 바인드
	 */
	_this.eventBind = function() {
		const keyupBindings = [
			{ element: _this.env.iptUserId, handler: _this.login },
			{ element: _this.env.iptUserPassWord, handler: _this.login },
			{ element: _this.env.iptTotpCode, handler: _this.otpLoginConfirm }
		];

		keyupBindings.forEach(binding => {
			binding.element.on('keyup', (e) => {
				if (e.keyCode === 13) binding.handler();
			});
		});
	};

	// 비밀번호 유효성 및 위험여부 체크
	_this.pwCheckPossible = function(password) {
		const checkReturn = { isValid: true, risk: '' };

		if (/\s/.test(password)) {
			alert("비밀번호는 공백을 사용할 수 없습니다.");
			checkReturn.isValid = false;
			return checkReturn;
		}

		const length = password.length;
		const hasNumber = /[0-9]/.test(password);
		const hasLetter = /[A-Za-z]/.test(password);
		const hasSpecial = /[`~!@#$%^&*|\\'";:/?]/.test(password);

		if (length === 4) {
			checkReturn.risk = "VNsafety";
		} else if (length >= 5 && length <= 8) {
			if ((hasNumber && hasLetter) || (hasLetter && hasSpecial) || (hasSpecial && hasNumber)) {
				checkReturn.risk = "Safety";
			} else {
				checkReturn.risk = "Nsafety";
			}
		} else if (length > 8) {
			checkReturn.risk = (hasNumber && hasLetter && hasSpecial) ? "VSafety" : "Safety";
		}

		return checkReturn;
	};


	// 비밀번호 자리수 체크
	_this.passwordLengthCheck = function(password) {
		if (password === '') return false;

		if (password.length < 4) {
			alert("최소 4자 이상 입력하세요.");
			return false;
		}
		return true;
	};

	// 이메일 유효성 검사
	_this.emailRegularExpression = function(email) {
		const regExp = /^[0-9a-zA-Z][_0-9a-zA-Z-]*@[0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+){1,2}$/;
		return regExp.test(email);
	};

	// 숫자 유효성 검사
	_this.numberRegularExpression = function(number) {
		const regNumber = /^[0-9]*$/;
		return regNumber.test(number);
	};

	// 사업자 등록번호 유효성 검사
	_this.ssnRegularExpression = function(bizID) {
		if (bizID.length !== 10) return false;

		// 하이픈 제거 후, 가중치 배열 초기화
		bizID = bizID.replace(/-/g, '');
		const checkID = [1, 3, 7, 1, 3, 7, 1, 3, 5, 1];
		let chkSum = 0;

		// 가중치 계산
		for (let i = 0; i < 8; i++) {
			chkSum += checkID[i] * Number(bizID.charAt(i));
		}

		// 9번째 자리 가중치 적용
		const c2 = (checkID[8] * Number(bizID.charAt(8))).toString().padStart(2, '0');
		chkSum += Number(c2.charAt(0)) + Number(c2.charAt(1));

		// 마지막 자리 검증
		const remainder = (10 - (chkSum % 10)) % 10;
		return remainder === Number(bizID.charAt(9));
	};

	_this.init = function() {
		_this.eventBind();
	};

	_this.init();
}

const auth = new Auth();