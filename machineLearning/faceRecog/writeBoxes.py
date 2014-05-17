import Image
import numpy as np

def loadWindows(fn):
	f = open(fn, 'r')
	windows = []
	for l in f.readlines():
		windows.append(tuple([int(x) for x in l.split()]))
	return np.array(windows, np.int32)

def to2d(flat, nr, nc):
	img2d = []
	for i in range(len(flat) / nc):
		img2d.append(flat[nc*i : nc*(i+1)])
	return np.array(img2d, np.float64)

def drawline(img, rowa, cola, rowb, colb):
	if rowa >= rowb:
		rowrange = range(rowb, rowa + 1)
	else:
		rowrange = range(rowa, rowb + 1)
	if cola >= colb:
		colrange = range(colb, cola + 1)
	else:
		colrange = range(cola, colb + 1)
	for r in rowrange:
		for c in colrange:
			img[r][c] = 255


img = Image.open('../../../class.jpg')
img1d = np.array(img.getdata())
img2d = to2d(img1d, 1280, 1600)

windows = loadWindows('faceOutlines.txt')

for w in windows:
	drawline(img2d, w[0], w[1], w[0], w[3])
	drawline(img2d, w[0], w[1], w[2], w[1])
	drawline(img2d, w[2], w[3], w[0], w[3])
	drawline(img2d, w[2], w[3], w[2], w[1])


withLines = Image.fromarray(img2d)
withLines.show()
#withLines.save('facesOutlines.bmp')
