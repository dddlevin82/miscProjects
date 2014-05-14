import Image
import numpy as np
import os
import sys
import re
# am using row, column notation like a normal person

def loadImages(fn, n):
	f = open(fn, 'r')
	imgs = []
	myRe = re.compile('^END')
	img = []
	lines = f.readlines()
	size = len(lines[0].split())
	for line in lines:
		if not myRe.search(line):
			img.append([float(x) for x in line.split()])
		else:
			imgs.append(np.array(img, np.float64))
			img = []
			if len(imgs) == n:
				break
	return [np.array(imgs), len(imgs[0]), len(imgs[0][0])]


class StrongLearner:
	def __init__(self, weakLearners):
		self.learners = weakLearners
		self.normalizeWeights()
		self.offset = 0.
	def normalizeWeights(self):
		totalWeight = sum(ln.weight for ln in self.learners)
		for l in self.learners:
			l.weight /= totalWeight
	def learnOffset(self, faces, nonfaces, maxFalseNegFrac):
		offset = .5
		dOffset = offset / 10
		wrongs = len(faces)
		while float(wrongs) / len(faces) > maxFlaseNegFrac:
			wrongs = 0
			for i, img in enumerate(faces):
				if not self.evalImgLearn(img, offset):
					wrongs += 1
			offset -= dOffset
		offset += dOffset
		self.offset = offset

	def evalImgLearn(self, img, offset):
		sumWeaks = 0.
		for learner in self.learners:
			sumWeaks += learner.evalImg(img) * learner.weight
		return sumWeaks > offset

	def evalImg(self, img): #OY - YOU WILL NEED TO PASS IN THE DIMENSIONS OF THE WINDOW WE ARE LOOKING AT
		sumWeaks = 0.
		for learner in self.learners:
			sumWeaks += learner[0].evalImg(img) * learners[1]
		return sumWeaks > self.offset





class WeakLearner:
	def __init__(self, haar, p, rmin, rmax, cmin, cmax):

		self.haar = haar
		self.p = p
		self.cut = 0 #determined in testing
		self.rmin = rmin
		self.rmax = rmax
		self.cmin = cmin
		self.cmax = cmax
		self.weight = 0
	def copy(self):
		wl = WeakLearner(self.haar, self.p, self.rmin, self.rmax, self.cmin, self.cmax)
		wl.cut = self.cut
		return wl
	def trainOnImgs(self, faces, nonfaces, faceWeights, nonfaceWeights, cuts):
		#mushing all the cutoffs for a given position and p into one to save memory.  Can only use one anyway.  only select one
		#also - probably won't select the same one twice since its errors get more heavily weighted, so that's not a huge worry
		errors = []
		faceError = 0
		nonfaceError = 0
		rngFaces = range(len(faces))
		rngNon = range(len(nonfaces))
		for cut in cuts:
			faceError = 0
			nonfaceError = 0
			for i in rngFaces:
				if not self.evalImgTrain(faces[i], cut):
					faceError+=faceWeights[i]
			for i in rngNon:
				if self.evalImgTrain(nonfaces[i], cut):
					nonfaceError+=nonfaceWeights[i]
			errors.append((faceError, nonfaceError))
		minError = 100000000.
		idx = -1
		for i, err in enumerate(errors):
			error = err[0] + err[1]
			if error < minError:
				minError = error
				idx = i
		if idx == -1:
			print 'EEP! NO ERROR LESS THAN A GAZILLION'

		self.cut = cuts[idx]
		return errors[idx][0] + errors[idx][1]
	def yieldErrors(self, faces, nonfaces):

		faceErrors = np.zeros(len(faces), np.int32)
		nonfaceErrors = np.zeros(len(nonfaces), np.int32)
		for i, f in enumerate(faces):
			if not self.evalImg(f):
				faceErrors[i] = 1
		for i, n in enumerate(nonfaces):
			if self.evalImg(n):
				nonfaceErrors[i] = 1
		return [faceErrors, nonfaceErrors]

	def evalImgTrain(self, img, cut):
		shaper = img.shape[0]
		shapec = img.shape[1]
		rImin = int(round(shaper * rmin))
		rImax = int(round(shaper * rmax))
		cImin = int(round(shapec * cmin))
		cImax = int(round(shapec * cmax))
		normFact = (rImax - rImin) * (cImax - cImin)
		return int(self.p * self.haar(img, self.rmin, self.rmax, self.cmin, self.cmax, rImin, rImax, cImin, cImax) / norm < self.p * cut)
	def evalImg(self, img): #YOU WILL NEED TO PASS IN THE BOUNDS FOR THE WINDOW YOU ARE LOOKING AT.  THIS IS FINE FOR TRAINING ON THINGS THOUGH
		shaper = img.shape[0]
		shapec = img.shape[1]
		rImin = int(round(shaper * rmin))
		rImax = int(round(shaper * rmax))
		cImin = int(round(shapec * cmin))
		cImax = int(round(shapec * cmax))
		normFact = (rImax - rImin) * (cImax - cImin)
		return int(self.p * self.haar(img, self.rmin, self.rmax, self.cmin, self.cmax, rImin, rImax, cImin, cImax) / norm < self.p * self.cut)

