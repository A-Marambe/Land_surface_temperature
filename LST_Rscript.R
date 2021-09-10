#Land Surface Temperature-automation code-by Yahampath Anuruddha Marambe------
#This code provide Land Surface Temperature images using optical satelite images 
#bands - red, NIR and thermalIR bands

# packages
library(rgdal)
library(raster)
library(ggplot2)

setwd("D:/LST/Kandyimage")

# reading landsat image
landsat_mult <- brick("reflectnce_sub")
print(landsat_mult)
plot(landsat_mult)

#plotRGB(landsat_mult, r=4, b=3, g=2, stretch="lin", main="bands 432")
#plotRGB(landsat_mult, r=5, b=4, g=3, stretch="lin", main="bands 543")

#NDVI

# reading bands
band4 <- raster(landsat_mult, layer=4)
band5 <- raster(landsat_mult, layer=5)

# calculate NDVI
NDVI <- (band5-band4)/(band5+band4)
plot(NDVI)
print(NDVI)
maxVI <- cellStats(NDVI, max)
maxVI
minVI <- cellStats(NDVI, min)
minVI

# reading thermal band
Thermal <- brick("Thermal_sub")
print(Thermal)
plot(Thermal)
band10 <- raster(Thermal, layer=1)
plot(band10)

#TOA of thermal band,gain, offset,( RADIANCE_MULT_BAND_x, RADIANCE_ADD_BAND_x (from meta data) )
L <- (0.0003342*band10)+0.1
plot(L)

#Brightness temperature
BT <- 1321.0789/(log((774.8853/L)+1))
plot(BT)

#K2=1321.0789, k1=774.8853
#factional vegetation Pv
fv <- ((NDVI-(minVI))/(maxVI-(minVI)))^2
plot(fv)

#Emissivity
EM <- 0.004*fv+0.986
plot(EM)

#BT=brick("BT_R10")
#print(BT)
#plot(BT)

#LST  in kelvin
LST <- (BT/(1+(0.00115*BT/1.4388)*log(EM)))
print(LST)
plot(LST)

# LST in celcius
LST_celci <- LST-273.15
plot(LST_celci)
print(LST_celci)

#save the LST file for further processing in ENVI/ArcMAP/Qgis
writeRaster(LST_celci, 'LSTR_an', format = "GTiff")
