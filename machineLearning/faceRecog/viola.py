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
	intense = np.zeros((as2d.shape[0] + 1, as2d.shape[1] + 1), np.float64)
	#intense has bordering row, col, of zeros
	for nRow in range(0, as2d.shape[0]):
		sumCol = 0
		for nCol in range(0, as2d.shape[1]):
			sumCol += as2d[nRow][nCol]
			intense[nRow+1][nCol+1] = intense[nRow][nCol+1] + sumCol
	return intense

def loadImages(folder, n):
	fns = os.listdir(folder)[:n]
	npImgs = []
	for f in fns:
		img = Image.open(folder + f)
		nc, nr = img.size
		flatRGB = np.array(img.getdata())
		flatGreyscale = toGreyscale(flatRGB)
		as2d = to2d(flatGreyscale, nr, nc)
		npImgs.append(toIntIntensity(as2d))
	return npImgs
class Learner:
	def __init__(haar, p, cut, pos, trace):
		self.haar = haar
		self.p = p
		self.cut = cut
		self.pos = pos #in index values
		self.trace = trace #also in index values
	def eval(img, rmin, rmax, cmin, cmax):
		return int(self.p * self.haar(img, rmin, rmax, cmin, cmax) < self.p * self.cut)


def getIntense(img, rmin, rmax, cmin, cmax):
	return img[rmax][cmax] - img[rmin][cmax] - img[rmax][cmin] + img[rmin][cmin]

def haarTwoRecHorix(img, rmin, rmax, cmin, cmax):
	rcut = int(round((rmin + rmax) / 2.))
	iA = getIntense(img, rcut, rmax, cmin, cmax)
	iB = getIntense(img, rmin, rcut, cmin, cmax)
	return iA - iB


def haarTwoRecHoriz(img, rmin, rmax, cmin, cmax):
	ccut = int(round((cim + cmax) / 2.))
	iA = getIntense(img, rmin, rmax, ccut, cmax)
	iB = getIntense(img, rmin, rmax, cmin, ccut)
	return iA - iB


imgs = loadImages('faces/', 1)
'''
a = imgs[0][0]
b = imgs[1][0]
rr = 40
cc = 30
s = 0.
for r in range(rr):
	for c in range(cc):
		s += b[r][c]
print s
print a[rr][cc]


'''
