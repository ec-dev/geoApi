const _ = require('lodash');

/**
  * @ngdoc module
  * @name utils
  * @module geoAPI
  * @description
  *
  * The `utils` module provides arcgis online resource related functions.
  *
  * This module exports an object with the following properties
  * - `utils` {type} esri/arcgis/utils class
  * - `generateConfig` {function} function make ramp style config based on ArcGIS online web resource id
  * <h4>TODO</h4>
  * <p>Update code to generate the standard config structure.</p>
  */

module.exports = function (esriBundle) {

    /**
     * @ngdoc method
     * @name generateConfig
     * @memberof utils
     * @description make ramp style config based on ArcGIS online web resource id
     * @param {String} webMapId arcgis online web resource id or web map id
     * @return {Object} an object with config structure of a layer
     */
    function generateConfig(webMapId) {
        // var aac_ecozone = 'df9cabb79d4c46c387d7942a1a18467e';
        return new Promise((resolve, reject) => {
            let deferred = esriBundle.utils.getItem(webMapId);

            deferred.then(function (data) {
                if (_.has(data, 'item')) {
                    let object = processWebMapItem(data.item);

                    if (_.has(data, 'itemData')) {
                        let config = processWebMapData(data.itemData);

                        // _.assign(config, object);
                        _.set(object, 'layerInfo', config);

                        // has item data, create config object
                        // todo: create a nested layer config item or split into different layers
                        resolve(object); // TODO incomplete
                    } else {

                        // no itemData, create a layer config
                        // todo: check the bare minimum for layer config for the viewer: id, url, layerType
                        resolve(object);
                    }
                } else {

                    // id provided does not have ArcGIS online resources asscoiated with it.
                    reject('No item or itemData to process');
                }

            }, function (error) {
                console.log('Error:', error.code, ' Message: ', error.message);
            });
        });
    }

    return {
        utils: esriBundle.utils,
        generateConfig: generateConfig
    };

    ///////////////////////////////////////////////////////////////////////////////////////

    // process web map item information
    // contains title, description, other metadata
    function processWebMapItem(data) {
        var layerInfo = {};

        // console.log('Process web map item');

        setProperty(layerInfo, 'description', data, 'description');
        setProperty(layerInfo, 'spatialReference', data, 'spatialReference');
        setProperty(layerInfo, 'id', data, 'title');
        setProperty(layerInfo, 'url', data, 'url');
        setProperty(layerInfo, 'layerType', data, 'type');

        return layerInfo;
    }

    // check to see if data has the given property, then assign it to config object
    function setProperty(config, configProperty, data, property) {
        if (_.has(data, property)) {
            _.set(config, configProperty, _.get(data, property, ''));
        }
    }

    // process itemData
    function processWebMapData(data) {
        let config = {};

        // console.log('process web map data.');
        let basemapsConfig = processBaseMap(data);
        _.set(config, 'basemaps', basemapsConfig);

        let layers = processOperationalLayers(data);
        _.set(config, 'layers', layers);

        let spatialReference = processSpatialReference(data);
        _.set(config, 'spatialReference', spatialReference);

        return config;
    }

    // return an array of basemap
    function processBaseMap(data) {
        var basemaps = [];
        var lBasemap = {};

        // check to make sure data has baseMap.baseMapLayers
        if (_.has(data, 'baseMap')) {

            if (_.has(data.baseMap, 'baseMapLayers')) {

                let baseMapArray = data.baseMap.baseMapLayers;

                _.forEach(baseMapArray, function (basemapItem) {

                    lBasemap = {};
                    console.log('basemap id:' + basemapItem.id);

                    // process baseMapLayer and create a new  basemap config setting object
                    _.set(lBasemap, 'id', basemapItem.id);
                    _.set(lBasemap, 'layerType', basemapItem.layerType);
                    _.set(lBasemap, 'url', basemapItem.url);

                    basemaps.push(lBasemap);
                });
                return basemaps;
            }
        }

        return null;
    }

    // process operational layers
    function processOperationalLayers(data) {
        var layers = [];
        var lLayer = {};

        // make sure operationalLayers exists
        if (_.has(data, 'operationalLayers')) {

            let operationalLayers = data.operationalLayers;

            _.forEach(operationalLayers, function (operationalLayer) {

                // process operationLayer
                lLayer = {};
                _.set(lLayer, 'id', operationalLayer.id);
                _.set(lLayer, 'layerType', operationalLayer.layerType);
                _.set(lLayer, 'title', operationalLayer.title);
                _.set(lLayer, 'url', operationalLayer.url);

                // add to the layer collection in config
                layers.push(lLayer);
            });

            return layers;
        } else {

            // console.log('warning: no operationalLayers');
            return null;
        }

    }

    // process spatial reference
    function processSpatialReference(data) {

        // get latestWkid, wkid
        if (_.has(data, 'spatialReference')) {
            return { latestWkid: data.spatialReference.latestWkid,
                wkid: data.spatialReference.wkid };
        } else {

            // console.log('warning: no spatialReference info.');
            return null;
        }
    }

};
