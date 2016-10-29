(function($, window) {
  window.contact = function (event) {
    event.preventDefault();
    var form = $('form[name="contact"]');
    var elementMessage = $('#contact-message');
    var elementButton = $('#contact-form-button');

    elementButton.addClass('loading');

    // If the element is displayed, hide it.
    elementMessage.css('opacity', '0');
    elementMessage.removeClass('success').removeClass('error');

    var url = "https://formspree.io/kontakt@codecreation.dk";

    $.ajax({
      url: url,
      method: "POST",
      data: form.serializeArray(),
      dataType: "json",
      success: function () {
        elementMessage.addClass('success');
        elementMessage.text('Din besked er blevet sendt. Vi vender tilbage hurtigst muligt.');
        form.trigger('reset');
      },
      error: function () {
        elementMessage.addClass('error');
        elementMessage.text('Der skete desværre en fejl. Prøv igen eller skriv til ' + elementMessage.data('email'));
      },
      complete: function () {
        elementButton.removeClass('loading');
        elementMessage.css('opacity', '1');
      }
    });
  }
}(jQuery, window));


(function($, window) {
  // The current page and level.
  var currentPage = 0;
  var currentLevel = 0;
  var numberOfPages = 5;

  var levelBreakpoints = [];

  // Define a timeout before enabling scrolling after a scroll event.
  // Defined in ms.
  var scrollingTimeout = 500;

  // The current positions of the window.
  var lastScrollX = window.scrollX;
  var lastScrollY = window.scrollY;

  // If scrolling is currently being done.
  var isScrolling = false;

  // When DOM is ready.
  $(function() {
    _initializeScrolling();
    // Attach event listener for the menu links.
    $('a[data-page]').on('click', function () {
      scrollToPage($(this).data('page'));
    });
    // Attach event listener for vertical scroll button.
    $('.trigger-vertical-scroll').on('click', function () {
      $(window).scrollTop($(window).scrollTop() + 1);
    });
  });


  /**
   * Listen to the scroll event.
   *
   * When starting scroll either Y or X scroll, auto scroll to the next page.
   */
  window.addEventListener('scroll', function() {
    if (!isScrolling) {
      // If the user is scrolling horizontal.
      if (window.scrollX !== lastScrollX) {
        var nextPage = window.scrollX > lastScrollX ? currentPage + 1 : currentPage - 1;
        scrollToPage(nextPage);
      }

      // If the user is scrolling vertical and trying to scroll past the height of the page.
      if (window.scrollY !== lastScrollY) {
        var direction = window.scrollY > lastScrollY ? 'down' : 'up';
        for (var i = 0; i < levelBreakpoints.length; i++) {
          if (direction === 'down') {
            // When scrolling down, check if the bottom of the window is past a breakpoint.
            if ((lastScrollY + $(window).height()) <= levelBreakpoints[i] && (window.scrollY + $(window).height()) > levelBreakpoints[i]) {
              scrollToLevel(currentLevel + 1);
              break;
            }
          }
          // When scrolling up, check if the top of the window is past a breakpoint.
          else if (direction === 'up' && lastScrollY >= levelBreakpoints[i] && window.scrollY < levelBreakpoints[i]) {
            scrollToLevel(currentLevel - 1);
            break;
          }
        }
      }

      // Update the states.
      lastScrollY = window.scrollY;
      lastScrollX = window.scrollX;
    }
  });

  /**
   * Scroll to a specific page.
   *
   * @param {int} page
   *   The page number to scroll to.
   */
  var scrollToPage = function (page) {
    // Do not interrupt a scroll and only scroll to existing pages.
    if (!isScrolling && page > -1 && page < numberOfPages) {
      _startScroll();
      // _toggleVerticalScroll(page);

      // Set the right active link.
      $('.top-bar-link-active').removeClass('top-bar-link-active');
      $('.top-bar-link[data-page="' + page + '"]').addClass('top-bar-link-active');

      // Update the current page and level flags.
      currentPage = page;
      currentLevel = 0;

      // The position to scroll to is the page number times the width of the window.
      var positionToScrollTo =  page * $(window).width();

      // Always start by scroll to the top of the page, when scrolling horizontal.
      _scrollY(0, function () {
        // When scrolling to top is done, initialize the page scrolling to.
        _initializePage();
        $('body').animate({ scrollLeft: positionToScrollTo }, { duration: 800, done: function () { _scrollComplete('horizontal'); } });
      });
    }
  };

  /**
   * Scroll to a specific level.
   *
   * @param {int} level
   */
  var scrollToLevel = function (level) {
    if (!isScrolling) {
      _startScroll();

      // Since the first level does not exist in the level breakpoints,
      // if the first level is being scroll to, manually set to zero.
      var positionToScrollTo = level > 0 ? levelBreakpoints[level - 1] : 0;

      _scrollY(positionToScrollTo, function () {
        currentLevel = level;
        _scrollComplete('vertical');
      }, 800);
    }
  };

  /**
   * Set flags and disable user scrolling.
   *
   * Should always be called before automatic scrolling.
   *
   * @private
   */
  var _startScroll = function () {
    isScrolling = true;
    disableScroll();
  };

  /**
   * Set flags and enable user scrolling.
   *
   * Should always be called after automatic scrolling.
   *
   * @private
   */
  var _scrollComplete = function () {
    lastScrollY = window.scrollY;
    lastScrollX = window.scrollX;
    isScrolling = false;
    // To prevent double scroll by fault, wait for x seconds to re-enable scrolling.
    window.setTimeout(function () {
      enableScroll();
    }, scrollingTimeout);
  };


  /**
   * Scrolls to the given position of the page.
   *
   * @param {int} position
   *   The Y position to scroll to.
   * @param {function} callback
   *   Called when the scroll is done, or instantly if no scrolling is needed.
   */
  var _scrollY = function (position, callback, duration) {
    duration = duration || 400;
    if (window.scrollY !== position) {
      // Scroll to the top deck.
      $('body').animate({ scrollTop: position }, {
        duration: duration, done: callback
      });
    } else {
      callback();
    }
  };

  /**
   * Initialize scrolling with defaults.
   */
  var _initializeScrolling = function () {
    // Calculate the current page and level from the scroll position.
    currentPage = $(window).scrollLeft() / $(window).width();
    currentLevel = Math.floor($(window).scrollTop() / $(window).height());

    _initializePage();

    // Mark the current page as active.
    $('.top-bar-link[data-page="' + currentPage + '"]').addClass('top-bar-link-active');
  };

  /**
   * Initialize the current page by rendering levels, initializing breakpoint
   * and settings page height.
   *
   * @private
   */
  var _initializePage = function () {
    // Check if the page has already been initialized.
    levelBreakpoints = [];

    // Update the height of the first level to fit the height of the page.
    var firstLevel = $('section[data-level="0"]');
    // Reset the height.
    firstLevel.css('height', 'auto');
    // Update the height of the first level, to the height of the page in scope.
    var currentPageHeight = $('section[data-level="0"] div.page[data-page="' + currentPage + '"]').height();
    firstLevel.css('height', currentPageHeight + 'px');

    // Iterate all levels except the first, to check if the page has content in the lower levels.
    // If the page has content in the level, display the level and record its height.
    // If the page does not have content in the level, hide the level.
    $('.level').not('[data-level="0"]').each(function () {
      var pageInLevel = $(this).find('div.page[data-page="' + currentPage + '"]');
      if (pageInLevel.children().length) {
        // Render the level.
        $(this).show();
        // Add the height of the page in the level to breakpoints container.
        levelBreakpoints.push($(this).offset().top);
      } else {
        $(this).hide();
      }
    });
  };

  /**
   * Disable and enable scrolling.
   */
  var keys = {37: 1, 38: 1, 39: 1, 40: 1};
  function preventDefault(e) {
    e = e || window.event;
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.returnValue = false;
  }

  function preventDefaultForScrollKeys(e) {
    if (keys[e.keyCode]) {
      preventDefault(e);
      return false;
    }
  }

  function disableScroll() {
    if (window.addEventListener) {
      window.addEventListener('DOMMouseScroll', preventDefault, false);
    }
    window.onwheel = preventDefault;
    window.onmousewheel = document.onmousewheel = preventDefault;
    window.ontouchmove  = preventDefault;
    document.onkeydown  = preventDefaultForScrollKeys;
  }

  function enableScroll() {
    if (window.removeEventListener) {
      window.removeEventListener('DOMMouseScroll', preventDefault, false);
    }
    window.onmousewheel = document.onmousewheel = null;
    window.onwheel = null;
    window.ontouchmove = null;
    document.onkeydown = null;
  }

  $(document).foundation();

}(jQuery, window));