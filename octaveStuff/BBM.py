import math
import copy
import numpy
import matplotlib.pyplot as plt
from scipy.sparse import lil_matrix
from scipy.sparse.linalg import inv


dx = .1;
dt = .02;
#center = 5000;
amplitude = .5
print "starting"
numXs = 1000
xs = []
for a in range(numXs):
	xs.append(a * dx)

center = numXs * .1 * dx

nts = 300;#000;

	

yu = []
for x in xs:
	yu.append(1.5 * amplitude * (1 / math.cosh(.5 * (x-center) * math.sqrt(amplitude / (amplitude + 1))))**2);

initWave = copy.copy(yu);
yuMtx = numpy.matrix(yu).getT()
#print yuMtx
#plot (xr, yu, '-;thingy;', xr, .1*sin(xr), '-;otherthings;')

#populate with bbm
alpha = 1
#pause

tdx = 2 * dx;
kc = 0;
fod = lil_matrix((numXs, numXs));
for k in range(0, numXs - 1):
	fod[k, k+1] =  1 / tdx
	fod[k+1, k] =  -1 / tdx
	
#A=A.tocsr()
#for k=2:nr;
	# kc=kc+1; hiv(kc)=k; hjv(kc)=k-1; hsv(kc)=-(1/tdx);
# end
# for k=1:nr-1;
	# kc=kc+1; hiv(kc)=k; hjv(kc)=k+1; hsv(kc)=+(1/tdx);
# end
# fod=sparse(hiv,hjv,hsv);

svm = lil_matrix((numXs, numXs))

kc=0;

for k in range(numXs):
	svm[k, k] = alpha + 2 / (dx * dx)
for k in range(1, numXs):
	svm[k - 1, k] = -1 / (dx * dx)
	svm[k, k - 1] = -1 / (dx * dx)

fod = fod.tocsr()
svm = svm.tocsc()

for t in range(nts):
	
	yuMtxSqr = yuMtx.copy().getT().tolist()[0]
	
	for i in range(len(yuMtxSqr)):
		yuMtxSqr[i] *= yuMtxSqr[i]
	# print yuMtxSqr
	# print yuMtx.getT().tolist()
	# print 'next'
	#print dt * inv(svm) * (fod * (yuMtx + yuMtxSqr))
	# print yuMtx
	print t
	yuMtx = yuMtx - dt * inv(svm) * (fod * (yuMtx + numpy.matrix(yuMtxSqr).getT()))
	# print yuMtx

plt.plot(xs, yuMtx.getT().tolist()[0], 'r--', xs, yu, 'bs')
plt.ylabel('height')
plt.show()
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

