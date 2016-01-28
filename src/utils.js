

const _ = require('./lodash');

/**
  * @ngdoc module
  * @name arcgisUtils
  * @module geoAPI
  * @description
  *
  * The `arcgisUtils` module provides arcgis online resource related functions.
  *
  * This module exports an object with the following properties
  * - `arcgisUtils` {type} esri/arcgis/utils class
  * - `generateConfig` {function} function make ramp style config based on ArcGIS online web resource id
  */

module.exports = function (esriBundle) {

	/**
     * @ngdoc method
     * @name generateConfig
     * @memberof arcgisUtils
     * @description make ramp style config based on ArcGIS online web resource id
     * @param {String} webMapId arcgis online web resource id or web map id
     * @return {Object} an object with config structure of a layer
     */
	function generateConfig(webMapId){
		// var aac_ecozone = 'df9cabb79d4c46c387d7942a1a18467e';

		var deferred = esriBundle.arcgisUtils.getItem(webMapId);

		var layer = {};

		deferred.then(function(data){
			if (_.has(data, 'item')) {
				let object = processWebMapItem(data['item'], layer);

				if (_.has(data, 'itemData')) {
					let layers = processWebMapData(data['itemData'], layer);
					// has item data, create layers object
					// todo: create a nested layer config item or split into different layers


				}else{
					// no itemData, create a layer config
					// todo: check the bare minimum for layer config for the viewer: id, url, layerType
					return object;
				}
			}
			console.log('Info: ', webMapId + ' does not have resources required to extract information.');
		}, function(error){
			console.log('Error:', error.code, ' Message: ', error.message);
		});
	}


	return {
        arcgisUtils: esriBundle.arcgisUtils,
        generateConfig: generateConfig
    };

    ///////////////////////////////////////////////////////////////////////////////////////

	// process web map item information
	// contains title, description, other metadata
	function processWebMapItem(data) {
		var layerInfo = {};

		setProperty(layerInfo, 'description', data, 'description');
		setProperty(layerInfo, 'spatialReference', data, 'spatialReference');
		setProperty(layerInfo, 'id', data, 'title');
		setProperty(layerInfo, 'url', data, 'url');
		setProperty(layerInfo, 'layerType', data, 'type');

		return layerInfo;
	}


	// check to see if data has the given property, then assign it to config object
	function setProperty(config, configProperty ,data, property){
		if(_.has(data, property)) {
			_.set(config, configProperty, _.get(data, property, ''));
		}
	}

	// process itemData
	function processWebMapData(data) {
		let config = {};

		let basemaps = processBaseMap(data);

		_.set(config, 'basemaps', basemaps);

		let layers = processOperationalLayers(data);
		_.set(config, 'layers', layers);

		let spatialReference = processSpatialReference(data);
		_.set(config, 'spatialReference', spatialReference);

		return config;
	}


	// return an array of basemap
	function processBaseMap(data) {

		if(_.has(data, 'baseMap')){

			let baseMapLayers = data['baseMap'];
			var basemaps = [];

			_.forEach(baseMapLayers, (baseMapLayer, key) => {
				// process baseMapLayer
				var lBasemap = {};
				_.set(lBasemap, 'id', baseMapLayer['id']);
				_.set(lBasemap, 'layerType', baseMapLayer['layerType']);
				_.set(lBasemap, 'url', baseMapLayer['url']);

				// test the following
				// let loWrap = _(baseMapLayer);
				// loWrap.get('id');
				// loWrap.get('layerType');
				// loWrap.get('url');
				// add to baseMapLayer collection in config
				basemaps.push(lBasemap);
			});

			return basemaps;
		}

		return null;
	}

	// process operational layers
	function processOperationalLayers(data) {

		if(_.has(data, 'operationalLayers')) {

			var layers = [];

			let operationalLayers = data['operationalLayers'];

			_.forEach(operationalLayers, (operationalLayer, key) => {
				// process operationLayer
				var lLayer = {};
				_.set(lLayer, 'id', operationalLayer['id']);
				_.set(lLayer, 'layerType', operationalLayer['layerType']);
				_.set(lLayer, 'title', operationalLayer['title']);
				_.set(lLayer, 'url', operationalLayer['url']);

				// add to the layer collection in config
				layers.push(lLayer);
			});

			return layers;
		}
		console.log('warning: no operationalLayers');
		return null;
	}


	// process spatial reference
	function processSpatialReference(data) {
		// get latestWkid, wkid
		if(_.has(data, 'spatialReference')){
			return { latestWkid: data['spatialReference']['latestWkid'], wkid: data['spatialReference']['wkid']};
		}
		console.log('warning: no spatialReference info.');
		return null;
	}

};