def getIntense(img, rmin, rmax, cmin, cmax):
	return img[rmax][cmax] - img[rmin][cmax] - img[rmax][cmin] + img[rmin][cmin]


#for each, do two rotations and both parities.  Except 4.  Only need one rotation and both parities for that. switching parity is equil to rotating
#also, I would like not normalize by size window size, since otherwise a given theta would only apply at one dimension
def haarTwoHoriz(img, rmin, rmax, cmin, cmax, rImin, rImax, cImin, cImax):
	rcut = int(round(img.shape[0] * (rmin + rmax) / 2.))
	iA = getIntense(img, rcut, rImax, cImin, cImax)
	iB = getIntense(img, rIMin, rcut, cImin, cImax)
	return (iA - iB)


def haarTwoVert(img, rmin, rmax, cmin, cmax, rImin, rImax, cImin, cImax):
	ccut = int(round(img.shape[1] * (cmin + cmax) / 2.))
	iA = getIntense(img, rIMin, rImax, ccut, cImax)
	iB = getIntense(img, rIMin, rImax, cImin, ccut)
	return iA - iB

def haarThreeHoriz(img, rmin, rmax, cmin, cmax, rImin, rImax, cImin, cImax):
	rcutLow = int(round(img.shape[0] * (rmin + rmax) / 3.))
	rcutHigh = int(round(img.shape[0] * 2 * (rmin + rmax) / 3.))
	iA = getIntense(img, rIMin, rcutLow, cImin, cImax)
	iB = getIntense(img, rcutLow, rcutHigh, cImin, cImax)
	iC = getIntense(img, rcutHigh, rImax, cImin, cImax)
	return iB - iA - iC

def haarThreeVert(img, rmin, rmax, cmin, cmax, rImin, rImax, cImin, cImax):
	ccutLow = int(round(img.shape[1] * (cmin + cmax) / 3.))
	ccutHigh = int(round(img.shape[1] * 2 * (cmin + cmax) / 3.))
	iA = getIntense(img, rIMin, rImax, cImin, ccutLow)
	iB = getIntense(img, rIMin, rImax, ccutLow, ccutHigh)
	iC = getIntense(img, rIMin, rImax, ccutHigh, cImax)
	return iB - iA - iC

def haarFour(img, rmin, rmax, cmin, cmax, rImin, rImax, cImin, cImax):
	rcut = int(round(img.shape[0] * (rmin + rmax) / 2.))
	ccut = int(round(img.shape[1] * (cmin + cmax) / 2.))
	iA = getIntense(img, rIMin, rcut, cImin, ccut)
	iB = getIntense(img, rcut, rImax, cImin, ccut)
	iC = getIntense(img, rIMin, rcut, ccut, cImax)
	iD = getIntense(img, rcut, rImax, ccut, cImax)
	return (iA + iD) - (iB + iB)

#HEY - The learners will be paramatrized with positions being index values, then in production I'm going to convert them to fractional positions in the window since the window is variable

def updateWeights(ln, faces, nonfaces, faceWeights, nonfaceWeights):
	errFace, errNon = ln.yieldWeights(faces, nonfaces)
	#weights must sum to 1 at this point.  is assured by previous calling of this function
	innerProdFaces = np.dot(faceWeights, errFace)
	innerProdNonFaces = np.dot(nonfaceWeights, errNon)
	sumErr = innerProdFaces + innerProdNonFaces
	beta = sumErr / (1 - sumErr)
	ln.weight = math.log(1/beta)
	for i in range(len(faceWeights)):
		if errFace[i]:
			faceWeights[i] *= beta
	for i in range(len(nonfaceWeights)):
		if errNon[i]:
			nonfaceWeights *= beta
	allWeights = sum(faceWeights) + sum(nonfaceWeights)
	for i in range(len(faceWeights)):
		faceWeights[i] /= allWeights
	for i in range(len(nonfaceWeights)):
		nonfaceWeights[i] /= allWeights

