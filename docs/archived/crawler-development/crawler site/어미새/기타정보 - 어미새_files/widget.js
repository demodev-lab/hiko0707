function content_widget_tab_show(tab,list,i){
    tab.parents('ul.widget-tab').children('li.active').removeClass('active');
    tab.parent('li').addClass('active');
    jQuery('>dd',list).each(function(j){
            if(j==i) jQuery(this).addClass('open');
            else jQuery(this).removeClass('open');
            });
}
