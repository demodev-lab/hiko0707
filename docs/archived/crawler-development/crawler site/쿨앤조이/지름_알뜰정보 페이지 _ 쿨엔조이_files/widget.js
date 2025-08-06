// Sidebar
var sidebar_id;
var sidebar_size = "-300px";

function sidebar_is() {
	var side;
	var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	if(width > 1000) { 
		side = 'right';
	} else {
		side = 'right';
	}
	return side; 
}

// 스르르 열기 관련
function sidebar_ani(div, type, val) {
  var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	if(width < 1000 ) {
		div.animate({ right : val }); 
	} else {
		div.css({ right : val }); 
	}
}

function sidebar_mask(opt) {
	var mask = $("#nt_sidebar_mask");
	if(opt == 'show') {
		mask.show();
		$('html, body').css({'overflow': 'hidden', 'height': '100%'});
	} else {
		mask.hide();
		$('html, body').css({'overflow': '', 'height': ''});
	}
}

function sidebar(id) {
  var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	var div = $("#nt_sidebar");
	var side = sidebar_is();
	var is_div = div.css(side);
	var is_size;
	var is_open;
	var is_show;

	id = 'sidebar-' + id;

	// 알림 안내 숨김
	$('#nt_sidebar_noti').hide();

// 뒷배경 계속 유지 관련
	if(id == sidebar_id) {
		if(is_div === sidebar_size) {
			is_show = false;
			sidebar_ani(div, side, '0px'); 
			if(width < 1000) {
				sidebar_mask('show'); 
			} else {
				sidebar_mask('hide');
			}
		} else {
			is_show = false;
			sidebar_ani(div, side, sidebar_size); 
			sidebar_mask('hide');
		}
	} else {
		if(is_div === sidebar_size) {
			is_show = true;
			sidebar_ani(div, side, '0px'); 
		} else {
			is_show = true;
		}

// 뒷배경 어두워짐 관련
		if(width < 1000) {
			sidebar_mask('show');
		} else {
			sidebar_mask('hide');
		}
	}

	// Show
	if(is_show) {
		$('.sidebar-item').hide();

		switch(id) {
			case 'sidebar-noti'	: $('#' + id + '-list').load(sidebar_url + '/noti.php'); break;
		}

		$('#' + id).show();
		$('#nt_sidebar').scrollTop(0);
	}

	// Save id
	sidebar_id = id;

	return false;
}

// Sidebar Noti Count 알람카운트 다운로드됨으로 동작됨 체크필요
function sidebar_noti_cnt() {

	var $labels = $('.nt-noti-label');
	var $counts = $('.nt-noti-cnt');
	var url = sidebar_url + '/noti_cnt.php';

	$.get(url, function(data) {
		if (data.count > 0) {
			$counts.text(number_format(data.count));
			$labels.show();
		} else {
			$labels.hide();
		}
	}, "json");
	return false;
}


$(document).ready(function () {

	$(document).on('click', '#nt_sidebar_menu .tree-toggle', function () {
		$(this).parent().children('ul.tree').toggle(200);
	});

	// Sidebar Close
	$(document).on('click', '.sidebar-close', function () {
		var div = $("#nt_sidebar");
		var side = sidebar_is();
		sidebar_ani(div, side, sidebar_size); 
		sidebar_mask('hide');
		return false;
    });

	// Sidebar Change
	$(window).resize(function() {
		var side = sidebar_is(); 
		if(side == 'left') {
			side = 'right';
		} else {
			side = 'left';
		}
		if($("#nt_sidebar").css(side) != '') {
			$("#nt_sidebar").css(side, '');
			sidebar_mask('hide');
		}
	});

	// 상하단 이동 버튼
	$(window).scroll(function(){
		if ($(this).scrollTop() > -10) {
			$('#nt_sidebar_move').fadeIn();
		} else {
			$('#nt_sidebar_move').fadeOut();
		}
	});

	$('.sidebar-move-top').on('click', function () {
		$('html, body').animate({ scrollTop: '0px' }, 500);
		return false;
	});

	$('.sidebar-move-bottom').on('click', function () {
		$('html, body').animate({ scrollTop: $(document).height() }, 500);
		return false;
	});


$('.sidebar-move-viewcomment').on('click', function () {
  var offset = $('#viewcomment').offset(); 
		$('html, body').animate({ scrollTop: offset.top }, 500); 
		return false;
	});
	

$('.sidebar-move-writecomment').on('click', function () {
  var offset = $('#writecomment').offset(); 
		$('html, body').animate({ scrollTop: offset.top }, 500); 
		return false;
	});



	
	// 높이 체크
	na_content_height('nt_sidebar_body', 'nt_sidebar_header', 'nt_sidebar_footer');
	$(window).resize(function() {
		na_content_height('nt_sidebar_body', 'nt_sidebar_header', 'nt_sidebar_footer');
	});

	// Response Auto Check
	if(g5_is_member && sidebar_noti_check > 0) {
		setInterval(function() {
			sidebar_noti_cnt();
		}, sidebar_noti_check * 1500); // Time = 1000ms ex) 10sec = 10 * 1000
	}
});