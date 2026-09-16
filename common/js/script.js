const mediaSM = window.matchMedia("(min-width: 576px)");
const mediaMD = window.matchMedia("(min-width: 768px)");
const mediaLG = window.matchMedia("(min-width: 992px)");
const mediaXL = window.matchMedia("(min-width: 1200px)");


$(function () {

    initCommon(); // 공통
    initHeader(); // 헤더
    initFooter(); // 푸터
	if(!$('.main-layout').length) {
		initSub(); // 서브
	}

    function initCommon() {
        const $goToTop = $('#go-to-top');
        $goToTop.click(function (event) {
            event.preventDefault();
            $("html, body").animate({
                scrollTop: 0
            }, 300);
        });

        $(document).ready(function () {
            const posTop = $(window).scrollTop();
            if (posTop > 1080) {
                $goToTop.fadeIn(300);
            } else {
                $goToTop.fadeOut(300);
            }
        });

        $(window).on('scroll', function () {
            const posTop = $(window).scrollTop();
            if (posTop > 1080) {
                $goToTop.fadeIn(300);
            } else {
                $goToTop.fadeOut(300);
            }
        });
        
        // user-service
        function inituserService() {
            const duration = 300;
            let userServiceState = false;
            let isAnimating = false;
            const ANIMATION_DURATION = 500;
            const $userService = $('#userService');
            const $userServiceOpen = $('.user-service-open');
            const $userServiceClose = $('.user-service-close');

            $userServiceOpen.off('click.userserviceEvent');
            $userServiceClose.off('click.userserviceEvent');

            $userServiceOpen.on('click.userserviceEvent', () => {
                if (isAnimating) return;

                if (!userServiceState) openUserService();
                else closeUserService();
            });

            $userServiceClose.on('click.userserviceEvent', closeUserService);

            function openUserService() {
                isAnimating = true;
                userServiceState = true;
                $('html').css({ 'overflow-y': 'hidden' });
				$('body').css({ 'overflow-y': '' });
                $userService.addClass('open');
                setTimeout(() => isAnimating = false, ANIMATION_DURATION);
            }

            function closeUserService() {
                if (!userServiceState || isAnimating) return;
                isAnimating = true;
                userServiceState = false;
                $userService.removeClass('open');
                setTimeout(() => {
                    $('html').css({ 'overflow-y': '' });
					$('body').css({ 'overflow-y': '' });
                    isAnimating = false;
                }, ANIMATION_DURATION);
            }
        }
        inituserService();

		$(".popup-open").on("click", function () {
			// $(".popup-style01").addClass("open");
			$('html').css({ 'overflow-y': 'hidden' });
			$('body').css({ 'overflow-y': '' });
			$(".popup-style01").show();
			$(".popup-style01").focus();
		});

		$(".popup-option .close, .popup-option .close-today").on("click", function () {
			// $(".popup-style01").removeClass("open");
			$(".popup-style01").hide();
			$('html').css({ 'overflow-y': '' });
			$('body').css({ 'overflow-y': '' });
			$(".popup-open").focus();
		});
    }

    function initHeader() {
		var duration = 300;

		// 햄버거 메뉴 클릭
		$('.menu-ham').on('click', function() {
			if (!mediaLG.matches) {
				openMenu();
				resetMobileMenu();
			}
		});

		// 햄버거 메뉴 모달 영역 클릭
		$('#mask').on('click', function() {				
			closeMenu();
		});

		$('.gnb-close').on('click', function() {
			closeMenu();
		});

		

		// 토글 버튼이 추가되지 않았다면
		if (!$('#header').find('.toggle-btn').length) {
			// 하위 메뉴가 있을 경우 토글 버튼 추가 (1depth 및 2depth 메뉴로 제한)
			$('.depth01-list > li > .menuitem.haspopup-true, .depth01-list .depth02-inner > .depth02-list > li > .menuitem.haspopup-true').append('<button class="toggle-btn" type="button"><span class="visually-hidden">열기</span></button>');
		}
	
		function fn_topmenu_class_change($obj, class_true, class_false, tf) {
			$obj.removeClass(class_true);
			$obj.removeClass(class_false);
	
			var label_text = '';
			if (tf) {
				$obj.addClass(class_true);
				label_text = '닫기';
			}
			else {
				$obj.addClass(class_false);
				label_text = '열기';
			}
	
			$($obj.children('.toggle-btn')).children('span').text(label_text);
		}

		// 1 뎁스 메뉴 클릭
		var $firstMenuItemsButtonClick = false;
		var $firstMenuitems = $('.depth01-list > li > .menuitem');
		$firstMenuitems.children('.toggle-btn').on('click', function (event) {
			fn_firstMenuitems_click($(this));
			$firstMenuItemsButtonClick = true;
		});
		$firstMenuitems.on('click', function (event) {
			if ($(this).is('[data-direct-link]') && !$(event.target).closest('.toggle-btn').length) {
				return;
			}
			if ($('li', $(this).closest('li')).length > 0) {
				if (!$firstMenuItemsButtonClick) {
					fn_firstMenuitems_click($($(this).children('.toggle-btn')));
				}
				$firstMenuItemsButtonClick = false;
			}
		});

		
		function fn_firstMenuitems_click($obj) {
			if (!mediaLG.matches) {
				event.preventDefault();
				var $currMenuItem = $obj.parent('.menuitem');

				fn_topmenu_class_change($firstMenuitems.not($currMenuItem), 'expanded-true', 'expanded-false', false);
				// slide effect
				if ($currMenuItem.hasClass('expanded-true')){ //열렸을때
					$currMenuItem.parent('li').find('.depth02').slideUp();
				} else if(($currMenuItem.hasClass('expanded-false'))){  //닫혔을때
					$('.depth01-list > li > a').removeClass('expanded-true').parents('li').find('.depth02').slideUp();
					$currMenuItem.parent('li').find('.depth02').slideDown();
				}
				toggleMenuItemExpanded($currMenuItem);
			}
		}
		
		$firstMenuitems.on('mouseenter', function () {
			$('.depth02').removeClass('focusin');
		});
	
		$('.header-logo, .gnb-util, .btn-navi').on('focusin', function () {
			$firstMenuitems.next('.depth02').removeClass('focusin');
		});

		// 2 뎁스 메뉴 클릭
		var $secondMenuitemsButtonClick = false;
		var $secondMenuitems = $('.depth02-list > li > .menuitem');
		$secondMenuitems.children('.toggle-btn').on('click', function (event) {
			fn_secondMenuitems_click($(this));
			$secondMenuitemsButtonClick = true;
		});
		$secondMenuitems.on('click', function (event) {
			if ($(this).is('[data-direct-link]') && !$(event.target).closest('.toggle-btn').length) {
				return;
			}
			if ($('li', $(this).closest('li')).length > 0) {
				if (!$secondMenuitemsButtonClick) {
					fn_secondMenuitems_click($($(this).children('.toggle-btn')));
				}
				$secondMenuitemsButtonClick = false;
			}
		});
		function fn_secondMenuitems_click($obj) {
			if (!mediaLG.matches) {
				event.preventDefault();
				var $currMenuItem = $obj.parent(".menuitem");
				fn_topmenu_class_change($secondMenuitems.not($currMenuItem), 'expanded-true', 'expanded-false', false);
				// slide effect
				if ($currMenuItem.hasClass('expanded-true')){ //열렸을때
					$currMenuItem.parent('li').find('.depth03').slideUp();
				} else if(($currMenuItem.hasClass('expanded-false'))){  //닫혔을때
					$('.depth02-list > li > a').removeClass('expanded-true').parents('li').find('.depth03').slideUp();
					$currMenuItem.parent('li').find('.depth03').slideDown();
				}
				toggleMenuItemExpanded($currMenuItem);
			}
		}

		function openMenu() {
			$('#mask').fadeIn(duration);
			$('#gnb').addClass('on');
			$('body').addClass('openMenu');
		}

		function closeMenu() {
			$('#mask').fadeOut(duration);
			$('#gnb').removeClass('on');
			$('body').removeClass('openMenu');
		}

		// menuitem 토글
		function toggleMenuItemExpanded($menuItem) {
			if ($menuItem.hasClass('expanded-true')) {
				fn_topmenu_class_change($menuItem, 'expanded-true', 'expanded-false', false);
			} else {
				fn_topmenu_class_change($menuItem, 'expanded-true', 'expanded-false', true);
			}
		}

		function resetMenu() {
			fn_topmenu_class_change($('.depth01-list .menuitem'), 'expanded-true', 'expanded-false', false);
		}
		function resetMobileMenu() {
			if (!mediaLG.matches) {
				$('.depth01-list > li > .expanded-false').parent('li').find('.depth02').hide();
				$('.depth02-list > li > .expanded-false').parent('li').find('.depth03').hide();
			} else {
				$('.depth01-list > li > .expanded-false').parent('li').find('.depth02').show();
				$('.depth02-list > li > .expanded-false').parent('li').find('.depth03').show();
			}
		}
		function menuActive (){
			
			$('#header').on('mouseover focusin', function () {
				if (mediaLG.matches) {
					$(this).addClass("header_on");
				}
			}).on('mouseout focusout', function () {
				if (mediaLG.matches) {
					$(this).removeClass("header_on");
				}
			})
			var $firstMenu = $firstMenuitems.parent('li');
			$firstMenu.on('mouseover', function(){
				if (mediaLG.matches) {
					if ( $(this).find('.menuitem').has('.haspopup-true') ) {
						$('#header').addClass("header_on");
						$(this).addClass('active');
						$(this).find('.depth02').addClass('active');
					}
				}
			});
			$firstMenu.on('focusin', function(){
				if (mediaLG.matches) {
					if ( $(this).find('.menuitem').has('.haspopup-true') ) {
						$firstMenu.find('.depth02').removeClass('focusin');
						$(this).addClass('active');
						$(this).find('.depth02').addClass('focusin');
						$('#header').addClass("header_on");
					}
				}
			});
			$firstMenu.on('mouseout', function(){
				if ( $(this).has('.haspopup-true') ) {
					$('#header').removeClass("header_on");
					$(this).find('.depth02').removeClass('active');
					$(this).find('.depth02').removeClass('focusin');
					$(this).removeClass('active');
				}
			});
			$firstMenu.on('focusout', function(){
				$('#header').removeClass("header_on");
				$(this).removeClass('active');
			});
			var $secondMenu = $secondMenuitems.parent('li');
			$secondMenu.on('mouseover', function(){
				if (mediaLG.matches) {
					if ( $(this).find('.menuitem').has('.haspopup-true') ) {
						$(this).addClass('active');
					}
				}
			});
			$secondMenu.on('mouseout', function(){
				if ( $(this).has('.haspopup-true') ) {
					$(this).removeClass('active');
				}
			});
			$('body').on('mouseover', function () {
				$firstMenuitems.next('.depth02').removeClass('focusin');
			});
		}

		menuActive();
		// window resize
		$(window).on('resize', function() {
			if (mediaLG.matches) {
				closeMenu();
				resetMenu();
				resetMobileMenu();
				menuActive();
			} else {
				$('#gnb').removeAttr('style');
			}
		});
	}

    function initFooter() {
        function closeAll() {
        $(".family-item")
            .removeClass("is-open")
            .find(".family-inner")
            .slideUp();
        }
        function closeOthers($current) {
        $(".family-item").not($current)
            .removeClass("is-open")
            .find(".family-inner").slideUp();
        }

        $(".family-select").on("click", function (e) {
            e.stopPropagation();

            const $item = $(this).closest(".family-item");

            closeOthers($item);

            $item.toggleClass("is-open")
                .find(".family-inner")
                .stop(true, true)
                .slideToggle();
        });
        $(".family-item").on("click", function (e) {
            e.stopPropagation();
        });

        $(document).on("click", function () {
            closeAll();
        });

	
        var $goToTop = $('.go-to-top');
        $goToTop.click(function (event) {
            event.preventDefault();
            $("html, body").animate({
                scrollTop: 0
            }, 700);
        });
        $(window).on('scroll', function () {
            var posTop = $(window).scrollTop();
            if (posTop > 150) {
                $goToTop.css('bottom', '50px');
            } else {
                $goToTop.css('bottom', '-90px');
            }
        });

    }

	function initSub() {
		const $spyNav = $('.spy-box');
		if ($spyNav.length) {
			let offset = getOffset(); // 상단 기준선
			const $links = $spyNav.find('.spy');
			const $sections = $links.map(function() {
				const id = $(this).attr('href');
				const $target = $(id);
				return $target.length ? $target[0] : null;
			});
			const $imgBox = $('.history-nav .img-box'); // ← 이미지 영역 선택

			// offset 계산 함수
			function getOffset() {
				const w = window.innerWidth;
				if (w >= 1400) return 75;   // 데스크톱
				if (w >= 768) return 50;    // 태블릿
				if (w >= 576)  return 295;  // 모바일
				return 225;                 // 모바일
			}

			function setActive(index) {
				let currentIndex = -1;
				if (index === currentIndex) return; // 👈 핵심

				currentIndex = index;

				$links
					.removeClass('active')
					.removeAttr('aria-current')
					.eq(index)
					.addClass('active')
					.attr('aria-current', 'true');

				$imgBox.removeClass((i, c) =>
					(c.match(/style0\d/g) || []).join(' ')
				);
				$imgBox.addClass('style0' + (index + 1));
			}

			// 현재 스크롤 위치에서 활성 인덱스 계산
			function getActiveIndex() {
				const fromTop = $(window).scrollTop() + offset + 1;
				let activeIndex = 0;

				$sections.each(function(i, sec) {
				const secTop = $(sec).offset().top;
					if (secTop <= fromTop) activeIndex = i;
					else return false; // break
				});

				return activeIndex;
			}

			// 스크롤 시 active 갱신
			let ticking = false;
			$(window).on('scroll resize', function() {
				offset = getOffset();
				if (ticking) return;
				ticking = true;
				requestAnimationFrame(function() {
					setActive(getActiveIndex());
					ticking = false;
				});
			});

			// 클릭 시 부드럽게 스크롤 (offset 보정)
			$links.on('click', function(e) {
				e.preventDefault();
				const targetId = $(this).attr('href');
				const $target = $(targetId);
				if (!$target.length) return;

				const top = $target.offset().top - offset;
				$('html, body').stop().animate({ scrollTop: top }, 300);
				setActive($links.index(this));
			}); 
		}
	}
    
});
