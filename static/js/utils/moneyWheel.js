define([
	'raphael'
	, 'jquery'
],function(Raphael, $){
	(function(Raphael){
		Raphael.fn.moneyWheel = function (values, categoryIds, container, colors, category) {
			var paper = this,
				rad = Math.PI / 180,
				chart = this.set(),
				cx = paper.width / 2,
				cy = paper.height / 2,
				r = 125,
				outboundURL;
			
			if(category == 'income'){
				outboundURL = '/page/login/app#/cash-flow/income/'
			} else if (category == 'spending'){
				outboundURL = '/page/login/app#/cash-flow/expense/'
			}
				
			colors = colors.slice(0, values.length).reverse();
				
			function sector(cx, cy, r, startAngle, endAngle, params) {
				var x1 = cx + r * Math.cos(-startAngle * rad),
					x2 = cx + r * Math.cos(-endAngle * rad),
					y1 = cy + r * Math.sin(-startAngle * rad),
					y2 = cy + r * Math.sin(-endAngle * rad);
				return paper.path(["M", cx, cy, "L", x1, y1, "A", r, r, 0, +(endAngle - startAngle > 180), 0, x2, y2, "z"]).attr(params);
			}
			
			var angle = 90,
				total = 0,
				sectors = [],
				process = function (j) {
					var value = values[j],
						angleplus = 360 * value / total,
						ms = 200,
						p;
					
					if (value != 1){
						p = sector(cx, cy, r, angle, angle + angleplus, {fill: "#" + colors[j], stroke: '#ccc', "stroke-width":2});
						$.addSVGClass(p, 'hoverHand');
						sectors[j] = p;
					} else {
						p = paper.circle(cx, cy, 125).attr({fill: "#" + colors[j], stroke: 'none'});
						sectors[j] = p;
					}
						
					p.click(function(){
						if(categoryIds[j] !== 0){
							window.location = outboundURL + categoryIds[j];
						} else {
							window.location = outboundURL;
						}
						
					}).mouseover(function () {
						$(container).find('div.wheelLabel').stop().hide();
						$(container).find('div[data-categoryid='+categoryIds[j]+']').fadeIn(300);
						_.each(sectors, function(q){
							q.stop().animate({opacity: 0.75}, ms);
							p.stop().attr({opacity: 1});
						})
					}).mouseout(function () {
						$(container).find('div.wheelLabel').hide()
						$(container).find('div.default').show();
						_.each(sectors, function(q){
							q.stop().animate({opacity: 1}, ms);
						})
					});
					angle += angleplus;
					chart.push(p);
				 
					
				};
				
				for (var i = 0, ii = values.length; i < ii; i++) {
					total += values[i];
				}
				
				var circle = paper.circle(cx, cy, 128).attr({"fill": '#cccccc', 'stroke': '#ccc'});
				for (i = 0; i < values.length; i++) {
					process(i);
				}

			paper.circle(cx, cy, 90).attr({fill: '#cccccc', stroke : '#ccc'});
			paper.circle(cx, cy, 87).attr({fill: '#f1f1f1', stroke: '#ccc'});
			
			return chart;
		};
	})(Raphael);
});