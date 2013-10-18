import math
import copy
import numpy
import matplotlib.pyplot as plt
from time import time
from scipy.sparse import lil_matrix
from scipy.sparse.linalg import inv


#dx = .1
#dt = .02

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
	
def eulerStep(dt, svm, fod, yuMtx):
	return -dt * inv(svm) * (fod * (yuMtx + sqrVals(yuMtx)))
	
def iterateEuler(nts, yuMtx, dt, svm, fod):
	for t in range(nts):
		print t
		yuMtx = yuMtx + eulerStep(dt, svm, fod, yuMtx)#- dt * inv(svm) * (fod * (yuMtx + sqrVals(yuMtx)))	
	return yuMtx

def iteratePredCor(nts, yuMtx, dt, svm, fod):
	for t in range(nts):
		print t
		prediction = yuMtx + eulerStep(dt, svm, fod, yuMtx)
		yuMtx = .5 * (prediction + yuMtx + eulerStep(dt, svm, fod, prediction))
	return yuMtx
	
def iterateLeapFrog(nts, yuMtx, dt, svm, fod):
	yuLast = yuMtx.copy()
	yuMtx = iteratePredCor(1, yuMtx, dt, svm, fod)
	nts-=1
	for t in range(nts):
		print t + 1
		store = yuMtx.copy()
		yuMtx = yuLast + 2 * eulerStep(dt, svm, fod, yuMtx)
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
	amplitude = 1.
	print "starting"
	numXs = int(length / dx)
	print numXs
	xs = []
	for a in range(numXs):
		xs.append(a * dx)

	center = length * .2

	nts = numTimeSteps;#50  #000;

		

	yu = calcWaveAtTime(xs, amplitude, center, 0)

	initWave = copy.copy(yu);
	yuMtx = numpy.matrix(yu).getT()
	# plt.plot(xs, yu, 'r--')
	# plt.ylabel('height')
	# plt.show()
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
	timeInit = time()
	if (type == 'euler'):
		yuMtx = iterateEuler(nts, yuMtx, dt, svm, fod)
	elif (type == 'predCor'):
		yuMtx = iteratePredCor(nts, yuMtx, dt, svm, fod)
	elif (type == 'leapFrog'):
		yuMtx = iterateLeapFrog(nts, yuMtx, dt, svm, fod)
	
	yuActual = calcWaveAtTime(xs, amplitude, center, dt * nts)
	
	fracError = calcError(yuActual, yuMtx.getT().tolist()[0])
	
	predicted, = plt.plot(xs, yuMtx.getT().tolist()[0], 'r--')
	actual, = plt.plot(xs, yuActual, 'b:')
	plt.legend([actual, predicted], ["actual", "prediced"])
	plt.title(type + " with dx = " + str(dx) + ", dt = " + str(dt) + " for " + str(nts) + " steps, frac error = " + str(round(fracError, 3)) + " time = " + str(round(time() - timeInit)))
	plt.ylabel('height')
	plt.xlabel('x')
	plt.show()


runWave(.1, 100, .02, 30, 'euler')

#for t in range(nts):
	
# for k=1:nr;
	# kc=kc+1; iv(kc)=k; jv(kc)=k;
	# sv(kc)=alfa+(2/(dx*dx));
# end
# for k=2:nr;
	# kc=kc+1; iv(kc)=k-1; jv(kc)=k;
	# sv(kc)=-(1/(dx*dx));
# end

# for k=2:nr;
	# kc=kc+1; iv(kc)=k; jv(kc)=k-1;
	# sv(kc)=-(1/(dx*dx));
# end
# svm=sparse(iv,jv,sv);

# #cfl=dt/dx
# foo = "starting to iterate"
# wot = fod*(yu.');
# #euler
# wok = yu + yu .* yu;
# for k=1:nts
	# i=k
	# yu=yu-dt*svm\ (fod*((yu + yu .* yu).'));
# end
# plot(xr, initWave, '-;init;', xr, yu, '-;final;')
# pause

# #{
# //predictor corrector
# for k=1:nts
	# yuPred = yu - cfl*svm\ (fod(yu + yu .* yu));
	# yu = .5 * (yuPred + yu - dt * cfl * svm\ (fod(yuPred + yuPred .* yuPred)));
# end

# //leapfrog
# //yuLast = yu;
# //yuPred = yu - cfl*svm\ (fod(yu + yu .* yu))
# //yu = .5 * (yuPred + yu - dt * cfl * svm\ (fod(yuPred + yuPred .* yuPred)))

# /for k=1:nts
# //	yuTemp = yu;
# //	yu = yuLast - 2 * cfl * svm\ (fod(yu + yu .* yu));
# //	yuLast = yuTemp;
# //end
# #}

