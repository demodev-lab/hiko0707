jQuery(document).ready(function($) {
  $(function() {
    $(".eq.toggle-login").click(function() {
      $("#login-modal").addClass("on");
      $("#nav-drawer").removeClass("on");
    });

    $("#login-modal-bg, #login-modal-close").click(function() {
      $("#login-modal").removeClass("on");
    });

    // 로그인 에러메시지가 있을 때 모달창 유지
    if($('#login-modal .eq.alert').length) {
      $('#login-modal').addClass('on');
    };
  });

  $(function() {
    $("#search-toggle, #search-shadow, #search-close").click(function() {
      $("#search-drawer").toggleClass("on");
    });
  });

  $(function() {
    $("#toggle-nav-drawer, #nav-drawer-bg").click(function() {
      $("#nav-drawer").addClass("on");
    });

    $("#nav-drawer-bg").click(function() {
      $("#nav-drawer").removeClass("on");
    });
  });

  $(function() {
    if($(".eq.nav-menu > li").hasClass('parent')) {
      if($(".eq.nav-menu > li.parent > ul > li").hasClass('active')) {
        $(".eq.nav-menu > li.parent > ul > li.active").addClass('child-active');
        $(".eq.nav-menu > li.parent > ul > li.active").parent().addClass('child');
      }

      if($(".eq.nav-menu > li.parent > ul").hasClass('child')) {
        $(".eq.nav-menu > li.parent > ul.child").parent().addClass('open open-parent');
      }

      $(".eq.nav-menu > li.parent > .eq.nav-chevron").click(function(){
        var parent = $(this).parent();
    
        if(parent.hasClass('open')) {
          parent.removeClass('open');
        }else{
          parent.addClass('open');
        }
      });

    }
  });
});

jQuery(function($) {
  $(".eq.dropdown-toggle").click(function() {
    $(this).next().toggleClass("on");
    return false;
  });
  
  $(".eq.dropdown-close").click(function() {
    $(this).prev().removeClass("on");
    return false;
  });

  $(".eq.dropdown-angle .eq.dropdown-toggle").click(function() {
    var dropdownToggleHeight = $(this).outerHeight();
    $(this).next().css('top', dropdownToggleHeight);
    return false;
  });
});