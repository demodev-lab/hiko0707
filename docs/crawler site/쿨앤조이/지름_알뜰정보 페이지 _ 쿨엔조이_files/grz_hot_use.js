$.get(g5_url+'/plugin/hotkey/key_dat.txt?1', function(data) {    
    var lines = data.split("||");
	$.each(lines, function(i, elem) {
		if( i % 3 != 0 ) return true;
		$(document).bind('keyup', lines[i], function(){
			document.location.href = lines[i+2];
			return false;
		});
	});
});