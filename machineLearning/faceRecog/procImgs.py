import Image
import numpy as np
import os
import re
def toGreyscale(rgb):
	greyscale = np.zeros(len(rgb))
	print 'len is ' + str(len(greyscale))
	if ISGREYSCALE:
		for i in range(len(rgb)):
			greyscale[i] = rgb[i] / 255.0
	else:
		for i in range(len(rgb)):
			greyscale[i] = .2989 * rgb[i][0] / 255 + .5870 * rgb[i][1] / 255 + .1140 * rgb[i][2] / 255 # see stackoverflow.com/question/687261/converting-rgb-to-grayscale-intensity.  has to do with human perception
	return greyscale

def to2d(flat, nr, nc):
	img2d = []
	for i in range(len(flat) / nc):
		img2d.append(flat[nc*i : nc*(i+1)])
	return np.array(img2d, np.float64)

def toIntIntensity(as2d):
	intense = np.zeros((as2d.shape[0] + 1, as2d.shape[1] + 1), np.float64)
	#intense has bordering row, col, of zeros
	for nRow in range(0, as2d.shape[0]):
		sumCol = 0
		for nCol in range(0, as2d.shape[1]):
			sumCol += as2d[nRow][nCol]
			intense[nRow+1][nCol+1] = intense[nRow][nCol+1] + sumCol
	return intense


ISGREYSCALE = True

def processImgs(src, folder):
	fns = os.listdir(src)
	leFile = open(folder + 'asIntClass.txt', 'w')
	i=0
	testRe = re.compile('^class\.jpg$')
	for f in fns:
		if testRe.search(f):
			print i
			i += 1
			print f

			img = Image.open(src + f)
			nc, nr = img.size
			flatRGB = np.array(img.getdata())

			flatGreyscale = toGreyscale(flatRGB)
			as2d = to2d(flatGreyscale, nr, nc)
			asInt = toIntIntensity(as2d)
			for row in asInt:
				rowAsTxt = ' '.join([str(x) for x in row]) + '\n'
				leFile.write(rowAsTxt)
			leFile.write('END\n')
processImgs('../../../', '../../../')
