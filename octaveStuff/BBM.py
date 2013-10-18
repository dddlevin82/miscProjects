import sys
import math
import copy
import numpy
import pylab
import matplotlib.pyplot as plt
from time import time
from scipy.sparse import lil_matrix
from scipy.sparse.linalg import inv

plotIdx = 0

def calcWaveAtTime(xs, amp, center, t):
	yu = []
	for x in xs:
		yu.append(1.5 * amp * (1 / math.cosh(.5 * (x - center - t * (1 + amp)) * math.sqrt(amp / (amp + 1))))**2)
	return yu
	
def sqrVals(mtx):
	mtx = mtx.copy()
	for a in mtx:
		a*=a
	return mtx
	
def eulerStep(dt, invSvm, fod, yuMtx):
	return -dt * (invSvm * (fod * (yuMtx + sqrVals(yuMtx))))
	
def iterateEuler(nts, yuMtx, dt, invSvm, fod):
	for t in range(nts):
		#print t
		yuMtx = yuMtx + eulerStep(dt, invSvm, fod, yuMtx)
	return yuMtx

def iteratePredCor(nts, yuMtx, dt, invSvm, fod):
	for t in range(nts):
		#print t
		prediction = yuMtx + eulerStep(dt, invSvm, fod, yuMtx)
		yuMtx = .5 * (prediction + yuMtx + eulerStep(dt, invSvm, fod, prediction))
	return yuMtx
	
def iterateLeapFrog(nts, yuMtx, dt, invSvm, fod):
	yuLast = yuMtx.copy()
	yuMtx = iteratePredCor(1, yuMtx, dt, invSvm, fod)
	nts-=1
	for t in range(nts):
		#print t + 1
		store = yuMtx.copy()
		yuMtx = yuLast + 2 * eulerStep(dt, invSvm, fod, yuMtx)
		yuLast = store
	return yuMtx

def findMaxIdx(xs, printme):
	maxIdx = 0
	for i in range(len(xs)):
		if (xs[i] > xs[maxIdx]):
			maxIdx = i
	return maxIdx

def avg(x, y):
	return .5 * (x + y)
	
def calcError(a, b):
	
	maxA = findMaxIdx(a, 'a')
	maxB = findMaxIdx(b, 'b')
	print maxA
	print maxB
	return abs(.5 * ((a[maxA] - b[maxA]) / avg(a[maxA], b[maxA]) + (a[maxB] - b[maxB]) / avg(a[maxB], b[maxB])))
	
def runWave(dx, length, dt, numTimeSteps, type):
	global plotIdx
	amplitude = 1.
	print "starting"
	numXs = int(length / dx)
	print numXs
	xs = []
	for a in range(numXs):
		xs.append(a * dx)

	center = length * .2

	nts = numTimeSteps;

	yu = calcWaveAtTime(xs, amplitude, center, 0)

	initWave = copy.copy(yu);
	yuMtx = numpy.matrix(yu).getT()
	alpha = 1

	tdx = 2 * dx;
	kc = 0;
	fod = lil_matrix((numXs, numXs));
	for k in range(0, numXs - 1):
		fod[k, k+1] =  1 / tdx
		fod[k+1, k] =  -1 / tdx
		

	svm = lil_matrix((numXs, numXs))

	kc=0;

	for k in range(numXs):
		svm[k, k] = alpha + 2 / (dx * dx)
	for k in range(1, numXs):
		svm[k - 1, k] = -1 / (dx * dx)
		svm[k, k - 1] = -1 / (dx * dx)

	fod = fod.tocsr()
	svm = svm.tocsc()
	invSvm = inv(svm)
	print 'Done inverting'
	timeInit = time()
	
	if (type == 'euler'):
		yuMtx = iterateEuler(nts, yuMtx, dt, invSvm, fod)
	elif (type == 'predCor'):
		yuMtx = iteratePredCor(nts, yuMtx, dt, invSvm, fod)
	elif (type == 'leapFrog'):
		yuMtx = iterateLeapFrog(nts, yuMtx, dt, invSvm, fod)
	
	yuActual = calcWaveAtTime(xs, amplitude, center, dt * nts)
	
	fracError = calcError(yuActual, yuMtx.getT().tolist()[0])
	
	predicted, = plt.plot(xs, yuMtx.getT().tolist()[0], 'r--')
	actual, = plt.plot(xs, yuActual, 'b:')
	plt.legend([actual, predicted], ["exact", "iterated"])
	plt.title(type + " with dx = " + str(dx) + ", dt = " + str(dt) + " for " + str(nts) + " steps,\n frac error = " + str(round(fracError, 6)) + ", time = " + str(round(time() - timeInit)) + ' sec')
	plt.ylabel('height')
	plt.xlabel('x')
	pylab.savefig(sys.argv[1] + str(plotIdx) + '.png', bbox_inches=0)
	plotIdx+=1



runWave(.2, 100, .04, 600, 'predCor')
runWave(.1, 100, .04, 600, 'predCor')
runWave(.05, 100, .04, 600, 'predCor')

runWave(.1, 100, .04, 600, 'predCor')
runWave(.1, 100, .02, 1200, 'predCor')
runWave(.1, 100, .01, 2400, 'predCor')

runWave(.2, 100, .04, 600, 'leapFrog')
runWave(.1, 100, .04, 600, 'leapFrog')
runWave(.05, 100, .04, 600, 'leapFrog')

runWave(.1, 100, .04, 600, 'leapFrog')
runWave(.1, 100, .02, 1200, 'leapFrog')
runWave(.1, 100, .01, 2400, 'leapFrog')


