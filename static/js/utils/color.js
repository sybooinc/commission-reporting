(function(){
	// get reference
	var syboo = window.syboo || {}
		, utils = syboo.utils || {};

	utils.Color = {};

	utils.Color.ASSET = 'asset';
	utils.Color.LIABILITY = 'liability';

	utils.Color.getColorSet = function(numberOfItems, colorFamily, excludeColor) {
		var colorSet;

		if (excludeColor) {
			numberOfItems++;
		}

		if(numberOfItems <= 7) {
			colorSet = this[colorFamily + 'Colors7'];
		} else if(numberOfItems <= 15) {
			colorSet = this[colorFamily + 'Colors15'];
		} else if(numberOfItems <= 27) {
			colorSet = this[colorFamily + 'Colors27'];
		} else if(numberOfItems <= 40) {
			colorSet = this[colorFamily + 'Colors40'];
		} else {
			colorSet = this[colorFamily + 'Colors60'];
		}

		if (!colorSet){
			throw new Error('cannot find color set ' + colorSet );
		}

		if (excludeColor) {
			colorSet = _.reject(colorSet, function(color) {
				return color.toUpperCase() == excludeColor.toUpperCase();
			});
		}

		if (colorSet.length < numberOfItems) {
			var multiple = Math.floor(numberOfItems / colorSet.length);

			for (var i = 0; i < multiple; i++) {
				var repeatColors = _.clone(colorSet);
				colorSet = colorSet.concat(repeatColors);
			};
		}

		return colorSet;
	};

		utils.Color.rainbowColors7 = [
			'#4375bf',
			'#17a8e5',
			'#67e6d3',
			'#99ffa3',
			'#f7ff66',
			'#5550b3',
			'#8550e6'
		];

	// a hack
	utils.Color.rainbowColors15 = utils.Color.rainbowColors7.concat(utils.Color.rainbowColors7);

	utils.Color.assetColors7 = [
		'#4381bf'
		, '#43abbf'
		, '#3dcca8'
		, '#5ce6b8'
		, '#8cffb2'
		, '#99e673'
		, '#c3ff4d'
	];

	utils.Color.assetColors15 = [
		'#4d73bf'
		, '#4396bf'
		, '#33bfcc'
		, '#4cd9b6'
		, '#7ee6b2'
		, '#bfffbf'
		, '#99e673'
		, '#e3ff59'
		, '#cbf255'
		, '#99e68a'
		, '#8cffb2'
		, '#5ce6b8'
		, '#47ccc1'
		, '#43abbf'
		, '#4381bf'
	];

	utils.Color.assetColors27 = [
		'#4375bf'
		, '#2983cc'
		, '#1495cc'
		, '#52bacc'
		, '#6cd9d9'
		, '#67e6d3'
		, '#91f2d5'
		, '#8ae6bc'
		, '#5ce693'
		, '#79f297'
		, '#99ffa3'
		, '#8bf285'
		, '#93e67e'
		, '#86db58'
		, '#8fcc52'
		, '#b1e650'
		, '#cbf230'
		, '#f7ff66'
		, '#f7b2ff'
		, '#da79f2'
		, '#b55ce6'
		, '#a15ce6'
		, '#8550e6'
		, '#6e50e6'
		, '#5550b3'
		, '#5661bf'
		, '#4362bf'
	];

	utils.Color.assetColors40 = [
		'#4375bf'
		, '#2983cc'
		, '#1495cc'
		, '#52bacc'
		, '#6cd9d9'
		, '#67e6d3'
		, '#91f2d5'
		, '#8ae6bc'
		, '#5ce693'
		, '#79f297'
		, '#99ffa3'
		, '#8bf285'
		, '#93e67e'
		, '#86db58'
		, '#8fcc52'
		, '#b1e650'
		, '#cbf230'
		, '#f7ff66'
		, '#ffe81a'
		, '#ffcf40'
		, '#ffb340'
		, '#ff9640'
		, '#ff7940'
		, '#ff5c40'
		, '#FF4040'
		, '#cc3d53'
		, '#cc5276'
		, '#f25ea1'
		, '#e650aa'
		, '#e660c4'
		, '#e673da'
		, '#e282ed'
		, '#c36cd9'
		, '#b55ce6'
		, '#a15ce6'
		, '#8550e6'
		, '#6e50e6'
		, '#5550b3'
		, '#5661bf'
		, '#4362bf'
	];

	utils.Color.assetColors60 = [
		'#4375bf'
		, '#4381bf'
		, '#2b93d9'
		, '#14a4cc'
		, '#3dafcc'
		, '#52c0cc'
		, '#6cd9d9'
		, '#67e6d9'
		, '#6df2d8'
		, '#91f2d5'
		, '#95e6c5'
		, '#7ee6b2'
		, '#5ce693'
		, '#6df295'
		, '#80ff99'
		, '#99ffa3'
		, '#bfffbf'
		, '#a3ff99'
		, '#93e67e'
		, '#94d977'
		, '#7ed941'
		, '#8fcc52'
		, '#98d936'
		, '#b9e650'
		, '#cbf230'
		, '#dff230'
		, '#ffff66'
		, '#ffe81a'
		, '#ffd940'
		, '#ffc640'
		, '#ffb340'
		, '#ff9f40'
		, '#ff8c40'
		, '#ff7940'
		, '#ff6640'
		, '#ff5340'
		, '#FF4040'
		, '#d93644'
		, '#cc4762'
		, '#cc5276'
		, '#cc477c'
		, '#d94c92'
		, '#e650aa'
		, '#e65cbc'
		, '#e667cc'
		, '#e673da'
		, '#f279f2'
		, '#da73e6'
		, '#c36cd9'
		, '#b562d9'
		, '#ae5ce6'
		, '#a15ce6'
		, '#8b57d9'
		, '#7d50e6'
		, '#6e50e6'
		, '#6457d9'
		, '#5656bf'
		, '#5661bf'
		, '#435cbf'
		, '#4368bf'
	];

	utils.Color.liabilityColors7 = [
		'#ff4040'
		, '#ff8833'
		, '#ffAA33'
		, '#ffcc33'
		, '#ffff33'
		, '#f26d99'
		, '#cc5cc3'
	];

	utils.Color.liabilityColors15 = [
		'#ff490d'
		, '#ff720d'
		, '#ff9a0d'
		, '#ffc20d'
		, '#ffdb26'
		, '#ffff59'
		, '#ffc926'
		, '#ff9f1a'
		, '#ff720d'
		, '#ff5959'
		, '#e6456d'
		, '#ff599e'
		, '#f26dbb'
		, '#d96cbe'
		, '#cc5cc3'
	];

	utils.Color.liabilityColors27 = [
		'#ff4040'
		, '#ff5c40'
		, '#ff7940'
		, '#ff9640'
		, '#ffb340'
		, '#ffcf40'
		, '#ffe81a'
		, '#f7ff66'
		, '#ff8093'
		, '#f26d95'
		, '#f25ea1'
		, '#e650aa'
		, '#e660c4'
		, '#e673da'
		, '#e282ed'
		, '#c36cd9'
		, '#b55ce6'
		, '#a15ce6'
		, '#8550e6'
		, '#6e50e6'
		, '#615ccc'
		, '#626dd9'
		, '#8298d9'
		, '#9bdb79'
		, '#8fcc52'
		, '#b1e650'
		, '#cbf230'
	];

	utils.Color.liabilityColors40 = [
		'#FF4040'
		, '#ff5c40'
		, '#ff7940'
		, '#ff9640'
		, '#ffb340'
		, '#ffcf40'
		, '#ffe81a'
		, '#f7ff66'
		, '#cbf230'
		, '#b1e650'
		, '#8fcc52'
		, '#86db58'
		, '#93e67e'
		, '#8bf285'
		, '#99ffa3'
		, '#79f297'
		, '#5ce693'
		, '#8ae6bc'
		, '#91f2d5'
		, '#67e6d3'
		, '#6cd9d9'
		, '#52bacc'
		, '#1495cc'
		, '#2983cc'
		, '#4375bf'
		, '#4362bf'
		, '#5661bf'
		, '#5550b3'
		, '#6e50e6'
		, '#8550e6'
		, '#a15ce6'
		, '#b55ce6'
		, '#c36cd9'
		, '#e282ed'
		, '#e673da'
		, '#e660c4'
		, '#e650aa'
		, '#f25ea1'
		, '#cc5276'
		, '#cc3d53'
	];

	utils.Color.liabilityColors60 = [
		'#FF4040'
		, '#ff5340'
		, '#ff6640'
		, '#ff7940'
		, '#ff8c40'
		, '#ff9f40'
		, '#ffb340'
		, '#ffc640'
		, '#ffd940'
		, '#ffe81a'
		, '#ffff66'
		, '#dff230'
		, '#cbf230'
		, '#b9e650'
		, '#98d936'
		, '#8fcc52'
		, '#7ed941'
		, '#94d977'
		, '#93e67e'
		, '#a3ff99'
		, '#bfffbf'
		, '#99ffa3'
		, '#80ff99'
		, '#6df295'
		, '#5ce693'
		, '#7ee6b2'
		, '#95e6c5'
		, '#91f2d5'
		, '#6df2d8'
		, '#67e6d9'
		, '#6cd9d9'
		, '#52c0cc'
		, '#3dafcc'
		, '#14a4cc'
		, '#2b93d9'
		, '#4381bf'
		, '#4375bf'
		, '#4368bf'
		, '#435cbf'
		, '#5661bf'
		, '#5656bf'
		, '#6457d9'
		, '#6e50e6'
		, '#7d50e6'
		, '#8b57d9'
		, '#a15ce6'
		, '#ae5ce6'
		, '#b562d9'
		, '#c36cd9'
		, '#da73e6'
		, '#f279f2'
		, '#e673da'
		, '#e667cc'
		, '#e65cbc'
		, '#e650aa'
		, '#d94c92'
		, '#cc477c'
		, '#cc5276'
		, '#cc4762'
		, '#d93644'
	];

	// set reference back
	syboo.utils = utils;
	window.syboo = syboo;
})();