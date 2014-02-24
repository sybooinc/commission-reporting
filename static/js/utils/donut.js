define([
	'raphael'
	, 'jquery'
	, 'underscore'
],function(Raphael, $, _){
	// get reference
	var syboo = window.syboo || {}
		, utils = syboo.utils || {};

	Raphael.fn.addArcAttributes = function() {
		this.customAttributes.circularArc = function(centerX, centerY, outerRadius, innerRadius, startAngle, endAngle) {
			if (outerRadius <= 0) {
				throw new Error('outerRadius needs to be greater than 0');
			}

			if (innerRadius <= 0) {
				throw new Error('innerRadius needs to be greater than 0');
			}

			if (innerRadius >= outerRadius) {
				throw new Error('innerRadius must be less than outerRadius');
			}

			if (Math.abs(endAngle - startAngle) >= 360) {
				endAngle = 359.99;
			}
			
			// adjust angles so that the starting point is at the top
			startAngle = startAngle - 90;
			endAngle = endAngle - 90;

			var outerStartX = centerX + outerRadius * Math.cos(Raphael.rad(startAngle));
			var outerStartY = centerY + outerRadius * Math.sin(Raphael.rad(startAngle));
			var outerEndX = (Math.abs(endAngle - startAngle) <= 180) ? centerX + outerRadius * Math.cos(Raphael.rad(endAngle)) - outerStartX : centerX + outerRadius * Math.cos(Raphael.rad(endAngle)) - outerStartX;
			var outerEndY = centerY + outerRadius * Math.sin(Raphael.rad(endAngle)) - outerStartY;
			var angle = 0;
			var largeArcFlag = (Math.abs(endAngle - startAngle) > 180) ? 1 : 0;
			var outerPath = Raphael.format("M{0},{1}a{2},{3},{4},{5},{6},{7},{8}", outerStartX, outerStartY, outerRadius, outerRadius, angle, largeArcFlag, 1, outerEndX, outerEndY);
		
			var innerStartX = centerX + innerRadius * Math.cos(Raphael.rad(endAngle));
			var innerStartY = centerY + innerRadius * Math.sin(Raphael.rad(endAngle));
			var innerEndX = centerX + innerRadius * Math.cos(Raphael.rad(startAngle)) - innerStartX;
			var innerEndY = centerY + innerRadius * Math.sin(Raphael.rad(startAngle)) - innerStartY;
			
			var innerPath = Raphael.format("L{0},{1}a{2},{3},{4},{5},{6},{7},{8}z", innerStartX, innerStartY, innerRadius, innerRadius, angle, largeArcFlag, 0, innerEndX, innerEndY);
			
			var arcPath = outerPath + innerPath;

			return {path: arcPath};
		};

		return this;
	}
	
	function Donut(paper, centerX, centerY, outerRadius, innerRadius, categories, isSelectable) {

		this.paper = paper;
		this.centerX = centerX;
		this.centerY = centerY;
		this.outerRadius = outerRadius;
		this.innerRadius = innerRadius;
		this.stickOutSize = 5;
		this.shrinkSize = 5;
		this.isSelectable = isSelectable;
		// numberOfCategorySlices tracks the number of slices created.  This could be different from this.categories.length if some categories have 0 amounts.
		this.numberOfCategorySlices = 0;

		this.paper.addArcAttributes();
		this.buildCategoryDonut(categories);
	}

	// baselineDuration is the time it should take to animate 10 slices at a certain ms per slice, which are sized evenly
	Donut.prototype.baselineDuration = 800;

	// baselinePause is based on 10 slices
	Donut.prototype.baselinePause = 300;

	Donut.prototype.generateRealtimeColors = function(numberOfItems, saturation, luminosity) {
		var colors = [];
		var stepSize = 1 / numberOfItems;
		var hue;
		for (var i = 0; i < numberOfItems; i++) {
			hue = i * stepSize;
			colors.push(Raphael.hsb(hue, saturation, luminosity));
		}

		return colors;
	}
	
	Donut.prototype.calculateTotalDuration = function(numberOfSlices) {
		return (numberOfSlices / 10) * this.baselineDuration;
	}

	Donut.prototype.calculateDurationFromAngle = function(angle, totalDuration) {
		return (angle / 360) * totalDuration;
	}

	Donut.prototype.calculatePauseBetweenSlices = function(numberOfSlices) {
		return this.baselinePause / numberOfSlices;
	}
	


	/* ====================================================
	*
	* 				Category functions
	*
	*  ====================================================
	*/

	/*
	* buildCategoryDonut creates the Raphael donut slice elements from the categories array.
	*
	* @param	categories An array of category objects.  Each object needs to
	*			have the following properties:
	*				percent
	*				, name
	*				, id
	*				, amount
	*/
	Donut.prototype.buildCategoryDonut = function(categories) {
		
		var colorSkew = utils.Color.ASSET;
		var colors = utils.Color.getColorSet(categories.length, colorSkew);
		var startAngle = 0;
		var endAngle = 0;
		var	self = this;

		this.numberOfCategorySlices = 0;
		this.paper.clear();

		if (!this.boundsEventListener) {
			this.boundsEventListener = function(event) {
				syboo.eventBus.trigger('donutMouseout');
			}
		}

		this.donutBounds = this.paper.circle(this.centerX, this.centerY, this.outerRadius + 30).attr({opacity: 0, fill: 'red'});
		this.donutBounds.mouseover(this.boundsEventListener);

		this.categories = categories;
		
		for (var i = 0; i < categories.length; i++) {
			categories[i].color = colors[i];
			categories[i].sliceId = categories[i].id;
			if (categories[i].amount > 0) {
				this.numberOfCategorySlices++;
				endAngle = startAngle + (categories[i].percent / 100 * 360);
				categories[i].element = this.paper.path()
					.attr(
						{
							circularArc: [
								this.centerX
								, this.centerY
								, this.outerRadius
								, this.innerRadius
								, startAngle
								, endAngle
							]
						}
					)
					.attr(
						{
							fill: colors[i]
							, stroke: colors[i]
							// , 'stroke-width': 0
							, title: categories[i].name + '\n' + categories[i].formattedAmount
							, cursor: 'pointer'
						}
					);
				categories[i].element.id = categories[i].id;
				categories[i].element.data('startAngle', startAngle);
				categories[i].element.data('endAngle', endAngle);
				categories[i].element.mouseover(this.getCategoryListeners(this).onCategoryMouseover);
				categories[i].element.mouseout(this.getCategoryListeners(this).onCategoryMouseout);
				if(this.isSelectable)
					categories[i].element.click(this.getCategoryListeners(this).onCategoryClick);
				startAngle = endAngle;
			}
		}
	};

	Donut.prototype.getCategoryListeners = function(instance) {
		if (!instance._categoryListeners) {
			instance._categoryListeners = {
				// On category slice mouseover, expand the slice outward
				onCategoryMouseover: function(event) {
					var slice = this;
					this.stop().animate(
						{
							circularArc: [
								instance.centerX
								, instance.centerY
								, instance.outerRadius + instance.stickOutSize
								, instance.innerRadius
								, this.data('startAngle')
								, this.data('endAngle')
							]
							, opacity: 1
						}
						, 300
						, '>'
					);

					_.each(instance.categories, function(category) {
						if (category.percent > 0 && category.element !== slice) {
							category.element.stop().animate(
								{
									circularArc: [
										instance.centerX
										, instance.centerY
										, instance.outerRadius
										, instance.innerRadius
										, category.element.data('startAngle')
										, category.element.data('endAngle')
									]
									, opacity: 0.5
								}
							, 100);
						}
					})

					syboo.eventBus.trigger('sliceMouseover', this.id);
				}

				// On category slice mouseout, return slice to default size
				, onCategoryMouseout: function(event) {
					var slice = this;
					this.stop().animate(
						{
							circularArc: [
								instance.centerX
								, instance.centerY
								, instance.outerRadius
								, instance.innerRadius
								, this.data('startAngle')
								, this.data('endAngle')
							]
						}
						, 100
					);

					_.each(instance.categories, function(category) {
						if (category.percent > 0 && category.element !== slice) {
							category.element.stop().animate(
								{
									circularArc: [
										instance.centerX
										, instance.centerY
										, instance.outerRadius
										, instance.innerRadius
										, category.element.data('startAngle')
										, category.element.data('endAngle')
									]
									, opacity: 1
								}
							, 100);
						}
					})

					syboo.eventBus.trigger('sliceMouseout', this.id);
				}

				, onCategoryClick: function(event) {
					console.log('onCategoryClick', this)
					syboo.eventBus.trigger('categorySelected', this.id);
				}
			}
		}

		return instance._categoryListeners;
	}




	utils.Donut = Donut;
	// set reference back
	syboo.utils = utils;
	window.syboo = syboo;
});