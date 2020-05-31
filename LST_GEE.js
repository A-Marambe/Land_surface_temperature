var bands=['B2', 'B3', 'B4', 'B5', 'B10']
var image= ee.Image(l8
    .filterBounds(point)
    .filterDate('2018-05-01', '2018-05-05')
    .sort('CLOUD_COVER')
    .first())
    .select(bands).multiply(0.0001);
    
