import Image
import numpy as np
import os
# am using row, column notation like a normal person
def toGreyscale(rgb):
	greyscale = np.zeros(len(rgb))
	for i in range(len(rgb)):
		greyscale[i] = .2989 * rgb[i][0] / 255 + .5870 * rgb[i][1] / 255 + .1140 * rgb[i][2] / 255 # see stackoverflow.com/question/687261/converting-rgb-to-grayscale-intensity.  has to do with human perception
	return greyscale

def to2d(flat, nr, nc):
	img2d = []
	for i in range(len(flat) / nc):
		img2d.append(flat[nc*i : nc*(i+1)])
	return np.array(img2d, np.float64)

def toIntIntensity(as2d):
	intens = np.zeros(as2d.shape, np.float64)
	for i in range(as2d.shape[1]):
		intens[0][i] = np.sum(as2d[0][0:i+1])
	for i in range(as2d.shape[0]):
		summ = 0.
		for j in range(i+1):
			summ += as2d[j][0]
		intens[i][0] = summ #doing edges first

	for nRow in range(1, intens.shape[0]):
		sumCol = as2d[nRow][0]
		for nCol in range(1, intens.shape[1]):
			sumCol += as2d[nRow][nCol]
			intens[nRow][nCol] = intens[nRow-1][nCol] + sumCol
	return intens

def loadImages(folder, n):
	fns = os.listdir(folder)[:n]
	greys = []
	npImgs = []
	for f in fns:
		img = Image.open(folder + f)
		nc, nr = img.size
		flatRGB = np.array(img.getdata())
		flatGreyscale = toGreyscale(flatRGB)
		as2d = to2d(flatGreyscale, nr, nc)
		greys.append(as2d)
		npImgs.append(toIntIntensity(as2d))
	return [npImgs, greys]

imgs = loadImages('faces/', 1)

