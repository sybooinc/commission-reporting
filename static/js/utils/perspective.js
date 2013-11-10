define([
	'raphael'
	, 'jquery'
	, 'underscore'
],function(Raphael, $, _){
	
	$.addSVGClass = function(node, klass){
		/*if (BrowserDetect.browser == "Explorer" && BrowserDetect.version == 8) {
			return;
		} else {
			return node.node.setAttribute('class', klass);
		}*/
	};

	Raphael.fn.drawGrid = function(config){
		var paper = this;
		var max = config.max;
		var min = config.min;
		var topPadding = (config.topPadding) ? config.topPadding : 0.1;
		var bottomPadding = (config.bottomPadding) ? config.bottomPadding : 0.1;
		var rightPadding = (config.rightPadding) ? config.rightPadding : 0;
		var hideLabels = (config.hideLabels) ? config.hideLabels : false;
		var yLabelType = (config.yLabelType) ? config.yLabelType : 'dollar';
		var xLabels = (config.xLabels) ? config.xLabels : false;
		var animateIn = (config.animateIn) ? config.animateIn : false;
		var container = (config.container) ? config.container : '';
		var dashArray = (config.dashArray) ? config.dashArray : [''];
		
		var alignLabels = (config.alignLabels) ? config.alignLabels : 'right';
		
		var yOffset
		if(xLabels){
			yOffset = 20
		} else {
			yOffset = 1
		}

		var height = paper.height - yOffset;
		

		//add padding
		var chartMax = max + ((max - min) * topPadding);
		var chartMin = min - ((max - min) * bottomPadding);

		if(max < 10 && min == 0 && yLabelType != 'percentage'){
			chartMax = 10;
			chartMin = 0;
		}
		

		//set minimum range
		var rangeFactor = .05;
		var minimumRange = chartMax * rangeFactor;
		if((chartMax - chartMin) < minimumRange){
			var splitRange = minimumRange / 2;
			chartMax = max + splitRange;
			chartMin = min - splitRange;
		}

		
		var yRange = chartMax - chartMin;
		
		// formulate the grid y increments
		var figureCount = Math.round(yRange).toString().length;
		var multiplier = Math.pow(10, figureCount);
		
		var increments = [.01, .02, .05, .1, .2, .5, 1, 1.2, 1.05, 2];
		var qualifiers = [];
		_.each(increments, function(val, i){
			qualifiers[i] = (yRange /  (val * multiplier));
		});
		
		var closestIndex = null;
		var targetDivisor = 5;
		var delta = 1000;
		
		_.each(qualifiers, function(val, i){
			var iDelta = Math.abs(targetDivisor - val);
			if(iDelta < delta){
				closestIndex = i;
				delta = iDelta;
			}
		});
		
		var modulus = increments[closestIndex] * multiplier;
		
		function getReducedMin(num){
			num = Math.round(num);
			if(num > 0){
				num = num - (num % modulus);
			} else {
				num = num - (num % modulus) - modulus;
			}
			
			if(min >= 0 && num < 0){
				num = 0;
			}

			return num;
		}
		
		function getIncreasedMax(num){
			num = Math.round(num);
			if(num > 0 || (num == 0 && yLabelType == 'percentage')){
				num = num - (num % modulus) + modulus;
			} else if(max == 0){
				num = 0;
			} else {
				num = num - (num % modulus) ;
			}

			if(chartMax <= 0 && num > 0 && yLabelType != 'percentage'){
				num = 0;
			}

			return num;
		}
		
		chartMin = getReducedMin(chartMin);
		chartMax = getIncreasedMax(chartMax);
		yRange = chartMax - chartMin;

	
		//draw the grid
		var inc = yRange / modulus;
		var yIncrement = height / inc;
		var currentY = yIncrement;
		var yLabels = [];
		var rawYLabels = [];
		for(var i = 0; i < inc; i++){
			rawYLabels[i] = chartMax - (modulus * (i + 1));
		}
		
		var sigfig = 0;
		var maxLength = _.max(_.map(rawYLabels, function(val){return Math.abs(val).toString().length;}));
		function getSigFig(num){
			num = num * 100;
			var numString = Math.abs(num).toString().split("").reverse().join("");
			for(var i = 0; i < numString.length; i++){
				if(numString[i] == 0){
					continue;
				} else {
					return numString.substr(i).length;
				}
			}
			
		}
		_.each(rawYLabels, function(val){
			var iSigfig = getSigFig(val);
			if(iSigfig > sigfig) sigfig = iSigfig;
		});
		
		paper.gridElements = [];
		var zeroPosition;
		for(var i = 0; i < inc; i++){
			var line1 = paper.path('M0,' + (currentY - 1) + 'L' + paper.width + ',' + (currentY - 1)).attr({'stroke-width': 1, stroke: '#BDBDBD','stroke-dasharray': dashArray});
			if(yLabelType == 'percentage'){
				label = getPercentageYLabels(rawYLabels[i])
			} else{
				label = getDollarYLabel(rawYLabels[i])
			}
			var paddingRight = (config.yLabelPaddingRight) ? config.yLabelPaddingRight : 2;

			if (alignLabels == 'right'){
				var text = paper.text(paper.width - paddingRight, currentY - 6, label).attr({'text-anchor': 'end', 'opacity': 1, 'fill' : '#333', 'font-size': '10px', 'pointer-events': 'none'});
			} else {
				var text = paper.text(2, currentY - 6, label).attr({'text-anchor': 'start', 'opacity': 1, 'fill' : '#333', 'font-size': '10px', 'pointer-events': 'none'});
			}
			if(rawYLabels[i] == 0) zeroPosition = currentY;
		
			text.hiddenByDefault = false;
			if((i > 0 && i < inc - 1) && hideLabels && !(config.demarcateZero && rawYLabels[i] == 0 )){
				text.attr({opacity: 0});
				text.hiddenByDefault = true;
			}
			if(config.demarcateZero && rawYLabels[i] == 0 ){
				text.attr({'font-weight': "bold"});
			}
			$.addSVGClass(text, 'noEvents');
			yLabels[i] = text;
			paper.gridElements.push(line1);
			paper.gridElements.push(text);
			$.addSVGClass(line1, 'crispEdges');
			currentY += yIncrement;
		}

		function getPercentageYLabels(x){
			return x.toFixed(2) + '%';
		}
		
		function getDollarYLabel(x){
			
			var maxInSeries = _.max(_.map(rawYLabels, function(val){return Math.abs(val);}));
			if(maxInSeries >= 1000000){
				x = Math.round(x);
				var toFixed = sigfig + 6 - maxLength;
				if(toFixed <= 0) toFixed = 0;
				return '$' + (x / 1000000.0).toFixed(toFixed) + 'M';
			} else if( maxInSeries >= 1000){
				x = Math.round(x);
				var toFixed = sigfig + 3 - maxLength;
				if(toFixed <= 0) toFixed = 0;
				if(maxInSeries <= 2000) toFixed = 2;
				return '$' + (x / 1000.0).toFixed(toFixed) + 'K';
			} else {
				//var toFixed = sigfig + 2 - maxLength;
				return '$' + x.toFixed(2);
			}
			return x;
		}

		//render the xLabels
		if(xLabels){
			var xLength = xLabels.length;
			var xWidth = paper.width - rightPadding;
			// console.log(paper.width, xWidth)
			var increment = xWidth / xLength
			var x = increment
			for(var i = 0; i < xLength; i++){
				var text = paper.text(x - (increment / 2), paper.height - 8, xLabels[i]).attr({'text-anchor': 'middle', 'opacity': 1, 'fill' : '#333', 'font-size': '11px'});
				x += increment;
			}
		}

		if(config.demarcateZero){
			paper.rect(0, zeroPosition - 1, paper.width, 4).attr({fill: '90-#efefef:5-#999:100', 'fill-opacity': 1, 'stroke': 'none'}).toBack();
			var c = paper.rect(0, zeroPosition, paper.width, paper.height).attr({fill: '#efefef', 'fill-opacity': .75, 'stroke': 'none'}).toBack();
		}
		

		this.stackingOrder = 0;
		this.paths = [];
		this.zeroPosition = zeroPosition;
		this.seriesMax = max;
		this.seriesMin = min;
		this.chartMax = chartMax;
		this.chartMin = chartMin;
		this.yRange = yRange;
		this.yLabels = yLabels;
		this.rightPadding = rightPadding;
		this.chartHeight = height;
		this.animateIn = animateIn;
		this.series = [];
		this.seriesPoints = [];
		this.container = container;
		return this;
	
	};
	Raphael.fn.bringGridToFront = function(){
		var paper = this;
		_.each(paper.gridElements, function(el){
			el.toFront();
		});
		return this;
	}
	function getSeriesString(paper, series){
		var xIncrement = ((paper.width - paper.rightPadding) / (series.length - 1));
		var seriesMax = _.max(series);
		var seriesMin = _.min(series);
		var seriesString = "",
			x = 0, y = 0;
		_.each(series, function(val, i){
			// y / paper.height = (seriesMax - val) / yRange
			y = Math.round(((paper.chartMax - val) / paper.yRange) * paper.chartHeight);
			if(i == 0){
				seriesString += "M" + x + ',' + y;
			} else {
				seriesString += "L" + x + ',' + y;
			}
			x += xIncrement;
		});
		if(seriesMax >= 0){
			if(paper.rightPadding > 0){
				seriesString += "L" + (x - xIncrement)  + ',' + (paper.chartHeight + 5) + 'L-50,' + (paper.chartHeight + 5) + 'Z';
			} else {
				seriesString += "L" + x  + ',' + y + "L" + x  + ',' + (paper.chartHeight + 5) + 'L-50,' + (paper.chartHeight + 5) + 'Z';
			}
		} else {
			seriesString += "L" + x  + ',-5 L-50,-5Z';
		}
		
		return seriesString;
	}
	Raphael.fn.simpleArea = function(config){
		var paper = this;
		var series = config.series;
		this.series.push(series);
		var stroke = (config.stroke) ? config.stroke : '#0088cc';
		var strokeWidth = (config.strokeWidth) ? config.strokeWidth : 1;
		var strokeOpacity = (config.strokeOpacity != undefined) ? config.strokeOpacity : 1 ;
		var fill = (config.fill) ? config.fill : '#0088cc';

		
		var area = paper.path(getSeriesString(paper, series)).attr({'stroke' : stroke, 'stroke-width': strokeWidth, 'stroke-opacity': strokeOpacity, fill: fill, 'fill-opacity': 1});
		area.stackingOrder = paper.stackingOrder++;
		area.id = config.id;

		this.paths.push(area);
	};
	Raphael.fn.transformPath = function(id, series, time, easing){
		var paper = this;
		_.filter(paper.paths, function(el){return el.id == id})[0].animate({path: getSeriesString(paper, series)}, time, easing)

	}
	Raphael.fn.animatePath = function(id, obj, time, easing, stop){
		var paper = this;
		if(stop != undefined){
			_.filter(paper.paths, function(el){return el.id == id})[0].stop(stop).animate(obj, time, easing)
		} else {
			_.filter(paper.paths, function(el){return el.id == id})[0].animate(obj, time, easing)
		}
	}
	Raphael.fn.drawLineSeries = function(config){
		var paper = this;
		var series = config.series;
		var stroke = (config.stroke) ? config.stroke : '#0088cc';
		var fill = (config.fill) ? config.fill : '#0088cc';
		var fillOpacity = (config.fillOpacity) ? config.fillOpacity : 1;
		var strokeWidth = (config.strokeWidth) ? config.strokeWidth : 1;
		var seriesMax = _.max(series);
		var seriesMin = _.min(series);

		
		
		if(config.type == 'noisyArea') fillOpacity = .5;
		
		this.series.push(series);
		var xIncrement = ((paper.width - paper.rightPadding) / (series.length - 1)) ;
		function getSeriesString(series){
			var seriesString = "",
				x = 0;
				paper.seriesPoints[paper.series.length - 1] = [];
			_.each(series, function(val, i){
				// y / paper.height = (seriesMax - val) / yRange
				y = Math.round(((paper.chartMax - val) / paper.yRange) * paper.chartHeight);
				if(i == 0){
					seriesString += "M" + x + ',' + y;
				} else {
					seriesString += "L" + x + ',' + y;
				}
				paper.seriesPoints[paper.series.length - 1].push([x,y]);
				x += xIncrement;
			});
			if(seriesMax > 0){
				if(paper.rightPadding > 0){
					seriesString += "L" + (x - xIncrement)  + ',' + (paper.chartHeight + 5) + 'L-50,' + (paper.chartHeight + 5) + 'Z';
				} else {
					seriesString += "L" + x  + ',' + (paper.chartHeight + 5) + 'L-50,' + (paper.chartHeight + 5) + 'Z';
				}
				
			} else {
				seriesString += "L" + x  + ',-5 L-50,-5Z';
			}
			
			return seriesString;
		}
		function drawZeroSeriesString(series){
			var seriesString = ""
				, x = 0
				, direction = 1;
			_.each(series, function(val, i){
				y = ((paper.chartMax - val) / paper.yRange) * paper.chartHeight;
				var zero = ((paper.chartMax - 0) / paper.yRange) * paper.chartHeight;
				if(i == 0){
					seriesString += "M" + -10 + ',' + zero;
					direction = (y <= zeroY ? 1 : 0);
				}
				if(i == 1){
					seriesString += "L" + x + ',' + y;
				}

				if((direction == 1 && y > zeroY) || (direction == 0 && y < zeroY)){
					x -= xIncrement / 2;
					seriesString += "L" + x + ',' + zeroY + 'Z';
					paper.path(seriesString).attr({'stroke' : colors[direction], 'stroke-width': 2, 'opacity': 1, fill: fills[direction], 'fill-opacity': .5});
					paper.path(seriesString).attr({'stroke' : 'none', 'stroke-width': 0, 'opacity': 1, fill: "url('"+staticUrl+"/static/img/bootstrap/noise.png')", 'fill-opacity': 1});
					seriesString = "M" + x + ',' + zeroY;
					x += xIncrement / 2;
					seriesString += "L" + x + ',' + y;
					direction = y <= zeroY ? 1 : 0;
				}else{
					seriesString += "L" + x + ',' + y;
				}
				x += xIncrement;
			});
			seriesString += "L" + x + ',' + zeroY + 'Z';	
			paper.path(seriesString).attr({'stroke' : colors[direction], 'stroke-width': 2, 'opacity': 1, fill: fills[direction], 'fill-opacity': .5});
			paper.path(seriesString).attr({'stroke' : 'none', 'stroke-width': 0, 'opacity': 1, fill: "url('"+staticUrl+"/static/img/bootstrap/noise.png')", 'fill-opacity': 1});
		}
		function getSmoothSeriesString(series, index){
			var seriesString = "";
			var x;
			if(index){
				x = index * xIncrement;
				var start = index * xIncrement;
				series = _.rest(series, index);
			} else {
				x = 0;
			}
			_.each(series, function(val, i){
				// y / paper.height = (seriesMax - val) / yRange
				y = ((paper.chartMax - val) / paper.yRange) * paper.chartHeight;
				if(i == 0){
					if(series.length > 2){
						seriesString += "M" + x + ',' + y + "R";
					} else {
						seriesString += "M" + x + ',' + y + "L";
					}
				} else {
					seriesString += " " + x + ',' + y + ' ';
				}
				
				x += xIncrement;
			});
			if(!index){
				seriesString += "L" + (x + 100) + ',' + (paper.chartHeight) + 'L-20,' + (paper.chartHeight + 40) + 'Z';
			} else {
				seriesString += "L" + (x + 100) + ',' + (paper.chartHeight) + 'L' +start + ',' + (paper.chartHeight + 40) + 'Z';
			}
			return seriesString;
		}
		var seriesString;
		var colors = ['#f25100', '#0088cc'];
		var fills;
		if(fill == 'none'){
			fills = ['none', 'none']
		} else {
			fills = colors;
		}
		var drawZero = seriesMin < 0;
		var zeroY = 180;
		
		if(seriesMax ==0 && seriesMin == 0) {
			var line = paper.path('M0,'+ (paper.zeroPosition - 3 )+'L' + paper.width + ',' + (paper.zeroPosition - 3 )).attr({'stroke-width': 3, stroke: '#0088cc'});
			$.addSVGClass(line, 'crispEdges');
		} else if (drawZero){
			zeroY = ((paper.chartMax / paper.yRange) * paper.chartHeight);
			paper.path('M0,' + zeroY + 'L' + paper.width + ',' + zeroY).attr({'stroke-width': 1, stroke: '#000'});
			drawZeroSeriesString(series);
		}else{
			if(config.smooth){
				seriesString = getSmoothSeriesString(series);
			} else {
				seriesString = getSeriesString(series);
			}
			if(seriesMax < 0){
				stroke = '#f25100';
				fill = '#f25100';
			}
			paper.path(seriesString).attr({'stroke' : stroke, 'stroke-width': strokeWidth, 'opacity': 1, fill: fill, 'fill-opacity': fillOpacity});
			if(config.type == "noisyArea") paper.path(seriesString).attr({'stroke' : 'none', 'stroke-width': 0, 'opacity': 1, fill: "url('"+staticUrl+"/static/img/bootstrap/noise.png')", 'fill-opacity': 1});
		
		}
		
		this.xIncrement = xIncrement;
		return this;
	};
	Raphael.fn.drawBarSeries = function(config){
		var paper = this;
		var series = config.series;
		this.series.push(series);
		var barPercentageWidth = (config.width) ? config.width : .6;
		var shiftX = (config.shiftX) ? config.shiftX : 0;
		var hoverTips = (config.hoverTips) ? config.hoverTips : false;
		var color = (config.color) ? config.color : '#0088cc';
		var bars = [];
		var xIncrement = (paper.width - paper.rightPadding ) / series.length;

		var barWidthPX = xIncrement * barPercentageWidth;
		var totalDiff = (xIncrement - barWidthPX);
		var offset =  totalDiff / 2;

		var shiftXPX = xIncrement * shiftX;

		offset = offset + shiftXPX;

		paper.seriesPoints[paper.series.length - 1] = [];

		if(hoverTips && paper.hoverTipAppended == undefined){
			paper.hoverTipAppended = true;
			$('#' + paper.container).css({position: 'relative'}).append('<div class="barTipPlane"><div class="tip"><span>Murr</span></div></div>');
			$('.barTipPlane .tip').mouseenter(function(){
				$(this).show();
			}).mouseleave(function(){
				$(this).hide();
			})
		}

		for(var i = 0; i < series.length; i++){
			var point = (xIncrement * i);
			var y, rect, rectHeight;
			
			if(series[i] > 0){
				y = Math.round(((paper.chartMax - series[i]) / paper.yRange) * paper.chartHeight);
				rectHeight = Math.round(paper.chartHeight - y - (paper.chartHeight - paper.zeroPosition));
				rect = paper.rect(point + offset, y, xIncrement - totalDiff, rectHeight).attr({fill: color, stroke: 'none', opacity: 1});
				if(hoverTips){
					$('.barTipPlane .tip').hide();
					var tipColumn = paper.rect(point + offset, 0, xIncrement - totalDiff, paper.chartHeight).attr({fill: color, stroke: 'none', opacity: 0})
									.data('position', {'x': point + offset + ((xIncrement - totalDiff) / 2), 'y': y})
									.data('value', hoverTips.formatter(series[i]))
									.hover(function(){
										var position = this.data('position');
										var value = this.data('value');
										$('.barTipPlane .tip span').html(value)
										$('.barTipPlane .tip').show()
										.css({left: position.x - ($('#' + paper.container + ' .barTipPlane .tip').width() / 2), top: position.y})
									})
									.mouseout(function(){
										$('.barTipPlane .tip').hide()
									})
				}
				paper.seriesPoints[paper.series.length - 1].push([point + offset + xIncrement - totalDiff, y]);
			} else {
				y = paper.zeroPosition;
				var yPoint = Math.round(((paper.chartMax - series[i]) / paper.yRange) * paper.chartHeight);
				rectHeight = Math.round((paper.chartHeight - yPoint - (paper.chartHeight - paper.zeroPosition)) * -1);
				rect = paper.rect(point + offset, y, xIncrement - totalDiff, rectHeight).attr({fill: color, stroke: 'none', opacity: 1});
				paper.seriesPoints[paper.series.length - 1].push([point + offset + xIncrement - totalDiff, y]);
			}
			$.addSVGClass(rect, 'crispEdges');
			bars[i] = rect;
		}
		this.xIncrement = xIncrement;
		return this;
	};
	Raphael.fn.drawPointDiff = function(config){
		var self = this;
		var x = _.last(self.seriesPoints[0])[0];
		var y = _.last(self.seriesPoints[0])[1];
		var width = 6;
		var offset = x - width;
		var height = _.last(self.seriesPoints[1])[1] - y;
		var c = self.rect(offset, y, width, height).attr({fill: "url('"+staticUrl+"/static/img/bootstrap/verticalStripes.png')", stroke: 'none'});

		var tip = $(self.container).find('.bubble');
		var tipLeft = (offset - (tip.width() / 2) - 2);
		var tipTop = (y - tip.height()+ 13);
		var diff = _.last(self.series[0]) - _.last(self.series[1])
		tip.css({left: tipLeft , top: tipTop}).html(config.text.replace("%n", diff));
		return this;
	}
	Raphael.fn.hoverGrid = function(config){
		var paper = this;
		var pointHoverCallback = config.pointHoverCallback;
		var mouseenter = config.mouseenter;
		var mouseleave = config.mouseleave;
		var overlay = paper.rect(paper.width, 0, 1, paper.chartHeight).attr({'fill' : "#666", 'stroke': 'none', 'opacity': .8});
		var parentId = config.parentId;
		if(config.container){
			$('#' + config.container).html('');
			var canvas = paper;
			paper = Raphael(config.container);
			paper.series = canvas.series;
			paper.xIncrement = canvas.xIncrement
			paper.height = canvas.height
		}
		
		//Draw tooltip grid
		
		var longestSeries = _.max(paper.series, function(series){ return series.length; });
		for(var i = 0; i < longestSeries.length; i++){
			var point = (paper.xIncrement * i);
			var rect = paper.rect((point - (paper.xIncrement * .5)), 0, paper.xIncrement, paper.height).attr({'stroke-width': 0, fill: '#000', opacity: 0}).data("i", i);
			var previousColumIndex;
			rect.mousemove(function(e){
				// make sure this is optimized
				var i = this.data('i');
				overlay.attr({x:e.layerX, opacity: 1});
				if(config.continuousCallback) config.continuousCallback(e);
				if(i != previousColumIndex){
					previousColumIndex = i;
					pointHoverCallback(i);
				}
			});
		}
		

		
			$('#' + parentId).mouseleave(function(e){
				_.each(paper.yLabels, function(el){
					if(el.hiddenByDefault) el.animate({opacity: 0}, 200);
				});
				overlay.stop().animate({opacity: 0}, 100);
				mouseleave();
			}).mouseenter(function(e){
				_.each(paper.yLabels, function(el){
					if(el.hiddenByDefault) el.animate({opacity: 1}, 200);
				});
				mouseenter();
			});
		
		
		
		return this;
	};
	Raphael.fn.drawBaseline = function(){
		var paper = this;
		var line = paper.path('M0,'+paper.chartHeight+'L' + paper.width + ',' + paper.chartHeight).attr({'stroke-width': 2, stroke: '#777'});
		$.addSVGClass(line, 'crispEdges');
		return this;
	};
	Raphael.fn.drawZeroline = function(){
		var paper = this;
		if(paper.zeroPosition != undefined){
			var line = paper.path('M0,'+ (paper.zeroPosition )+'L' + paper.width + ',' + (paper.zeroPosition )).attr({'stroke-width': 3, stroke: '#999'});
			$.addSVGClass(line, 'crispEdges');
		}
		
		return this;
	};
	Raphael.fn.moveYLabelsToFront = function(){
		var self = this;
		_.each(self.yLabels, function(val){
			val.toFront();
		})
		return this;
	}
	Raphael.fn.pieChart = function(cx, cy, r, values, colors, labels, stroke){
		
    	var paper = this,
        rad = Math.PI / 180,
        chart = this.set();
	    function sector(cx, cy, r, startAngle, endAngle, params) {
	        var x1 = cx + r * Math.cos(-startAngle * rad),
	            x2 = cx + r * Math.cos(-endAngle * rad),
	            y1 = cy + r * Math.sin(-startAngle * rad),
	            y2 = cy + r * Math.sin(-endAngle * rad);
	        return paper.path(["M", cx, cy, "L", x1, y1, "A", r, r, 0, +(endAngle - startAngle > 180), 0, x2, y2, "z"]).attr(params);
	    }
	    var angle = 90,
	        total = 0,
	        start = 0,
	        process = function (j) {
	            var value = values[j],
	                angleplus = 360 * value / total,
	                popangle = angle + (angleplus / 2),
	                color = Raphael.hsb(start, .75, 1),
	                ms = 500,
	                delta = 30,
	                bcolor = colors[j];
	                if(j == 1){
	                	shadow = sector(cx + 0, cy + 1, r, angle, angle + angleplus, {fill: '#000' , stroke: '#000', "stroke-width": 2, opacity:.5}).blur(1);
	                }
	                
	                p = sector(cx, cy, r, angle, angle + angleplus, {fill: bcolor , stroke: stroke, "stroke-width": 2});
	            angle += angleplus;
	            chart.push(p);
	            start += .1;
	        };
	    for (var i = 0, ii = values.length; i < ii; i++) {
	        total += values[i];
	    }
	    for (i = 0; i < ii; i++) {
	        process(i);
	    }
	    return chart;
	}
	Raphael.fn.percentWheel = function (initVal) {
		    var p = this,
		    	rad = Math.PI / 180,
		        chart = this.set();
		    
		    p.customAttributes.arc = function (xloc, yloc, value, total, R) {
		        var alpha = 360 / total * value,
		            a = (90 - alpha) * Math.PI / 180,
		            x = xloc + R * Math.cos(a),
		            y = yloc - R * Math.sin(a),
		            path;
		        if (total == value) {
		            path = [
		                ["M", xloc, yloc - R],
		                ["A", R, R, 0, 1, 1, xloc - 0.01, yloc - R]
		            ];
		        } else {
		            path = [
		                ["M", xloc, yloc - R],
		                ["A", R, R, 0, +(alpha > 180), 1, x, y]
		            ];
		        }
		        return {
		            path: path
		        };
		    };
		    
		    //p.circle(100, 100, 75).attr({fill: '#ccc', stroke: 'none'});
		    //p.circle(100, 100, 73).attr({fill: '#fff', stroke: 'none'});

		    var my_arc = p.path().attr({
		        "stroke": "#56BEB7",
		        "stroke-width": 48,
		        arc: [100, 100, initVal, 100, 62]
		    });
		    
		    p.circle(100, 100, 80).attr({fill: '#444', stroke: 'none'}).blur(1);
		    p.circle(100, 100, 80).attr({fill: '#fff', stroke: 'none'});
		};

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
	
});