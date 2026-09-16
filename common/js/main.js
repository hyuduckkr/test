$(function () {
	initMain();
	/* =========================
	 * Main Init
	 * ========================= */
    function initMain() {
		//  AOS
		AOS.init();
		initMainVisual();
		initProcess();
		initNews();
		initBanner();
	}


	/* ==================================================
	* Swiper Play / Pause
	* ================================================== */
	function onPlayStop($slide, $swiper) {
		const btnStop = $slide.find('.play-btn');
		const $bar = $slide.find('.control .bar');

		btnStop.on('click', function () {
			if ($(this).hasClass('stop')) {
				// 중지
				$swiper.autoplay.stop();
				$(this).removeClass('stop').addClass('play')
				.attr('aria-label', '재생')
				.find('.visually-hidden').text('재생');
			} else {
				// 재생
				$swiper.autoplay.start();
				$(this).removeClass('play').addClass('stop')
				.attr('aria-label', '정지')
				.find('.visually-hidden').text('정지');
			}
		});
	}


	// Main Visual (Swiper)
	function initMainVisual() {
		var $control = $('.visual-ctl');
		const mvSwiper = new Swiper('.visual-swiper', {
			loop: true,
			slidesPerView : 1,
			// autoplay: {
			// 	delay: 3000,
			// 	disableOnInteraction: false,
			// },
			pagination: {
				el: ".visual .slider-pagination",
				clickable: true,
			},
		});
		onPlayStop($control, mvSwiper);
	}


	// Process (Swiper)
	function initProcess() {
		var $control = $('.process-ctl');

		const processSwiper = new Swiper('.process-swiper', {
			slidesPerView: 1.3,
			spaceBetween: 30,
			breakpoints:{
				480:{
					slidesPerView: 1.8,
					spaceBetween: 30,
				},
				768:{
					slidesPerView: 2.2,
					spaceBetween: 30,
				},
				992:{
					slidesPerView: 2.5,
					spaceBetween: 30,
				},
				1200:{
					slidesPerView: 2.8,
					spaceBetween: 30,
				},
				1400:{
					slidesPerView: 3.5,
					spaceBetween: 30,
				},
				1600:{
					slidesPerView: 3.8,
					spaceBetween: 30,
				},
				1800:{
					slidesPerView: 4.5,
					spaceBetween: 30,
				},
			},
            navigation: {
                prevEl: ".process .prev-btn",
                nextEl: ".process .next-btn",
            },
			pagination: {
				el: ".process .slider-progress",
				type: "progressbar",
			},

			on: {
				init(swiper) {
					updateFraction(swiper);
				},
				slideChange(swiper) {
					updateFraction(swiper);
				},
				breakpoint(swiper) {
					updateFraction(swiper);
				},
			},
		});

		function updateFraction(swiper) {
			const current = swiper.activeIndex + 1;
			const perView = Number(swiper.params.slidesPerView);
			const total = swiper.slides.length - Math.floor(perView) + 1;
			$('.slider-fraction').html(`
				<span class="fraction-current">${Math.min(current, total)}</span>
				<span>/</span>
				<span>${total}</span>
			`);
		}
		
		onPlayStop($control, processSwiper);
	}


	// news (Swiper)
	function initNews() {
		var $control = $('.news-ctl');

		const newsSwiper = new Swiper('.news-swiper', {
			slidesPerView: 1.3,
			spaceBetween: 30,
			centeredSlides: true,
			loop: $('.news-swiper .swiper-slide').length > 5,
			autoplay: {
				delay: 3000,
				disableOnInteraction: false,
			},
			breakpoints:{
				480:{
					slidesPerView: 2,
					spaceBetween: 30,
				},
				992:{
					slidesPerView: 2.5,
					spaceBetween: 30,
				},
				1200:{
					slidesPerView: 2.8,
					spaceBetween: 30,
				},
				1400:{
					slidesPerView: 3.5,
					spaceBetween: 30,
				},
				1600:{
					slidesPerView: 3.8,
					spaceBetween: 30,
				},
				1800:{
					slidesPerView: 4.5,
					spaceBetween: 30,
				},
			},
			pagination: {
				el: ".news .slider-pagination",
				clickable: true,
			},
			observer: true,
			observeParents: true,
		});
		onPlayStop($control, newsSwiper);
	}


	// banner (Swiper)
	function initBanner() {
		var $control = $('.banner-ctl');

		const bannerSwiper = new Swiper('.banner-swiper', {
			slidesPerView: "auto",
			centeredSlides: true,
			// loop: $('.banner-swiper .swiper-slide').length > 3,
			autoplay: {
				delay: 3000,
				disableOnInteraction: false,
			},
			effect: "coverflow",
			coverflowEffect: {
				rotate: 0,
				stretch: 150,
				depth: 400,
				modifier: 1,
				slideShadows: false,
			},
			breakpoints:{
				576:{
					coverflowEffect: {
						stretch: 150,
					},
				},
				768:{
					coverflowEffect: {
						stretch: 400,
					},
				},
				992:{
					coverflowEffect: {
						stretch: 350,
					},
				},
				1200:{
					coverflowEffect: {
						stretch: 450,
					},
				},
			},
			pagination: {
				el: ".banner-ctl .slider-pagination",
				clickable: true,
			},
			navigation: {
				prevEl: ".banner .slider-prev",
				nextEl: ".banner .slider-next",
			},
		});
		onPlayStop($control, bannerSwiper);
	}


})