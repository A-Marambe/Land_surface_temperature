/* open the landast image and cloud masking using pixel qa band
 * Bits 3 and 5 are cloud and shadows
*/

// image filter dates
var start_date = '2020-04-01';
var end_date = '2020-05-20';

// bands to select here B, G, R, NIR, TIR for NDVI and brightness temperature
var bands=['B2', 'B3', 'B4', 'B5', 'B10']

var point = ee.Geometry.Point([-90.22,38.64]);
var city_box = ee.Geometry.Polygon({
  coords: [
    [[-90.4064254393795,38.49100677398242], [-89.94225307609825,38.49100677398242],
    [-89.94225307609825,38.7677925024809], [-90.4064254393795,38.76779250248090],
    [-90.4064254393795,38.491006773982420]]
  ],
  evenOdd: false
});

Map.addLayer(city_box, {color: 'FF0000'}, 'city box');



// masking function definition
function mask_image(image) {
  var cloudShadowBitMask = (1 << 3);
  var cloudBitMask = (1 << 5);
  var qa = image.select('pixel_qa');
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                  .and(qa.bitwiseAnd(cloudBitMask).eq(0));
  return image.updateMask(mask);

}


var ls8_data = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
                  .filterDate(start_date, end_date)
                  .map(mask_image);


var image= ee.Image(ls8_data
    .filterBounds(point)
    .sort('CLOUD_COVER')
    .first())
    .select(bands).multiply(0.0001);

var visParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000,
  gamma: 1.4,
};
Map.setCenter(-90.22,38.64, 9);
//Map.addLayer(ls8_data.median(), visParams);



//NDVI
var red=image.select('B4');
var nir=image.select('B5');
var ndvi= nir.subtract(red).divide(nir.add(red)).rename('NDVI');
print(ndvi);

//var ndviparas={min:-1, max:1, palette:['blue', 'white', 'green']};
//Map.addLayer(ndvi, ndviparas, 'NDVI image');

// clip the NDVI image
var ndviClip = ndvi.clip(city_box);
Map.addLayer(ndviClip, {min: -1, max: 1, palette: ['FF0000', '00FF00']});



//select thermal band 10(with brightness tempereature), no BT calculation needed
var thermal10= image.select('B10').multiply(1000);
var thermal=thermal10.clip(city_box);
//Map.addLayer(thermal, {min: 270, max: 400, palette: ['FF0000', '00FF00']});


// find the min of NDVI

var min = ee.Number(ndviClip.reduceRegion({
  reducer: ee.Reducer.min(),
  geometry: city_box,
  scale: 30,
  maxPixels: 1e9
}).values().get(0));

print(min);

var max = ee.Number(ndviClip.reduceRegion({
  reducer: ee.Reducer.max(),
  geometry: city_box,
  scale: 30,
  maxPixels: 1e9
}).values().get(0));

print(max)


//fractional vegetation

var fv = ndviClip.subtract(min).divide(max.subtract(min)).rename('FV');
print(fv)
//Map.addLayer(fv, {min: 0, max: 1.5, palette: ['FF0000', '00FF00']},'FV');


//Emisivity

var a= ee.Number(0.004);
var b= ee.Number(0.986);
var EM=fv.multiply(a).add(b).rename('EMM');
//Map.addLayer(EM, {min: 0, max: 1.5, palette: ['FF0000', '00FF00']},'EMM');


//LST
var c=ee.Number(1);
var d=ee.Number(0.00115);
var f=ee.Number(1.4388);

var p1= thermal.multiply(d).divide(f);
var x= ee.Image(EM);
var p2=x.log();
var p3= (p1.multiply(p2)).add(c);

var LST= (thermal.divide(p3)).rename('LST');
//Map.addLayer(LST, {min: 0, max: 350, palette: ['09083f', '1774ff', '2fc299', '43ff40', '24da0f', '068f17', 'e450ff', 'be277a', 'ff2f5f', 'ff1556', 'ffe42b', 'ff3413' ]}, 'LST');

Map.addLayer(LST,
            {min: 0, max: 350,
            palette: ['09083f', '1774ff', '2fc299', '43ff40', '24da0f',
            '068f17', 'e450ff', 'be277a', 'ff2f5f', 'ff1556', 'ffe42b', 'ff3413' ]},
            'LST');

var t=ee.Number(273.15);
var LSTcel= LST.subtract(t).rename('LSTcel');
//Map.addLayer(LSTcel, {min: 0, max: 40, palette: ['FF0000', '00FF00']}, 'LSTcel');

Map.addLayer(LSTcel,
            {min: 0, max: 40,
            palette: ['09083f', '1774ff', '2fc299', '43ff40', '24da0f',
            '068f17', 'e450ff', 'be277a', 'ff2f5f', 'ff1556', 'ffe42b', 'ff3413' ]},
            'LST');



//Export the image to an Earth Engine asset.
/*Export.image.toAsset({
  image: LSTcel,
  description: 'imageToAssetExample',
  assetId: 'LSTcel',
  scale: 30
});
*/