#make huge list of all weak learners, copy out selected ones and then recycle list
def findWeakLearner(lns, faces, nonfaces, faceWights, nonfaceWeights):
	cutoffs = [-.5 + .1 * i for i in range(11)]
	minErr = sys.float_info.max
	minErrLn = None
	for ln in lns:
		thisErr = ln.trainOnImgs(faces, nonfaces, faceWeights, nonfaceWeights)
		if thisErr < minErr:
			minErr = thisErr
			minErrLn = ln
	#weights NOT updated by this
	return ln.copy()


def findStrongLearner(lns, faces, nonfaces, howmany):
	selectedLns = []
	faceWeights = np.array([fw for i in range(len(faces))], np.float64)
	nonfaceWeights = np.array([nfw for i in range(len(nonfaces))], np.float64)
	for i in range(howmany):
		selectedLns.append(findWeakLearner(lns, faces, nonfaces, faceWeights, nonfaceWeights))
		updateWeights(selectedLns[-1], faces, nonfaces, faceWeights, nonfaceWeights)
	return StrongLearner(selectedLns)

def assembleWeaks(nr, nc):
	lns = []
	#make all 2 verticals
	step = 1
	fnr = float(nr)
	fnc = float(nc)
	#vertical 2's
	for numCols in range(2, nc+1, 2 * step):
		for numRows in range(1, nr+1, step):
			for c in range(0, nc - numCols, step):
				for r in range(0, nr - numRows, step):
					cMinFrac = c / fnc
					cMaxFrac = (c + numCols) / fnc
					rMinFrac = r / fnr
					rMaxFrac = (r + numRows) / fnr
					lns.append(WeakLearner(haarTwoVert, 1, rMinFrac, rMaxFrac, cMinFrac, cMaxFrac))
					lns.append(WeakLearner(haarTwoVert, -1, rMinFrac, rMaxFrac, cMinFrac, cMaxFrac))

	#horizonal 2's
	for numRows in range(2, nr+1, 2 * step):
		for numCols in range(1, nc+1, step):
			for c in range(0, nc - numCols, step):
				for r in range(0, nr - numRows, step):
					cMinFrac = c / fnc
					cMaxFrac = (c + numCols) / fnc
					rMinFrac = r / fnr
					rMaxFrac = (r + numRows) / fnr
					lns.append(WeakLearner(haarTwoHoriz, 1, rMinFrac, rMaxFrac, cMinFrac, cMaxFrac))
					lns.append(WeakLearner(haarTwoHoriz, -1, rMinFrac, rMaxFrac, cMinFrac, cMaxFrac))
	#vertical 3's
	'''
	for numCols in range(3, nc+1, 3 * step):
		for numRows in range(1, nr+1, step):
			for c in range(0, nc - numCols, step):
				for r in range(0, nr - numRows, step):
					cMinFrac = c / fnc
					cMaxFrac = (c + numCols) / fnc
					rMinFrac = r / fnr
					rMaxFrac = (r + numRows) / fnr
					lns.append(WeakLearner(haarThreeVert, 1, rMinFrac, rMaxFrac, cMinFrac, cMaxFrac))
					lns.append(WeakLearner(haarThreeVert, -1, rMinFrac, rMaxFrac, cMinFrac, cMaxFrac))
	#horizontal 3's
	for numRows in range(3, nc+1, 3 * step):
		for numCols in range(1, nr+1, step):
			for c in range(0, nc - numCols, step):
				for r in range(0, nr - numRows, step):
					cMinFrac = c / fnc
					cMaxFrac = (c + numCols) / fnc
					rMinFrac = r / fnr
					rMaxFrac = (r + numRows) / fnr
					lns.append(WeakLearner(haarThreeHoriz, 1, rMinFrac, rMaxFrac, cMinFrac, cMaxFrac))
					lns.append(WeakLearner(haarThreeHoriz, -1, rMinFrac, rMaxFrac, cMinFrac, cMaxFrac))
	'''
	#not going to worry about diag diff ones just yet
	return np.array(lns)
#abs of normalized haar can be at MOST 0.5 (1 diff between the groups, then div by total # sqrs). cut must only sweep -.5, .5

#IMGS, NUMROWS, NUMCOLS = loadImages('../../../asIntFaces.txt', 2000)
allLearners = assembleWeaks(65, 65)
print len(allLearners)
#numClasses = [nums, from, that, paper]
#strongLearners = []
#for numClass

