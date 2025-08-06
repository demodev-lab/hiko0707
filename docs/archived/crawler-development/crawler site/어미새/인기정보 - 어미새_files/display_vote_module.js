jQuery(document).ready(function(){
	jQuery('.vote button').each(function(index, item){ 
		var onclick = jQuery(item).attr('onclick');
		if(display_vote=='N') {
			var vote = onclick.indexOf('Up');
			if(vote>0) jQuery(item).css('display','none');
		}
		if(display_blame=='N') {
			var blame = onclick.indexOf('Down');
			if(blame>0) jQuery(item).css('display','none');
		}
	})
});