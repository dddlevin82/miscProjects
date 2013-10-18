import math
import copy
import numpy
import matplotlib.pyplot as plt
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
	
def iterateEuler(nts, yuMtx, dt, svm, fod):
	for t in range(nts):
		print t
		yuMtx = yuMtx - dt * inv(svm) * (fod * (yuMtx + sqrVals(yuMtxSqr)))	
	return yuMtx

def iteratePredCor(nts, yuMtx, dt, svm, fod):
	for t in range(nts):
		yuMtxSqr = yuMtx.copy();
		for a 

def runWave(dx, length, dt, numTimeSteps, type):
	amplitude = 1.
	print "starting"
	numXs = round(length / dx)
	xs = []
	for a in range(numXs):
		xs.append(a * dx)

	center = numXs * .2 * dx#meh

	nts = numTimeSteps;#50  #000;

		

	yu = calcWaveAtTime(xs, amplitude, center, 0)

	initWave = copy.copy(yu);
	yuMtx = numpy.matrix(yu).getT()
	plt.plot(xs, yu, 'r--')
	plt.ylabel('height')
	plt.show()
	alpha = 1
	#pause

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
	
	if (type == 'euler'):
		yuMtx = iterateEuler(nts, yuMtx, dt, svm, fod)
	for t in range(nts):
		
		yuMtxSqr = yuMtx.copy()
		for a in yuMtxSqr:
			a*=a
		print t
		yuMtx = yuMtx - dt * inv(svm) * (fod * (yuMtx + yuMtxSqr))
	
	yuActual = calcWaveAtTime(xs, amplitude, center, dt * nts)
	
	plt.plot(xs, yuMtx.getT().tolist()[0], 'r--', xs, yuActual, 'bs')
	plt.ylabel('height')
	plt.show()
	
runWave(.1, 100, .02, 1., 'lala')
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

