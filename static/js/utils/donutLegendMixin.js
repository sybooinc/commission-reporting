(function(){
	// get reference
	var syboo = window.syboo || {}
		, utils = syboo.utils || {};

	utils.donutLegend = {};

	
	utils.dispatchMouseEvent = function(object, eventName, bubble, cancelable) {
		var eventObject;

		bubble = (bubble) ? bubble : true;
		cancelable = (cancelable) ? cancelable : false;

		if(document.createEvent) {
			eventObject = document.createEvent('MouseEvents');
			eventObject.initEvent(eventName, bubble, cancelable);
			object.dispatchEvent(eventObject);

		} else if(document.createEventObject) {
			eventObject = document.createEventObject();
			object.fireEvent('on' + eventName, eventObject);
		} else {
			throw error('unrecognized event model');
		}
	}

	utils.donutLegend.render = function(slices, parent) {
		var self = this
			, scrollingUp = false
			, scrollingDown = false
			, onLegendContainerMouseout = function(event) {
				syboo.eventBus.trigger('onLegendContainerMouseout');
				$('.highlight').removeClass('highlight');
			}
			, onLegendItemMouseover = function (event) {
				//self.renderDonutLabels(event);
				dispatchSliceEvent(this, 'mouseover');
			}
			, onLegendItemMouseout = function(event) {
				dispatchSliceEvent(this, 'mouseout');
			}
			, onLegendItemClick = function(event) {
				dispatchSliceEvent(this, 'click');
			}
			, dispatchSliceEvent = function(legendItem, mouseEventType) {
				var sliceId = legendItem.getAttribute('data-sliceid');

				var slice = _.find(slices, function(slice) {
					return slice.sliceId == sliceId;
				});
			
				if (slice.amount > 0 && slice.element) {
					utils.dispatchMouseEvent(slice.element.node, mouseEventType);
				}
			}
			, scrollUpStart = function(event) {
				var containerPosition = self.container.position().top;
				var scrollUpButton = $(event.currentTarget);
				var scrollDownButton = $('.scrollDown');

				if (Math.abs(containerPosition) > 0 && !scrollingUp) {
					scrollingUp = true;
					containerPosition += 225;
					
					if (Math.abs(containerPosition) === 0 && !scrollUpButton.hasClass('disabled')) {
						scrollUpButton.addClass('disabled');
					} else if (scrollUpButton.hasClass('disabled')) {
						scrollUpButton.removeClass('disabled');
					}

					containerPosition = containerPosition + 'px';
					
					$(self.container).animate({'top': containerPosition}, 500, function() {
						scrollingUp = false;
					});
					
					if (scrollDownButton.hasClass('disabled')) {
						scrollDownButton.removeClass('disabled');
					}
				} else if (!scrollUpButton.hasClass('disabled')) {
					scrollUpButton.addClass('disabled');
				}
			}
			, scrollDownStart = function(event) {
				var containerPosition = self.container.position().top;
				var scrollDownButton = $(event.currentTarget);
				var scrollUpButton = $('.scrollUp');

				if (Math.abs(containerPosition) < self.scrollDistance && !scrollingDown) {
					scrollingDown = true;
					containerPosition -= 225;
					
					if (Math.abs(containerPosition) >= self.scrollDistance && !scrollDownButton.hasClass('disabled')) {
						scrollDownButton.addClass('disabled');
					} else if (scrollDownButton.hasClass('disabled')) {
						scrollDownButton.removeClass('disabled');
					}

					containerPosition = containerPosition + 'px';
					
					$(self.container).animate({'top': containerPosition}, 500, function() {
						scrollingDown = false;
					});
					
					if (scrollUpButton.hasClass('disabled')) {
						scrollUpButton.removeClass('disabled');
					}
				} else if (!scrollDownButton.hasClass('disabled')) {
					scrollDownButton.addClass('disabled');
				}
			}

		parent.find('.legend').html(Handlebars.compile($("#template-legend").html())({items: slices}));

		this.legendItems = [];

		_.each(slices, function(slice) {
			var item = parent.find('[data-sliceid="' + slice.sliceId + '"]');
			if (item.length > 0) {
				item.mouseover(onLegendItemMouseover);
				item.mouseout(onLegendItemMouseout);
				item.click(onLegendItemClick);
				self.legendItems.push(item);
			}
		})
		parent.find('.legend').mouseout(onLegendContainerMouseout);

		this.scrollArea = parent.find('.legend > .scrollableArea');
		this.container = parent.find('.legend > .scrollableArea > .container');
		
		if (slices.length > 9) {
			this.scrollArea.css('height', '225px');
			this.scrollDistance = this.container.height() - this.scrollArea.height();
			parent.find('.scrollUp').show();
			parent.find('.scrollDown').show();
			parent.find('.scrollUp').mousedown(scrollUpStart);
			parent.find('.scrollDown').mousedown(scrollDownStart);
		} else {
			var height = slices.length * 25;
			height = height + 'px';
			this.scrollArea.css('height', height);

			parent.find('.scrollUp').hide();
			parent.find('.scrollDown').hide();
		}
	}

	// set reference back
	syboo.utils = utils;
	window.syboo = syboo;
})();